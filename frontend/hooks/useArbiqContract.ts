"use client";

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount, useWalletClient } from "wagmi";
import { parseEther, encodeFunctionData } from "viem";
import type { CalldataEncodable, TransactionHash } from "genlayer-js/types";
import { TransactionStatus } from "genlayer-js/types";
import { genLayerClient, CONTRACT_ADDRESS } from "@/lib/genlayer/client";
import type { Job } from "@/lib/types";

// ─── ABI fragments for wagmi write calls ────────────────────────────────────

const ARBIQ_ABI = [
  {
    name: "post_job",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "title", type: "string" },
      { name: "description", type: "string" },
      { name: "deadline", type: "string" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "take_job",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "job_id", type: "uint256" }],
    outputs: [],
  },
  {
    name: "submit_delivery",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "job_id", type: "uint256" },
      { name: "evidence_url", type: "string" },
      { name: "evidence_note", type: "string" },
    ],
    outputs: [],
  },
  {
    name: "auto_evaluate",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "job_id", type: "uint256" }],
    outputs: [],
  },
  {
    name: "release_manually",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "job_id", type: "uint256" }],
    outputs: [],
  },
] as const;

// ─── Read helpers via genlayer-js ────────────────────────────────────────────

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

// ─── Read hooks ──────────────────────────────────────────────────────────────

export function useGetAllJobs() {
  return useQuery({
    queryKey: ["arbiq", "allJobs"],
    queryFn: async () => {
      const raw = await readContract("get_all_jobs");
      console.log("[useGetAllJobs] raw response:", raw);
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
      ? allJobs.filter(
          (j) => j.freelancer.toLowerCase() === address.toLowerCase()
        )
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

interface TxState {
  txHash: TransactionHash | null;
  status: "idle" | "pending" | "finalizing" | "finalized" | "error";
  error: string | null;
}

function useContractWrite() {
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const queryClient = useQueryClient();

  const [txState, setTxState] = useState<TxState>({
    txHash: null,
    status: "idle",
    error: null,
  });

  const reset = useCallback(() => {
    setTxState({ txHash: null, status: "idle", error: null });
  }, []);

  const pollStatus = useCallback(
    async (hash: TransactionHash) => {
      setTxState((s) => ({ ...s, status: "finalizing" }));
      try {
        await genLayerClient.waitForTransactionReceipt({
          hash,
          status: TransactionStatus.ACCEPTED,
          retries: 60,
          interval: 3_000,
        });
        setTxState((s) => ({ ...s, status: "finalized" }));
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
      isNonDeterministic = false,
    }: {
      functionName: string;
      args: unknown[];
      value?: bigint;
      isNonDeterministic?: boolean;
    }) => {
      if (!walletClient || !address) {
        setTxState({ txHash: null, status: "error", error: "Wallet not connected" });
        return null;
      }

      setTxState({ txHash: null, status: "pending", error: null });

      try {
        const data = encodeFunctionData({
          abi: ARBIQ_ABI,
          functionName: functionName as never,
          args: args as never,
        });

        const hash = await walletClient.sendTransaction({
          to: CONTRACT_ADDRESS,
          data,
          value: value ?? 0n,
          gas: 1_000_000n,
        });

        const txHash = hash as TransactionHash;
        setTxState((s) => ({ ...s, txHash }));

        if (isNonDeterministic) {
          pollStatus(txHash);
        } else {
          setTxState((s) => ({ ...s, status: "finalized" }));
          queryClient.invalidateQueries({ queryKey: ["arbiq"] });
        }

        return hash;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Transaction failed";
        setTxState({ txHash: null, status: "error", error: msg });
        return null;
      }
    },
    [walletClient, address, pollStatus, queryClient]
  );

  return { send, txState, reset, isConnected: !!address };
}

// ─── Public write hooks ───────────────────────────────────────────────────────

export function usePostJob() {
  const { send, txState, reset, isConnected } = useContractWrite();

  const postJob = useCallback(
    (params: { title: string; description: string; deadline: string; budgetEth: string }) => {
      return send({
        functionName: "post_job",
        args: [params.title, params.description, params.deadline],
        value: parseEther(params.budgetEth),
      });
    },
    [send]
  );

  return { postJob, txState, reset, isConnected, isLoading: txState.status === "pending" };
}

export function useTakeJob() {
  const { send, txState, reset, isConnected } = useContractWrite();

  const takeJob = useCallback(
    (jobId: number) => send({ functionName: "take_job", args: [BigInt(jobId)] }),
    [send]
  );

  return { takeJob, txState, reset, isConnected, isLoading: txState.status === "pending" };
}

export function useSubmitDelivery() {
  const { send, txState, reset, isConnected } = useContractWrite();

  const submitDelivery = useCallback(
    (jobId: number, evidenceUrl: string, evidenceNote: string) =>
      send({
        functionName: "submit_delivery",
        args: [BigInt(jobId), evidenceUrl, evidenceNote],
      }),
    [send]
  );

  return { submitDelivery, txState, reset, isConnected, isLoading: txState.status === "pending" };
}

export function useAutoEvaluate() {
  const { send, txState, reset, isConnected } = useContractWrite();

  const autoEvaluate = useCallback(
    (jobId: number) =>
      send({
        functionName: "auto_evaluate",
        args: [BigInt(jobId)],
        isNonDeterministic: true,
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
    (jobId: number) => send({ functionName: "release_manually", args: [BigInt(jobId)] }),
    [send]
  );

  return { release, txState, reset, isConnected, isLoading: txState.status === "pending" };
}
