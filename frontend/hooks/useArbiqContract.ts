"use client";

import { useState, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useAccount, useWalletClient } from "wagmi";
import { parseEther } from "viem";
import type { CalldataEncodable, TransactionHash } from "genlayer-js/types";
import { isDecidedState, transactionsStatusNumberToName } from "genlayer-js/types";
import {
  genLayerClient,
  createClient,
  testnetBradbury,
  CONTRACT_ADDRESS,
  readContract,
  invalidateReadCache,
} from "@/lib/genlayer/client";
import type { Job } from "@/lib/types";
import { useError } from "@/lib/error-context";
import { friendlyError } from "@/lib/errors";

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
    staleTime: 20_000,
    refetchInterval: 30_000,
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
    staleTime: 10_000,
    refetchInterval: 15_000,
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
//   1. writeClient.writeContract() → msgpack-encodes args, sends eth_sendTransaction
//      to the CONSENSUS contract, returns a txId (bytes32 hash)
//   2. pollStatus() → polls gen_getTransaction every 500ms until decided state
//   3. On decided: invalidate React Query cache + read cache for fresh data

interface TxState {
  txHash: TransactionHash | null;
  status: "idle" | "pending" | "finalizing" | "finalized" | "error";
  consensusStatus: string | null;
  returnValue: unknown | null;
  error: string | null;
}

const IDLE: TxState = {
  txHash: null,
  status: "idle",
  consensusStatus: null,
  returnValue: null,
  error: null,
};

// Methods whose cached reads must be busted after any write
const WRITE_INVALIDATES = ["get_all_jobs", "get_job", "get_job_count", "get_messages"];

function useContractWrite() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const queryClient = useQueryClient();
  const { showError } = useError();

  // Cache the write client so it isn't re-created on every send()
  const writeClientRef = useRef<ReturnType<typeof createClient> | null>(null);

  const [txState, setTxState] = useState<TxState>(IDLE);

  const reset = useCallback(() => setTxState(IDLE), []);

  const pollStatus = useCallback(
    async (hash: TransactionHash, maxRetries: number) => {
      setTxState((s) => ({ ...s, status: "finalizing", consensusStatus: "PENDING" }));

      // Wait a fixed 2s for the tx to land before starting to poll —
      // avoids burning retries on guaranteed 404s right after submission.
      await new Promise((r) => setTimeout(r, 2_000));

      // Then poll every 500ms for fast finalization detection.
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const tx = await genLayerClient.getTransaction({ hash });
          const statusNum = String(tx.status);
          const statusName =
            transactionsStatusNumberToName[
              statusNum as keyof typeof transactionsStatusNumberToName
            ] ?? "PENDING";

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

            // Bust both the in-memory read cache and React Query cache
            invalidateReadCache(...WRITE_INVALIDATES);
            queryClient.invalidateQueries({ queryKey: ["arbiq"] });

            setTxState((s) => ({
              ...s,
              status: "finalized",
              consensusStatus: statusName,
              returnValue,
            }));
            return;
          }
        } catch {
          // getTransaction may still 404 briefly — keep polling
        }

        await new Promise((r) => setTimeout(r, 500));
      }

      const timeoutMsg = `Timed out after ${2 + maxRetries * 0.5}s waiting for consensus`;
      setTxState((s) => ({ ...s, status: "error", error: timeoutMsg }));
      showError(new Error(timeoutMsg));
    },
    [queryClient, showError]
  );

  const send = useCallback(
    async ({
      functionName,
      args,
      value,
      // retries = poll attempts at 500ms each. 180 = ~90s for deterministic ops.
      retries = 180,
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

      setTxState({ ...IDLE, status: "pending" });

      try {
        // Re-use cached write client if wallet hasn't changed
        if (!writeClientRef.current) {
          writeClientRef.current = createClient({
            chain: testnetBradbury,
            provider: walletClient,
            account: address,
          });
        }

        const txHash = await writeClientRef.current.writeContract({
          address: CONTRACT_ADDRESS,
          functionName,
          args,
          value: value ?? 0n,
        });

        setTxState((s) => ({ ...s, txHash: txHash as TransactionHash }));

        // Poll asynchronously — caller gets txHash immediately
        pollStatus(txHash as TransactionHash, retries);

        return txHash;
      } catch (err: unknown) {
        const msg = friendlyError(err);
        setTxState({ ...IDLE, status: "error", error: msg });
        showError(err);
        return null;
      }
    },
    [address, walletClient, pollStatus, showError]
  );

  // Invalidate write client cache when wallet changes
  const sendWithClientReset = useCallback(
    (args: Parameters<typeof send>[0]) => {
      writeClientRef.current = null;
      return send(args);
    },
    [send]
  );

  const simulate = useCallback(
    async ({ functionName, args }: { functionName: string; args: CalldataEncodable[] }) => {
      if (!address) throw new Error("Wallet not connected");
      return genLayerClient.simulateWriteContract({
        address: CONTRACT_ADDRESS,
        functionName,
        args,
      });
    },
    [address]
  );

  return { send: sendWithClientReset, simulate, txState, reset, isConnected: !!address };
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
        // AI evaluation: 600 polls × 500ms = ~5 min
        retries: 600,
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
    staleTime: 10_000,
    refetchInterval: 15_000,
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
