"use client";

import { use, useState, useEffect, FormEvent } from "react";
import { Navbar } from "@/components/Navbar";
import { StatusTimeline } from "@/components/StatusTimeline";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useGetJob,
  useTakeJob,
  useSubmitDelivery,
  useAutoEvaluate,
  useRelease,
} from "@/hooks/useArbiqContract";
import { useAccount, useConnect } from "wagmi";
import { injected } from "@wagmi/connectors";
import { truncateAddress, formatBudget, formatDeadline } from "@/lib/utils";
import { toast } from "sonner";
import {
  Loader2,
  ExternalLink,
  Calendar,
  Wallet,
  User,
  Hash,
  Brain,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const jobId = parseInt(id, 10);

  const { data: job, isLoading, refetch } = useGetJob(jobId);
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();

  // Delivery form state
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceNote, setEvidenceNote] = useState("");

  const { takeJob, txState: takeState, isLoading: takingJob } = useTakeJob();
  const { submitDelivery, txState: deliverState, isLoading: submitting } =
    useSubmitDelivery();
  const {
    autoEvaluate,
    txState: evalState,
    isLoading: evaluating,
  } = useAutoEvaluate();
  const { release, txState: releaseState, isLoading: releasing } = useRelease();

  // Refetch after any finalized tx
  useEffect(() => {
    const states = [takeState, deliverState, evalState, releaseState];
    const anyFinalized = states.some((s) => s.status === "finalized");
    if (anyFinalized) {
      setTimeout(() => refetch(), 3000);
    }
    states.forEach((s) => {
      if (s.status === "error" && s.error) toast.error(s.error);
    });
  }, [takeState, deliverState, evalState, releaseState, refetch]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <Navbar />
        <main className="pt-24 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        </main>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        <Navbar />
        <main className="pt-24 text-center">
          <p className="text-gray-400">Job #{jobId} not found.</p>
        </main>
      </div>
    );
  }

  const isClient = address?.toLowerCase() === job.client.toLowerCase();
  const isFreelancer =
    job.freelancer && address?.toLowerCase() === job.freelancer.toLowerCase();

  const handleTake = () => takeJob(jobId);

  const handleDeliver = (e: FormEvent) => {
    e.preventDefault();
    if (!evidenceUrl.trim()) {
      toast.error("Evidence URL is required");
      return;
    }
    submitDelivery(jobId, evidenceUrl, evidenceNote);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />

      <main className="pt-24 pb-16 px-4 md:px-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="animate-fade-in">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-3xl font-bold leading-tight">{job.title}</h1>
              <StatusBadge status={job.status} />
            </div>
            <StatusTimeline status={job.status} />
          </div>

          {/* Meta info */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Budget</p>
                  <p className="text-purple-300 font-mono font-bold">
                    {formatBudget(job.budget)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Deadline</p>
                  <p className="flex items-center gap-1 text-gray-200">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDeadline(job.deadline)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Client</p>
                  <p className="flex items-center gap-1 font-mono text-gray-200">
                    <User className="w-3.5 h-3.5" />
                    {truncateAddress(job.client)}
                  </p>
                </div>
                {job.freelancer && (
                  <div className="space-y-1">
                    <p className="text-gray-500 text-xs uppercase tracking-wide">Freelancer</p>
                    <p className="flex items-center gap-1 font-mono text-gray-200">
                      <Wallet className="w-3.5 h-3.5" />
                      {truncateAddress(job.freelancer)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-gray-300">Job Description</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-gray-200 whitespace-pre-wrap text-sm leading-relaxed">
                {job.description}
              </p>
            </CardContent>
          </Card>

          {/* ── Status-specific actions ── */}

          {/* OPEN: Take Job */}
          {job.status === "open" && (
            <Card className="border-blue-500/20">
              <CardContent className="pt-6">
                {isClient ? (
                  <p className="text-sm text-gray-400 text-center py-2">
                    Waiting for a freelancer to accept your job.
                  </p>
                ) : isConnected ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-300">
                      Accept this job to start working. You&apos;ll be the assigned freelancer.
                    </p>
                    <Button
                      onClick={handleTake}
                      disabled={takingJob}
                      className="w-full"
                    >
                      {takingJob ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Accepting…
                        </>
                      ) : (
                        "Accept & Start Working"
                      )}
                    </Button>
                    {takeState.txHash && (
                      <TxHashDisplay hash={takeState.txHash} status={takeState.status} />
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm text-gray-400">
                      Connect your wallet to take this job
                    </p>
                    <Button
                      size="sm"
                      onClick={() => connect({ connector: injected() })}
                    >
                      Connect Wallet
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ACTIVE: Submit Delivery (freelancer only) */}
          {job.status === "active" && isFreelancer && (
            <Card className="border-yellow-500/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-yellow-400" />
                  Submit Your Delivery
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <form onSubmit={handleDeliver} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      Evidence URL
                      <span className="text-gray-500 font-normal ml-2 text-xs">
                        GitHub, live site, Figma, etc.
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
                    <label className="text-sm font-medium text-gray-300">
                      Delivery Note
                    </label>
                    <Textarea
                      rows={3}
                      placeholder="Describe what you built and how it fulfills the job requirements…"
                      value={evidenceNote}
                      onChange={(e) => setEvidenceNote(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      "Submit Delivery"
                    )}
                  </Button>
                  {deliverState.txHash && (
                    <TxHashDisplay
                      hash={deliverState.txHash}
                      status={deliverState.status}
                    />
                  )}
                </form>
              </CardContent>
            </Card>
          )}

          {job.status === "active" && !isFreelancer && !isClient && (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-gray-400">
                  This job is currently being worked on.
                </p>
              </CardContent>
            </Card>
          )}

          {/* DELIVERED: Evidence + actions */}
          {job.status === "delivered" && (
            <>
              {/* Show evidence */}
              <Card className="border-orange-500/20">
                <CardHeader>
                  <CardTitle className="text-base text-orange-300">
                    Freelancer Submission
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <a
                      href={job.evidence_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-300 underline text-sm break-all hover:text-orange-200 transition-colors"
                    >
                      {job.evidence_url}
                    </a>
                  </div>
                  {job.evidence_note && (
                    <p className="text-sm text-gray-300 whitespace-pre-wrap border-t border-white/5 pt-3">
                      {job.evidence_note}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Client actions */}
              {isClient && (
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    {/* AI evaluate */}
                    <div className="space-y-2">
                      <Button
                        onClick={() => autoEvaluate(jobId)}
                        disabled={evaluating}
                        className="w-full"
                      >
                        {evaluating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            AI Validators reviewing…
                          </>
                        ) : (
                          <>
                            <Brain className="w-4 h-4" />
                            Trigger AI Evaluation
                          </>
                        )}
                      </Button>
                      {evaluating && (
                        <p className="text-xs text-purple-300 text-center animate-pulse">
                          Waiting for AI consensus across validator nodes…
                        </p>
                      )}
                      {evalState.txHash && (
                        <TxHashDisplay
                          hash={evalState.txHash}
                          status={evalState.status}
                        />
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-white/5" />
                      <span className="text-xs text-gray-500">or</span>
                      <div className="flex-1 h-px bg-white/5" />
                    </div>

                    {/* Manual release */}
                    <Button
                      variant="success"
                      onClick={() => release(jobId)}
                      disabled={releasing}
                      className="w-full"
                    >
                      {releasing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Releasing…
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Approve & Pay Manually
                        </>
                      )}
                    </Button>
                    {releaseState.txHash && (
                      <TxHashDisplay
                        hash={releaseState.txHash}
                        status={releaseState.status}
                      />
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Freelancer view while waiting */}
              {isFreelancer && (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Clock className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-300">
                      Delivery submitted. Waiting for the client to approve or trigger AI evaluation.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* COMPLETED */}
          {job.status === "completed" && (
            <Card className="border-green-500/20">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2 text-green-400 font-semibold">
                  <CheckCircle2 className="w-5 h-5" />
                  AI Approved — Funds Released
                </div>
                {job.ai_reasoning && (
                  <p className="text-sm text-gray-300 whitespace-pre-wrap border-t border-white/5 pt-3">
                    <span className="text-gray-500 text-xs uppercase tracking-wide block mb-1">
                      AI Reasoning
                    </span>
                    {job.ai_reasoning}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* DISPUTED */}
          {job.status === "disputed" && (
            <Card className="border-red-500/20">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2 text-red-400 font-semibold">
                  <AlertCircle className="w-5 h-5" />
                  AI Rejected — Disputed
                </div>
                {job.ai_reasoning && (
                  <p className="text-sm text-gray-300 whitespace-pre-wrap border-t border-white/5 pt-3">
                    <span className="text-gray-500 text-xs uppercase tracking-wide block mb-1">
                      AI Reasoning
                    </span>
                    {job.ai_reasoning}
                  </p>
                )}
                <div className="pt-2">
                  <Button variant="outline" className="w-full opacity-50 cursor-not-allowed" disabled>
                    Appeal (Coming Soon)
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

function TxHashDisplay({
  hash,
  status,
}: {
  hash: string;
  status: string;
}) {
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs">
      <Hash className="w-3 h-3 text-gray-500 flex-shrink-0" />
      <code className="text-purple-400 font-mono truncate flex-1">{hash}</code>
      <span
        className={`text-[10px] uppercase font-semibold flex-shrink-0 ${
          status === "finalized"
            ? "text-green-400"
            : status === "error"
            ? "text-red-400"
            : "text-yellow-400"
        }`}
      >
        {status}
      </span>
    </div>
  );
}
