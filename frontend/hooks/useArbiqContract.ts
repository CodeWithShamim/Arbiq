"use client";

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useAccount, useWalletClient } from "wagmi";
import { parseEther } from "viem";
import type { CalldataEncodable, TransactionHash } from "genlayer-js/types";
import { isDecidedState, transactionsStatusNumberToName } from "genlayer-js/types";
import { genLayerClient, createClient, testnetBradbury, CONTRACT_ADDRESS, readContract } from "@/lib/genlayer/client";
import type { Job } from "@/lib/types";

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
    async (hash: TransactionHash, maxRetries: number) => {
      setTxState((s) => ({ ...s, status: "finalizing", consensusStatus: "PENDING" }));

      // Poll getTransaction directly at 1s intervals instead of using the black-box
      // waitForTransactionReceipt (which sleeps 3s between attempts with no live updates).
      // This gives us real-time consensusStatus updates AND reaches decided state ~3x faster.
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        await new Promise((r) => setTimeout(r, 1_000));
        try {
          const tx = await genLayerClient.getTransaction({ hash });
          const statusNum = String(tx.status);
          // transactionsStatusNumberToName maps "5" → "ACCEPTED", "2" → "PROPOSING", etc.
          const statusName = transactionsStatusNumberToName[statusNum as keyof typeof transactionsStatusNumberToName] ?? "PENDING";

          // Surface the live phase in the UI on every tick
          setTxState((s) => ({ ...s, consensusStatus: statusName }));

          if (isDecidedState(statusNum)) {
            const leaderResult = (tx as Record<string, unknown>)?.consensus_data;
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
              consensusStatus: statusName,
              returnValue,
            }));
            queryClient.invalidateQueries({ queryKey: ["arbiq"] });
            return;
          }
        } catch {
          // getTransaction may 404 briefly after submission — keep polling
        }
      }

      setTxState((s) => ({
        ...s,
        status: "error",
        error: `Timed out after ${maxRetries}s waiting for consensus`,
      }));
    },
    [queryClient]
  );

  const send = useCallback(
    async ({
      functionName,
      args,
      value,
      // retries = max seconds to wait (1 poll/sec). 90s for deterministic, 300s for AI.
      retries = 90,
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
        // AI evaluation needs more time for LLM inference across validator nodes
        retries: 300,
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

// ─── Chat hooks ───────────────────────────────────────────────────────────────

export interface ChatMessage {
  sender: string;
  content: string;
  role: "client" | "freelancer";
  timestamp: number;
  optimistic?: boolean;
}

export function useGetMessages(jobId: number | undefined) {
  return useQuery({
    queryKey: ["arbiq", "messages", jobId],
    queryFn: async () => {
      if (jobId === undefined) return [] as ChatMessage[];
      const raw = await readContract("get_messages", [jobId]);
      try {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        return (Array.isArray(parsed) ? parsed : []) as ChatMessage[];
      } catch {
        return [] as ChatMessage[];
      }
    },
    enabled: jobId !== undefined,
    refetchInterval: 10_000,
  });
}

export function useSendMessage() {
  const { send, txState, reset } = useContractWrite();

  const sendMessage = useCallback(
    (jobId: number, content: string) =>
      send({ functionName: "send_message", args: [jobId, content] }),
    [send]
  );

  return {
    sendMessage,
    txState,
    reset,
    isLoading: txState.status === "pending" || txState.status === "finalizing",
  };
}
