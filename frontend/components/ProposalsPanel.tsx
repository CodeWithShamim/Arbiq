"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Send, UserCheck, Wallet } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { TxHudOverlay } from "@/components/TxHudOverlay";
import { ReputationBadge } from "@/components/ReputationBadge";
import { useGetProposals, useApplyToJob, useAcceptProposal } from "@/hooks/useArbiqContract";
import { truncateAddress, formatBudget } from "@/lib/utils";
import Link from "next/link";

interface Props {
  jobId: number;
  isClient: boolean;
  /** Current connected address (lowercased comparison done internally). */
  address?: string;
  isConnected: boolean;
  onConnect?: () => void;
  /** Called after a proposal is accepted / applied so the parent can refetch. */
  onMutated?: () => void;
}

/**
 * Open-job assignment flow. Clients see the list of submitted proposals and pick
 * one; freelancers see a form to apply. Replaces the old first-come take_job as
 * the primary path.
 */
export function ProposalsPanel({ jobId, isClient, address, isConnected, onConnect, onMutated }: Props) {
  const { data: proposals = [], refetch } = useGetProposals(jobId);
  const { applyToJob, txState: applyState, isLoading: applying } = useApplyToJob();
  const { acceptProposal, txState: acceptState, isLoading: accepting } = useAcceptProposal();

  const [note, setNote] = useState("");
  const [bid, setBid] = useState("");
  const [acceptingAddr, setAcceptingAddr] = useState<string | null>(null);

  const alreadyApplied = !!address && proposals.some(
    (p) => p.freelancer.toLowerCase() === address.toLowerCase()
  );

  useEffect(() => {
    if (applyState.status === "error" && applyState.error) toast.error(applyState.error);
    if (applyState.status === "finalized") {
      toast.success("Proposal submitted!");
      setNote("");
      setBid("");
      refetch();
      onMutated?.();
    }
  }, [applyState.status, applyState.error, refetch, onMutated]);

  useEffect(() => {
    if (acceptState.status === "error" && acceptState.error) toast.error(acceptState.error);
    if (acceptState.status === "finalized") {
      toast.success("Freelancer assigned — job is now active!");
      refetch();
      onMutated?.();
    }
  }, [acceptState.status, acceptState.error, refetch, onMutated]);

  const handleApply = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!note.trim()) {
      toast.error("Add a short proposal note");
      return;
    }
    // bid is informational; convert ETH-ish input to wei only if provided
    let bidWei = 0;
    if (bid.trim()) {
      const n = parseFloat(bid);
      if (!isNaN(n) && n > 0) bidWei = Math.round(n * 1e18);
    }
    applyToJob(jobId, note.trim(), bidWei);
  };

  const handleAccept = (freelancer: string) => {
    setAcceptingAddr(freelancer);
    acceptProposal(jobId, freelancer);
  };

  // ── Client view: list of proposals to pick from ──────────────────────────────
  if (isClient) {
    return (
      <div className="space-y-4">
        {proposals.length === 0 ? (
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: "#38bdf8" }} />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: "#38bdf8" }} />
            </span>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No proposals yet. Share the job to attract freelancers.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-label-dim)" }}>
              {proposals.length} proposal{proposals.length !== 1 ? "s" : ""}
            </p>
            <div className="space-y-3">
              {proposals.map((p) => (
                <div
                  key={p.freelancer}
                  className="p-4 rounded-xl space-y-3"
                  style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <Link
                      href={`/profile/${p.freelancer}`}
                      className="flex items-center gap-2 text-sm font-mono font-medium transition-colors"
                      style={{ color: "var(--text-label)" }}
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      {truncateAddress(p.freelancer)}
                    </Link>
                    <ReputationBadge address={p.freelancer} />
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {p.note}
                  </p>
                  {p.bid > 0 && (
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Proposed rate: <span className="font-semibold" style={{ color: "#a78bfa" }}>{formatBudget(p.bid)}</span>
                      <span className="opacity-60"> (informational — escrow stays at the posted budget)</span>
                    </p>
                  )}
                  <button
                    onClick={() => handleAccept(p.freelancer)}
                    disabled={accepting}
                    className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                  >
                    {accepting && acceptingAddr === p.freelancer ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Assigning…</>
                    ) : (
                      <><UserCheck className="w-4 h-4" /> Accept & Assign</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
        <TxHudOverlay
          status={acceptState.status}
          consensusStatus={acceptState.consensusStatus}
          txHash={acceptState.txHash}
          error={acceptState.error}
          operation="accept_proposal"
        />
      </div>
    );
  }

  // ── Freelancer / visitor view: apply form ────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Connect your wallet to submit a proposal
        </p>
        <button onClick={() => onConnect?.()} className="btn-primary px-4 py-2 rounded-lg text-sm text-white font-semibold">
          Connect Wallet
        </button>
      </div>
    );
  }

  if (alreadyApplied) {
    return (
      <div
        className="flex items-center gap-3 p-3 rounded-xl text-sm"
        style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", color: "#86efac" }}
      >
        <UserCheck className="w-4 h-4 shrink-0" />
        Your proposal is in. The client will review and pick a freelancer.
      </div>
    );
  }

  return (
    <form onSubmit={handleApply} className="space-y-4">
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        Pitch the client on why you&apos;re the right freelancer. They&apos;ll review all proposals and choose one.
      </p>
      <div className="space-y-2">
        <label className="text-sm font-semibold" style={{ color: "var(--text-label)" }}>
          Proposal note
        </label>
        <Textarea
          rows={4}
          placeholder="Describe your relevant experience, your approach, and your timeline…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={applying}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold" style={{ color: "var(--text-label)" }}>
          Proposed rate <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>(GEN, optional)</span>
        </label>
        <Input
          type="number"
          step="0.0001"
          min="0"
          placeholder="Leave blank to accept the posted budget"
          value={bid}
          onChange={(e) => setBid(e.target.value)}
          disabled={applying}
        />
      </div>
      <button
        type="submit"
        disabled={applying}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white"
      >
        {applying ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
        ) : (
          <><Send className="w-4 h-4" /> Submit Proposal</>
        )}
      </button>
      <TxHudOverlay
        status={applyState.status}
        consensusStatus={applyState.consensusStatus}
        txHash={applyState.txHash}
        error={applyState.error}
        operation="apply_to_job"
      />
    </form>
  );
}
