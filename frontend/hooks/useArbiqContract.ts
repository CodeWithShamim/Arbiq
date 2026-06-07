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
import type { Job, FreelancerProfile, Proposal } from "@/lib/types";
import { useError } from "@/lib/error-context";
import { friendlyError } from "@/lib/errors";

/**
 * Convert a deadline string (date input "YYYY-MM-DD" or ISO datetime) to unix
 * SECONDS. The contract no longer parses time on-chain (wall-clock reads break
 * validator consensus), so the client supplies the timestamp as a plain integer.
 * Returns 0 when unparseable (deadline then non-enforcing on-chain).
 */
function deadlineToUnix(deadline: string): number {
  if (!deadline) return 0;
  const ms = Date.parse(deadline);
  if (Number.isNaN(ms)) return 0;
  return Math.floor(ms / 1000);
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
    // Normalise ai_scores from JSON string (how contract stores it) to object
    const p = parsed as Record<string, unknown>;
    if (typeof p.ai_scores === "string") {
      try { p.ai_scores = JSON.parse(p.ai_scores as string); } catch { p.ai_scores = undefined; }
    }
    return p as unknown as Job;
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
    staleTime: 20_000,
    refetchInterval: 30_000,
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
const WRITE_INVALIDATES = ["get_all_jobs", "get_job", "get_job_count", "get_messages", "get_proposals", "get_profile"];

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
        args: [params.title, params.description, params.deadline, deadlineToUnix(params.deadline)],
        value: parseEther(params.budgetEth),
      }),
    [send]
  );

  const simulatePostJob = useCallback(
    (params: { title: string; description: string; deadline: string; budgetEth: string }) =>
      simulate({
        functionName: "post_job",
        args: [params.title, params.description, params.deadline, deadlineToUnix(params.deadline)],
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
    staleTime: 20_000,
    refetchInterval: 30_000,
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

// ─── Reputation hook ──────────────────────────────────────────────────────────

export function useGetProfile(address: string | undefined) {
  return useQuery({
    queryKey: ["arbiq", "profile", address],
    queryFn: async () => {
      if (!address) return null;
      const raw = await readContract("get_profile", [address]);
      try {
        const p = typeof raw === "string" ? JSON.parse(raw) : raw;
        return p as FreelancerProfile;
      } catch {
        return null;
      }
    },
    enabled: !!address,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

// ─── Appeal hook ──────────────────────────────────────────────────────────────

export function useResubmitDelivery() {
  const { send, txState, reset, isConnected } = useContractWrite();

  const resubmitDelivery = useCallback(
    (jobId: number, evidenceUrl: string, evidenceNote: string) =>
      send({
        functionName: "resubmit_delivery",
        args: [jobId, evidenceUrl, evidenceNote],
      }),
    [send]
  );

  return {
    resubmitDelivery,
    txState,
    reset,
    isConnected,
    isLoading: txState.status === "pending" || txState.status === "finalizing",
  };
}

// ─── Milestone hooks ──────────────────────────────────────────────────────────

export function usePostJobMilestones() {
  const { send, txState, reset, isConnected } = useContractWrite();

  const postJobMilestones = useCallback(
    (params: {
      title: string;
      description: string;
      deadline: string;
      budgetEth: string;
      milestoneTitles: string[];
    }) =>
      send({
        functionName: "post_job_milestones",
        args: [params.title, params.description, params.deadline, params.milestoneTitles, deadlineToUnix(params.deadline)],
        value: parseEther(params.budgetEth),
      }),
    [send]
  );

  return {
    postJobMilestones,
    txState,
    reset,
    isConnected,
    isLoading: txState.status === "pending" || txState.status === "finalizing",
  };
}

export function useSubmitMilestoneDelivery() {
  const { send, txState, reset, isConnected } = useContractWrite();

  const submitMilestoneDelivery = useCallback(
    (jobId: number, milestoneIdx: number, evidenceUrl: string, evidenceNote: string) =>
      send({
        functionName: "submit_milestone_delivery",
        args: [jobId, milestoneIdx, evidenceUrl, evidenceNote],
      }),
    [send]
  );

  return {
    submitMilestoneDelivery,
    txState,
    reset,
    isConnected,
    isLoading: txState.status === "pending" || txState.status === "finalizing",
  };
}

export function useApproveMilestone() {
  const { send, txState, reset, isConnected } = useContractWrite();

  const approveMilestone = useCallback(
    (jobId: number, milestoneIdx: number) =>
      send({
        functionName: "approve_milestone",
        args: [jobId, milestoneIdx],
      }),
    [send]
  );

  return {
    approveMilestone,
    txState,
    reset,
    isConnected,
    isLoading: txState.status === "pending" || txState.status === "finalizing",
  };
}

// ─── Cancellation & refund hooks ───────────────────────────────────────────────

export function useCancelJob() {
  const { send, txState, reset, isConnected } = useContractWrite();

  const cancelJob = useCallback(
    (jobId: number) => send({ functionName: "cancel_job", args: [jobId] }),
    [send]
  );

  return {
    cancelJob,
    txState,
    reset,
    isConnected,
    isLoading: txState.status === "pending" || txState.status === "finalizing",
  };
}

export function useReclaimExpired() {
  const { send, txState, reset, isConnected } = useContractWrite();

  const reclaimExpired = useCallback(
    (jobId: number) => send({ functionName: "reclaim_expired", args: [jobId] }),
    [send]
  );

  return {
    reclaimExpired,
    txState,
    reset,
    isConnected,
    isLoading: txState.status === "pending" || txState.status === "finalizing",
  };
}

export function useReclaimDisputed() {
  const { send, txState, reset, isConnected } = useContractWrite();

  const reclaimDisputed = useCallback(
    (jobId: number) => send({ functionName: "reclaim_disputed", args: [jobId] }),
    [send]
  );

  return {
    reclaimDisputed,
    txState,
    reset,
    isConnected,
    isLoading: txState.status === "pending" || txState.status === "finalizing",
  };
}

// ─── Proposals / bidding hooks ─────────────────────────────────────────────────

export function useGetProposals(jobId: number | undefined) {
  return useQuery({
    queryKey: ["arbiq", "proposals", jobId],
    queryFn: async () => {
      if (jobId === undefined) return [] as Proposal[];
      const raw = await readContract("get_proposals", [jobId]);
      try {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        return (Array.isArray(parsed) ? parsed : []) as Proposal[];
      } catch {
        return [] as Proposal[];
      }
    },
    enabled: jobId !== undefined,
    staleTime: 20_000,
    refetchInterval: 30_000,
  });
}

export function useApplyToJob() {
  const { send, txState, reset, isConnected } = useContractWrite();

  const applyToJob = useCallback(
    (jobId: number, note: string, bid: number = 0) =>
      send({ functionName: "apply_to_job", args: [jobId, note, bid] }),
    [send]
  );

  return {
    applyToJob,
    txState,
    reset,
    isConnected,
    isLoading: txState.status === "pending" || txState.status === "finalizing",
  };
}

export function useAcceptProposal() {
  const { send, txState, reset, isConnected } = useContractWrite();

  const acceptProposal = useCallback(
    (jobId: number, freelancer: string) =>
      send({ functionName: "accept_proposal", args: [jobId, freelancer] }),
    [send]
  );

  return {
    acceptProposal,
    txState,
    reset,
    isConnected,
    isLoading: txState.status === "pending" || txState.status === "finalizing",
  };
}

// ─── Ratings & profile hooks ───────────────────────────────────────────────────

export function useRateFreelancer() {
  const { send, txState, reset, isConnected } = useContractWrite();

  const rateFreelancer = useCallback(
    (jobId: number, stars: number, review: string) =>
      send({ functionName: "rate_freelancer", args: [jobId, stars, review] }),
    [send]
  );

  return {
    rateFreelancer,
    txState,
    reset,
    isConnected,
    isLoading: txState.status === "pending" || txState.status === "finalizing",
  };
}

export function useSetProfile() {
  const { send, txState, reset, isConnected } = useContractWrite();

  const setProfile = useCallback(
    (displayName: string, bio: string, skills: string[]) =>
      send({ functionName: "set_profile", args: [displayName, bio, skills] }),
    [send]
  );

  return {
    setProfile,
    txState,
    reset,
    isConnected,
    isLoading: txState.status === "pending" || txState.status === "finalizing",
  };
}

// ─── Paginated job read ────────────────────────────────────────────────────────

export interface JobsPage {
  total: number;
  offset: number;
  limit: number;
  jobs: Job[];
}

export function useGetJobsPage(offset: number, limit: number) {
  return useQuery({
    queryKey: ["arbiq", "jobsPage", offset, limit],
    queryFn: async (): Promise<JobsPage> => {
      const raw = await readContract("get_jobs_page", [offset, limit]);
      try {
        const parsed = (typeof raw === "string" ? JSON.parse(raw) : raw) as Partial<JobsPage>;
        return {
          total: parsed.total ?? 0,
          offset: parsed.offset ?? offset,
          limit: parsed.limit ?? limit,
          jobs: Array.isArray(parsed.jobs) ? (parsed.jobs as Job[]) : [],
        };
      } catch {
        return { total: 0, offset, limit, jobs: [] };
      }
    },
    staleTime: 20_000,
    refetchInterval: 30_000,
    retry: 2,
  });
}
