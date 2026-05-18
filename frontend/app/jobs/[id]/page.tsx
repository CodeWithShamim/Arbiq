"use client";

import { use, useState, useEffect, useCallback, FormEvent } from "react";
import { Navbar } from "@/components/Navbar";
import { StatusTimeline } from "@/components/StatusTimeline";
import { StatusBadge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useGetJob, useTakeJob, useSubmitDelivery, useAutoEvaluate, useRelease,
} from "@/hooks/useArbiqContract";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { truncateAddress, formatBudget, formatDeadline } from "@/lib/utils";
import { toast } from "sonner";
import {
  Loader2, ExternalLink, Calendar, Wallet, User,
  Brain, CheckCircle2, AlertCircle, Clock, ArrowLeft,
  Copy, Check, Share2,
} from "lucide-react";
import { ConsensusTxStatus } from "@/components/ConsensusTxStatus";
import Link from "next/link";

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const jobId = parseInt(id, 10);

  const { data: job, isLoading, refetch } = useGetJob(jobId);
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceNote, setEvidenceNote] = useState("");

  const { takeJob,        txState: takeState,    isLoading: takingJob   } = useTakeJob();
  const { submitDelivery, txState: deliverState, isLoading: submitting  } = useSubmitDelivery();
  const { autoEvaluate,   txState: evalState,    isLoading: evaluating  } = useAutoEvaluate();
  const { release,        txState: releaseState, isLoading: releasing   } = useRelease();

  useEffect(() => {
    const states = [takeState, deliverState, evalState, releaseState];
    if (states.some((s) => s.status === "finalized")) setTimeout(() => refetch(), 3000);
    states.forEach((s) => { if (s.status === "error" && s.error) toast.error(s.error); });
  }, [takeState, deliverState, evalState, releaseState, refetch]);

  if (isLoading) return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <Navbar />
      <main className="pt-32 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-12 h-12">
            <div className="orbit-dot" />
            <div className="orbit-dot" />
            <div className="orbit-dot" />
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading job…</p>
        </div>
      </main>
    </div>
  );

  if (!job) return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <Navbar />
      <main className="pt-32 text-center">
        <p style={{ color: "var(--text-muted)" }}>Job #{jobId} not found.</p>
      </main>
    </div>
  );

  const isClient = address?.toLowerCase() === job.client.toLowerCase();
  const isFreelancer = job.freelancer && address?.toLowerCase() === job.freelancer.toLowerCase();

  const handleDeliver = (e: FormEvent) => {
    e.preventDefault();
    if (!evidenceUrl.trim()) { toast.error("Evidence URL is required"); return; }
    submitDelivery(jobId, evidenceUrl, evidenceNote);
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <Navbar />

      {/* Page header */}
      <div
        className="pt-24 pb-8 px-4 md:px-8 relative overflow-hidden"
        style={{ borderBottom: "1px solid var(--border-page)" }}
      >
        <div className="orb orb-violet absolute w-96 h-96 -top-20 -right-20 opacity-20" />
        <div className="max-w-3xl mx-auto relative z-10">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 text-xs mb-5 transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to jobs
          </Link>

          <div className="flex items-start justify-between gap-4 mb-5">
            <h1 className="headline leading-tight flex-1" style={{ color: "var(--text-primary)" }}>{job.title}</h1>
            <div className="flex items-center gap-2 flex-shrink-0">
              <StatusBadge status={job.status} />
              <ShareButton />
            </div>
          </div>

          <StatusTimeline status={job.status} />
        </div>
      </div>

      <main className="px-4 md:px-8 py-8">
        <div className="max-w-3xl mx-auto space-y-4">

          {/* Meta strip */}
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl"
            style={{
              background: "var(--surface-card)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <MetaItem label="Budget" value={formatBudget(job.budget)} color="#a78bfa" mono />
            <MetaItem label="Deadline" value={formatDeadline(job.deadline)} icon={<Calendar className="w-3.5 h-3.5" />} />
            <MetaItem label="Client" value={truncateAddress(job.client)} fullValue={job.client} mono copyable icon={<User className="w-3.5 h-3.5" />} />
            {job.freelancer && (
              <MetaItem label="Freelancer" value={truncateAddress(job.freelancer)} fullValue={job.freelancer} mono copyable icon={<Wallet className="w-3.5 h-3.5" />} />
            )}
          </div>

          {/* Description */}
          <Section title="Job Description">
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
              {job.description}
            </p>
          </Section>

          {/* ── OPEN ── */}
          {job.status === "open" && (
            <Section title={isClient ? "Awaiting Freelancer" : "Accept This Job"} accent="#38bdf8">
              {isClient ? (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Your job is live. Waiting for a freelancer to accept.
                </p>
              ) : isConnected ? (
                <div className="space-y-3">
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    Accept this job and start working. You&apos;ll be the assigned freelancer.
                  </p>
                  <ActionButton
                    onClick={() => takeJob(jobId)}
                    loading={takingJob}
                    label="Accept & Start Working"
                    loadingLabel="Accepting…"
                  />
                  <ConsensusTxStatus
                    status={takeState.status}
                    txHash={takeState.txHash}
                    error={takeState.error}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>Connect your wallet to take this job</p>
                  <button
                    onClick={() => openConnectModal?.()}
                    className="btn-primary px-4 py-2 rounded-lg text-sm text-white font-semibold"
                  >
                    Connect Wallet
                  </button>
                </div>
              )}
            </Section>
          )}

          {/* ── ACTIVE + freelancer ── */}
          {job.status === "active" && isFreelancer && (
            <Section title="Submit Your Delivery" accent="#f59e0b">
              <form onSubmit={handleDeliver} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold" style={{ color: "var(--text-label)" }}>
                    Evidence URL
                    <span className="text-xs font-normal ml-2" style={{ color: "var(--text-muted)" }}>
                      GitHub, live site, Figma, Loom, etc.
                    </span>
                  </label>
                  <Input
                    type="url"
                    placeholder="https://github.com/you/project"
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold" style={{ color: "var(--text-label)" }}>Delivery Note</label>
                  <Textarea
                    rows={4}
                    placeholder="Explain what you built and how it satisfies every requirement in the job description…"
                    value={evidenceNote}
                    onChange={(e) => setEvidenceNote(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <ActionButton type="submit" loading={submitting} label="Submit Delivery" loadingLabel="Submitting…" />
                <ConsensusTxStatus
                  status={deliverState.status}
                  txHash={deliverState.txHash}
                  error={deliverState.error}
                />
              </form>
            </Section>
          )}

          {job.status === "active" && !isFreelancer && !isClient && (
            <Section title="In Progress">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>This job is currently being worked on.</p>
            </Section>
          )}

          {/* ── DELIVERED ── */}
          {job.status === "delivered" && (
            <>
              <Section title="Freelancer Submission" accent="#fb923c">
                <a
                  href={job.evidence_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm break-all transition-colors mb-3"
                  style={{ color: "#fdba74" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#fbbf24"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#fdba74"; }}
                >
                  <ExternalLink className="w-4 h-4 flex-shrink-0" />
                  {job.evidence_url}
                </a>
                {job.evidence_note && (
                  <p
                    className="text-sm whitespace-pre-wrap leading-relaxed pt-3"
                    style={{ color: "var(--text-secondary)", borderTop: "1px solid var(--border-divider)" }}
                  >
                    {job.evidence_note}
                  </p>
                )}
              </Section>

              {isClient && (
                <Section title="Review & Decide">
                  <div className="space-y-4">
                    {/* AI evaluate */}
                    <div
                      className="p-4 rounded-xl space-y-3"
                      style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}
                    >
                      <div>
                        <p className="text-sm font-semibold mb-1 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                          <Brain className="w-4 h-4" style={{ color: "#a78bfa" }} />
                          AI Evaluation
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          GenLayer&apos;s validator network will read the job spec and the evidence URL, then reach consensus.
                        </p>
                      </div>
                      <ActionButton
                        onClick={() => autoEvaluate(jobId)}
                        loading={evaluating}
                        label="Trigger AI Evaluation"
                        loadingLabel="AI Validators reviewing…"
                        icon={<Brain className="w-4 h-4" />}
                      />
                      <ConsensusTxStatus
                        status={evalState.status}
                        txHash={evalState.txHash}
                        error={evalState.error}
                        finalizingLabel="AI validators reading evidence & reaching consensus…"
                      />
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px" style={{ background: "var(--border-divider)" }} />
                      <span className="text-xs" style={{ color: "var(--text-label-dim)" }}>or</span>
                      <div className="flex-1 h-px" style={{ background: "var(--border-divider)" }} />
                    </div>

                    {/* Manual release */}
                    <div
                      className="p-4 rounded-xl space-y-3"
                      style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}
                    >
                      <p className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        Manual Approval
                      </p>
                      <button
                        onClick={() => release(jobId)}
                        disabled={releasing}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                        style={{
                          background: "rgba(34,197,94,0.12)",
                          border: "1px solid rgba(34,197,94,0.25)",
                          color: "#86efac",
                        }}
                      >
                        {releasing ? <><Loader2 className="w-4 h-4 animate-spin" /> Releasing…</> : <><CheckCircle2 className="w-4 h-4" /> Approve & Pay Manually</>}
                      </button>
                      <ConsensusTxStatus
                        status={releaseState.status}
                        txHash={releaseState.txHash}
                        error={releaseState.error}
                      />
                    </div>
                  </div>
                </Section>
              )}

              {isFreelancer && (
                <Section title="Waiting for Client">
                  <div className="flex items-center gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                    <Clock className="w-5 h-5 text-orange-400 flex-shrink-0" />
                    Delivery submitted. The client can approve or trigger AI evaluation.
                  </div>
                </Section>
              )}
            </>
          )}

          {/* ── COMPLETED ── */}
          {job.status === "completed" && (
            <div
              className="p-6 rounded-2xl space-y-3 anim-scale-in"
              style={{
                background: "linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.03) 100%)",
                border: "1px solid rgba(34,197,94,0.2)",
                boxShadow: "0 0 40px rgba(34,197,94,0.08)",
              }}
            >
              <div className="flex items-center gap-2 font-bold text-green-300">
                <CheckCircle2 className="w-5 h-5" />
                AI Approved — Funds Released
              </div>
              {job.ai_reasoning && (
                <div className="pt-3" style={{ borderTop: "1px solid rgba(34,197,94,0.12)" }}>
                  <p className="text-[10px] uppercase font-bold tracking-widest mb-2" style={{ color: "rgba(34,197,94,0.5)" }}>
                    AI Reasoning
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{job.ai_reasoning}</p>
                </div>
              )}
            </div>
          )}

          {/* ── DISPUTED ── */}
          {job.status === "disputed" && (
            <div
              className="p-6 rounded-2xl space-y-3 anim-scale-in"
              style={{
                background: "linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.03) 100%)",
                border: "1px solid rgba(239,68,68,0.2)",
                boxShadow: "0 0 40px rgba(239,68,68,0.08)",
              }}
            >
              <div className="flex items-center gap-2 font-bold text-red-300">
                <AlertCircle className="w-5 h-5" />
                AI Rejected — Disputed
              </div>
              {job.ai_reasoning && (
                <div className="pt-3" style={{ borderTop: "1px solid rgba(239,68,68,0.12)" }}>
                  <p className="text-[10px] uppercase font-bold tracking-widest mb-2" style={{ color: "rgba(239,68,68,0.5)" }}>
                    AI Reasoning
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{job.ai_reasoning}</p>
                </div>
              )}
              <button
                disabled
                className="w-full py-2.5 rounded-xl text-sm font-semibold mt-2 opacity-40 cursor-not-allowed"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}
              >
                Appeal — Coming Soon
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function MetaItem({
  label, value, fullValue, mono, copyable, icon, color,
}: {
  label: string; value: string; fullValue?: string;
  mono?: boolean; copyable?: boolean; icon?: React.ReactNode; color?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(fullValue ?? value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }, [fullValue, value]);

  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-label-dim)" }}>
        {label}
      </p>
      <div className="flex items-center gap-1.5">
        <p
          className="text-sm flex items-center gap-1.5 font-medium"
          style={{ fontFamily: mono ? "monospace" : undefined, color: color ?? "var(--text-label)" }}
        >
          {icon}{value}
        </p>
        {copyable && (
          <button
            onClick={copy}
            title="Copy address"
            className="transition-all"
            style={{ color: copied ? "#86efac" : "var(--text-muted)", lineHeight: 1 }}
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button>
        )}
      </div>
    </div>
  );
}

function ShareButton() {
  const [shared, setShared] = useState(false);
  const share = useCallback(() => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: document.title, url });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setShared(true);
        setTimeout(() => setShared(false), 1800);
      });
    }
  }, []);

  return (
    <button
      onClick={share}
      title="Share this job"
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
      style={{
        background: "var(--surface-raised)",
        border: "1px solid var(--border-mid)",
        color: shared ? "#86efac" : "var(--text-muted)",
      }}
    >
      {shared ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
    </button>
  );
}

function Section({ title, children, accent }: { title: string; children: React.ReactNode; accent?: string }) {
  return (
    <div
      className="p-6 rounded-2xl space-y-4"
      style={{
        background: "var(--surface-card)",
        border: `1px solid ${accent ? `${accent}22` : "var(--border-subtle)"}`,
      }}
    >
      <h2 className="text-sm font-bold" style={{ color: accent ?? "var(--text-label)" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function ActionButton({
  onClick,
  loading,
  label,
  loadingLabel,
  icon,
  type = "button",
}: {
  onClick?: () => void;
  loading: boolean;
  label: string;
  loadingLabel: string;
  icon?: React.ReactNode;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm" style={{ color: "white" }}
    >
      {loading ? (
        <><Loader2 className="w-4 h-4 animate-spin" />{loadingLabel}</>
      ) : (
        <>{icon}{label}</>
      )}
    </button>
  );
}

