"use client";

import { useState } from "react";
import type { Job, Milestone } from "@/lib/types";
import { useSubmitMilestoneDelivery, useApproveMilestone } from "@/hooks/useArbiqContract";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TxHudOverlay } from "@/components/TxHudOverlay";
import { CheckCircle2, Clock, Circle, Loader2, ExternalLink } from "lucide-react";
import { formatBudget } from "@/lib/utils";

interface Props {
  job: Job;
  isClient: boolean;
  isFreelancer: boolean;
}

function MilestoneIcon({ m }: { m: Milestone }) {
  if (m.approved) return <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#22c55e" }} />;
  if (m.status === "delivered") return <Clock className="w-4 h-4 shrink-0" style={{ color: "#f59e0b" }} />;
  return <Circle className="w-4 h-4 shrink-0" style={{ color: "var(--text-muted)" }} />;
}

function milestoneCardStyle(m: Milestone) {
  if (m.approved) return { background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" };
  if (m.status === "delivered") return { background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.2)" };
  return { background: "var(--surface-card)", border: "1px solid var(--border-subtle)" };
}

export function MilestoneStepper({ job, isClient, isFreelancer }: Props) {
  const milestones = job.milestones ?? [];
  const { submitMilestoneDelivery, txState: submitState, isLoading: submitting } = useSubmitMilestoneDelivery();
  const { approveMilestone, txState: approveState, isLoading: approving } = useApproveMilestone();

  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceNote, setEvidenceNote] = useState("");

  const completedCount = milestones.filter((m) => m.approved).length;
  const progressPct = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  const activeState = submitState.status !== "idle" ? submitState : approveState;
  const activeOp = submitState.status !== "idle" ? "submit_milestone_delivery" : "approve_milestone";

  return (
    <div className="space-y-4">
      {/* Progress header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
          <span>{completedCount} of {milestones.length} milestones approved</span>
          <span className="font-mono">{progressPct}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPct}%`,
              background: "linear-gradient(90deg, #7c3aed, #22c55e)",
            }}
          />
        </div>
      </div>

      {/* Milestone cards */}
      {milestones.map((m, idx) => (
        <div key={idx} className="p-4 rounded-xl space-y-2" style={milestoneCardStyle(m)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MilestoneIcon m={m} />
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {idx + 1}. {m.title}
              </span>
            </div>
            <span
              className="text-xs font-mono font-bold"
              style={{ color: "#a78bfa", fontFamily: '"JetBrains Mono", monospace' }}
            >
              {formatBudget(m.amount)}
            </span>
          </div>

          {/* Status label */}
          <p className="text-[10px] font-bold uppercase tracking-wider pl-6" style={{
            color: m.approved ? "#22c55e" : m.status === "delivered" ? "#f59e0b" : "var(--text-muted)",
          }}>
            {m.approved ? "Paid out" : m.status === "delivered" ? "Awaiting approval" : "Pending"}
          </p>

          {/* Freelancer: expand submit form for pending milestones */}
          {isFreelancer && m.status === "pending" && !m.approved && (
            expandedIdx === idx ? (
              <form
                className="space-y-2 pl-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!evidenceUrl.trim()) return;
                  submitMilestoneDelivery(job.id, idx, evidenceUrl, evidenceNote);
                  setExpandedIdx(null);
                }}
              >
                <Input
                  type="url"
                  placeholder="Evidence URL (GitHub, Figma, live site…)"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  disabled={submitting}
                />
                <Textarea
                  rows={2}
                  placeholder="Describe what you delivered for this milestone…"
                  value={evidenceNote}
                  onChange={(e) => setEvidenceNote(e.target.value)}
                  disabled={submitting}
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting || !evidenceUrl.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)", opacity: submitting ? 0.7 : 1 }}
                  >
                    {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                    {submitting ? "Submitting…" : "Submit Milestone"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpandedIdx(null)}
                    className="px-3 py-1.5 rounded-lg text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                className="pl-6 text-xs font-semibold underline"
                style={{ color: "#a78bfa" }}
                onClick={() => {
                  setExpandedIdx(idx);
                  setEvidenceUrl("");
                  setEvidenceNote("");
                }}
              >
                Submit delivery for this milestone →
              </button>
            )
          )}

          {/* Client: see evidence + approve button */}
          {isClient && m.status === "delivered" && !m.approved && (
            <div className="pl-6 space-y-2">
              {m.evidence_url && (
                <a
                  href={m.evidence_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs break-all"
                  style={{ color: "#fdba74" }}
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  {m.evidence_url}
                </a>
              )}
              {m.evidence_note && (
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {m.evidence_note}
                </p>
              )}
              <button
                onClick={() => approveMilestone(job.id, idx)}
                disabled={approving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{
                  background: "rgba(34,197,94,0.12)",
                  border: "1px solid rgba(34,197,94,0.25)",
                  color: "#86efac",
                  opacity: approving ? 0.7 : 1,
                }}
              >
                {approving ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3 h-3" />
                )}
                {approving ? "Approving…" : `Approve & Pay ${formatBudget(m.amount)}`}
              </button>
            </div>
          )}
        </div>
      ))}

      {/* HUD overlay */}
      {activeState.status !== "idle" && (
        <TxHudOverlay
          status={activeState.status}
          consensusStatus={activeState.consensusStatus}
          txHash={activeState.txHash}
          error={activeState.error}
          operation={activeOp}
        />
      )}
    </div>
  );
}
