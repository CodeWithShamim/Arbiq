"use client";

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useAccount, useWalletClient } from "wagmi";
import { parseEther } from "viem";
import type { CalldataEncodable, TransactionHash } from "genlayer-js/types";
import { TransactionStatus } from "genlayer-js/types";
import { genLayerClient, createClient, testnetBradbury, CONTRACT_ADDRESS } from "@/lib/genlayer/client";
import type { Job } from "@/lib/types";

// ─── Read helpers ─────────────────────────────────────────────────────────────
// genLayerClient.readContract sends gen_call(type:"read") → msgpack encodes args,
// decodes the msgpack response, and returns a JS-safe value automatically.

async function readContract(method: string, args: CalldataEncodable[] = []): Promise<unknown> {
  return genLayerClient.readContract({
    address: CONTRACT_ADDRESS,
    functionName: method,
    args,
  });
}

function parseJobsJson(raw: unknown): Job[] {
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return [];
    return parsed as Job[];
  } catch {
    return [];
  }
}

function parseJobJson(raw: unknown): Job | null {
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as Job;
  } catch {
    return null;
  }
}

// ─── Read hooks ───────────────────────────────────────────────────────────────

export function useGetAllJobs() {
  return useQuery({
    queryKey: ["arbiq", "allJobs"],
    queryFn: async () => {
      const raw = await readContract("get_all_jobs");
      return parseJobsJson(raw);
    },
    refetchInterval: 15_000,
    retry: 2,
  });
}

export function useGetJob(id: number | undefined) {
  return useQuery({
    queryKey: ["arbiq", "job", id],
    queryFn: async () => {
      if (id === undefined) return null;
      const raw = await readContract("get_job", [id]);
      return parseJobJson(raw);
    },
    enabled: id !== undefined,
    refetchInterval: 10_000,
  });
}

export function useGetMyJobs(address: string | undefined) {
  const { data: allJobs = [] } = useGetAllJobs();
  return {
    postedJobs: address
      ? allJobs.filter((j) => j.client.toLowerCase() === address.toLowerCase())
      : [],
    activeJobs: address
      ? allJobs.filter((j) => j.freelancer.toLowerCase() === address.toLowerCase())
      : [],
  };
}

export function useGetJobCount() {
  return useQuery({
    queryKey: ["arbiq", "jobCount"],
    queryFn: () => readContract("get_job_count"),
    refetchInterval: 30_000,
  });
}

// ─── Write hook factory ───────────────────────────────────────────────────────
// GenLayer write flow:
//   1. genLayerClient.writeContract() → msgpack-encodes args, sends eth_sendTransaction
//      to the CONSENSUS contract (not the app contract directly), returns a txId (bytes32 hash)
//   2. genLayerClient.waitForTransactionReceipt() → polls gen_getTransaction until
//      status reaches ACCEPTED (validators have reached consensus)
//   3. Receipt contains consensus_data.leader_receipt[].result — the contract return value

interface TxState {
  txHash: TransactionHash | null;
  // pending    = submitted to mempool, waiting for consensus to pick it up
  // finalizing = consensus is running (validators proposing / committing / revealing)
  // finalized  = ACCEPTED by consensus — state is committed
  // error      = any failure
  status: "idle" | "pending" | "finalizing" | "finalized" | "error";
  // Human-readable consensus status from gen_getTransaction (PROPOSING, COMMITTING, etc.)
  consensusStatus: string | null;
  // Decoded return value from the leader receipt (e.g. job_id for post_job)
  returnValue: unknown | null;
  error: string | null;
}

function useContractWrite() {
  const { address } = useAccount();
  // walletClient is the wagmi-managed EIP-1193 provider for the connected wallet
  // (RainbowKit, WalletConnect, Coinbase, etc.) — NOT tied to window.ethereum
  const { data: walletClient } = useWalletClient();
  const queryClient = useQueryClient();

  const [txState, setTxState] = useState<TxState>({
    txHash: null,
    status: "idle",
    consensusStatus: null,
    returnValue: null,
    error: null,
  });

  const reset = useCallback(() => {
    setTxState({ txHash: null, status: "idle", consensusStatus: null, returnValue: null, error: null });
  }, []);

  const pollStatus = useCallback(
    async (hash: TransactionHash, retries: number) => {
      setTxState((s) => ({ ...s, status: "finalizing", consensusStatus: "PENDING" }));
      try {
        // waitForTransactionReceipt polls gen_getTransaction until status is ACCEPTED.
        // ACCEPTED means enough validators agreed — the state mutation is committed.
        const receipt = await genLayerClient.waitForTransactionReceipt({
          hash,
          status: TransactionStatus.ACCEPTED,
          retries,
          interval: 3_000,
        });

        // Extract the leader's return value from consensus receipt
        // consensus_data.leader_receipt is an array of validator receipts; index 0 is leader
        const leaderResult = (receipt as Record<string, unknown>)?.consensus_data;
        let returnValue: unknown = null;
        if (leaderResult && typeof leaderResult === "object") {
          const lr = (leaderResult as Record<string, unknown>).leader_receipt;
          if (Array.isArray(lr) && lr.length > 0) {
            returnValue = (lr[0] as Record<string, unknown>).result ?? null;
          }
        }

        setTxState((s) => ({
          ...s,
          status: "finalized",
          consensusStatus: "ACCEPTED",
          returnValue,
        }));
        queryClient.invalidateQueries({ queryKey: ["arbiq"] });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Transaction failed";
        setTxState((s) => ({ ...s, status: "error", error: msg }));
      }
    },
    [queryClient]
  );

  const send = useCallback(
    async ({
      functionName,
      args,
      value,
      // Higher retries for non-deterministic (AI) calls — they take longer to reach consensus
      retries = 60,
    }: {
      functionName: string;
      args: CalldataEncodable[];
      value?: bigint;
      retries?: number;
    }) => {
      if (!address || !walletClient) {
        setTxState((s) => ({ ...s, status: "error", error: "Wallet not connected" }));
        return null;
      }

      setTxState({ txHash: null, status: "pending", consensusStatus: null, returnValue: null, error: null });

      try {
        // account must be a plain address STRING (not an object) so that genlayer-js
        // sets isAddress=true and routes eth_sendTransaction through the provider.
        // If account is an object, isAddress=false and the call goes to the RPC node
        // which has no signer — causing "node has no signer accounts".
        const writeClient = createClient({
          chain: testnetBradbury,
          provider: walletClient,   // wagmi's EIP-1193 wallet, not window.ethereum
          account: address,         // string → isAddress=true → uses provider for signing
        });

        // writeContract:
        //   - msgpack-encodes functionName + args
        //   - sends the encoded payload to the consensus main contract address
        //   - walletClient signs & broadcasts the EVM tx (not window.ethereum)
        //   - extracts the GenLayer txId from the CreatedTransaction event log
        //   - returns that txId (used for polling, NOT an EVM tx hash)
        const txHash = await writeClient.writeContract({
          address: CONTRACT_ADDRESS,
          functionName,
          args,
          value: value ?? 0n,
        });

        setTxState((s) => ({ ...s, txHash: txHash as TransactionHash }));

        // Poll asynchronously so the caller gets the txHash immediately
        pollStatus(txHash as TransactionHash, retries);

        return txHash;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Transaction failed";
        setTxState({ txHash: null, status: "error", consensusStatus: null, returnValue: null, error: msg });
        return null;
      }
    },
    [address, walletClient, pollStatus]
  );

  // Simulate a write without submitting — uses gen_call(type:"write") on the node.
  // Useful for previewing the return value (e.g. job_id) before spending gas.
  const simulate = useCallback(
    async ({ functionName, args }: { functionName: string; args: CalldataEncodable[] }) => {
      if (!address) throw new Error("Wallet not connected");
      // simulate uses the read-only client — gen_call(type:"write") needs no wallet
      return genLayerClient.simulateWriteContract({
        address: CONTRACT_ADDRESS,
        functionName,
        args,
      });
    },
    [address]
  );

  return { send, simulate, txState, reset, isConnected: !!address };
}

// ─── Public write hooks ───────────────────────────────────────────────────────

export function usePostJob() {
  const { send, simulate, txState, reset, isConnected } = useContractWrite();

  const postJob = useCallback(
    (params: { title: string; description: string; deadline: string; budgetEth: string }) =>
      send({
        functionName: "post_job",
        args: [params.title, params.description, params.deadline],
        value: parseEther(params.budgetEth),
      }),
    [send]
  );

  // Preview the job_id that would be assigned without submitting the tx
  const simulatePostJob = useCallback(
    (params: { title: string; description: string; deadline: string; budgetEth: string }) =>
      simulate({
        functionName: "post_job",
        args: [params.title, params.description, params.deadline],
      }),
    [simulate]
  );

  return {
    postJob,
    simulatePostJob,
    txState,
    reset,
    isConnected,
    isLoading: txState.status === "pending" || txState.status === "finalizing",
  };
}

export function useTakeJob() {
  const { send, txState, reset, isConnected } = useContractWrite();

  const takeJob = useCallback(
    (jobId: number) => send({ functionName: "take_job", args: [jobId] }),
    [send]
  );

  return {
    takeJob,
    txState,
    reset,
    isConnected,
    isLoading: txState.status === "pending" || txState.status === "finalizing",
  };
}

export function useSubmitDelivery() {
  const { send, txState, reset, isConnected } = useContractWrite();

  const submitDelivery = useCallback(
    (jobId: number, evidenceUrl: string, evidenceNote: string) =>
      send({
        functionName: "submit_delivery",
        args: [jobId, evidenceUrl, evidenceNote],
      }),
    [send]
  );

  return {
    submitDelivery,
    txState,
    reset,
    isConnected,
    isLoading: txState.status === "pending" || txState.status === "finalizing",
  };
}

export function useAutoEvaluate() {
  const { send, txState, reset, isConnected } = useContractWrite();

  const autoEvaluate = useCallback(
    (jobId: number) =>
      send({
        functionName: "auto_evaluate",
        args: [jobId],
        // AI evaluation takes longer — more validator rounds needed
        retries: 120,
      }),
    [send]
  );

  return {
    autoEvaluate,
    txState,
    reset,
    isConnected,
    isLoading: txState.status === "pending" || txState.status === "finalizing",
  };
}

export function useRelease() {
  const { send, txState, reset, isConnected } = useContractWrite();

  const release = useCallback(
    (jobId: number) => send({ functionName: "release_manually", args: [jobId] }),
    [send]
  );

  return {
    release,
    txState,
    reset,
    isConnected,
    isLoading: txState.status === "pending" || txState.status === "finalizing",
  };
}
