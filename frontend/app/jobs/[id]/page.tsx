'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { StatusTimeline } from '@/components/StatusTimeline';
import { StatusBadge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  useGetJob,
  useTakeJob,
  useSubmitDelivery,
  useAutoEvaluate,
  useRelease,
} from '@/hooks/useArbiqContract';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { truncateAddress, formatBudget, formatDeadline } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Loader2,
  ExternalLink,
  Calendar,
  Wallet,
  User,
  Brain,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  Copy,
  Check,
  Share2,
} from 'lucide-react';
import { TxHudOverlay } from '@/components/TxHudOverlay';
import { JobChat } from '@/components/JobChat';
import { EvidencePreview } from '@/components/EvidencePreview';
import { Footer } from '@/components/Footer';
import Link from 'next/link';

function JobHudLoader({ jobId }: { jobId: number }) {
  const [pct, setPct] = useState(0);
  const [scanY, setScanY] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const [block, setBlock] = useState(4821094 + Math.floor(Math.random() * 100));
  const [blink, setBlink] = useState(true);

  const MSGS = [
    'FETCHING CASE FILE...',
    'QUERYING BLOCKCHAIN...',
    'DECRYPTING JOB DATA...',
    'SYNCING VALIDATORS...',
    'LOADING EVIDENCE...',
  ];

  useEffect(() => {
    const bar = setInterval(() => setPct((p) => Math.min(p + 1.1, 95)), 40);
    const scan = setInterval(() => setScanY((y) => (y + 1.8) % 100), 16);
    const msg = setInterval(() => setMsgIdx((i) => (i + 1) % MSGS.length), 900);
    const blk = setInterval(() => setBlock((b) => b + 1), 2000);
    const blinkI = setInterval(() => setBlink((b) => !b), 600);
    return () => { clearInterval(bar); clearInterval(scan); clearInterval(msg); clearInterval(blk); clearInterval(blinkI); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 480,
        fontFamily: '"JetBrains Mono", monospace',
        color: '#00f0ff',
        position: 'relative',
      }}
    >
      {/* Corner brackets */}
      {[
        { top: 0, left: 0, borderTop: '2px solid #00f0ff', borderLeft: '2px solid #00f0ff', width: 20, height: 20 },
        { top: 0, right: 0, borderTop: '2px solid #00f0ff', borderRight: '2px solid #00f0ff', width: 20, height: 20 },
        { bottom: 0, left: 0, borderBottom: '2px solid #00f0ff', borderLeft: '2px solid #00f0ff', width: 20, height: 20 },
        { bottom: 0, right: 0, borderBottom: '2px solid #00f0ff', borderRight: '2px solid #00f0ff', width: 20, height: 20 },
      ].map((s, i) => (
        <div key={i} style={{ position: 'absolute', ...s }} />
      ))}

      <div style={{ padding: '28px 32px', overflow: 'hidden', position: 'relative' }}>
        {/* Scan line */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${scanY}%`,
            height: 2,
            background: 'linear-gradient(90deg, transparent, #00f0ff88, #00f0ff, #00f0ff88, transparent)',
            boxShadow: '0 0 12px #00f0ff, 0 0 24px #00f0ff44',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <div style={{ width: 8, height: 8, background: '#00f0ff', borderRadius: '50%', boxShadow: '0 0 8px #00f0ff', opacity: blink ? 1 : 0.2, transition: 'opacity 0.15s' }} />
          <span style={{ fontSize: 11, letterSpacing: '0.25em', fontWeight: 700 }}>
            {MSGS[msgIdx]}
          </span>
        </div>

        {/* Case ID */}
        <div style={{ fontSize: 10, color: 'rgba(0,240,255,0.5)', letterSpacing: '0.15em', marginBottom: 4 }}>CASE ID</div>
        <div style={{ fontSize: 22, fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '0.1em', color: '#00f0ff', textShadow: '0 0 20px #00f0ff88', marginBottom: 20 }}>
          #{String(jobId).padStart(6, '0')}
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'rgba(0,240,255,0.5)', marginBottom: 4, letterSpacing: '0.12em' }}>
            <span>DATA INTEGRITY</span>
            <span>{Math.floor(pct)}%</span>
          </div>
          <div style={{ height: 3, background: 'rgba(0,240,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${pct}%`,
                background: 'linear-gradient(90deg, #00f0ff, #00ff88)',
                boxShadow: '0 0 8px #00f0ff',
                borderRadius: 2,
                transition: 'width 0.04s linear',
              }}
            />
          </div>
        </div>

        {/* Block fill dots */}
        <div style={{ display: 'flex', gap: 3, marginBottom: 24 }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 1,
                background: i < Math.floor(pct / 5) ? '#00f0ff' : 'rgba(0,240,255,0.1)',
                boxShadow: i < Math.floor(pct / 5) ? '0 0 4px #00f0ff' : undefined,
                transition: 'background 0.2s',
              }}
            />
          ))}
        </div>

        {/* Live stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
          {[
            { label: 'BLOCK', value: `#${block.toLocaleString()}` },
            { label: 'VALIDATORS', value: '5 / 5 ONLINE' },
            { label: 'NETWORK', value: 'GENLAYER BRADBURY' },
            { label: 'STATUS', value: 'SYNCING...' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 8, color: 'rgba(0,240,255,0.4)', letterSpacing: '0.15em', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 10, color: '#00f0ff', fontWeight: 700 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Separator */}
        <div style={{ height: 1, background: 'rgba(0,240,255,0.12)', margin: '20px 0' }} />

        {/* Bottom status row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 9, color: 'rgba(0,240,255,0.4)', letterSpacing: '0.12em' }}>
          <span>ARBIQ PROTOCOL v2.4.1</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: '#00f0ff',
                  opacity: blink && i === msgIdx % 3 ? 1 : 0.2,
                  transition: 'opacity 0.15s',
                }}
              />
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const jobId = parseInt(id, 10);

  const { data: job, isLoading, refetch } = useGetJob(jobId);
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceNote, setEvidenceNote] = useState('');

  const { takeJob, txState: takeState, isLoading: takingJob } = useTakeJob();
  const { submitDelivery, txState: deliverState, isLoading: submitting } = useSubmitDelivery();
  const { autoEvaluate, txState: evalState, isLoading: evaluating } = useAutoEvaluate();
  const { release, txState: releaseState, isLoading: releasing } = useRelease();

  useEffect(() => {
    const states = [takeState, deliverState, evalState, releaseState];
    if (states.some((s) => s.status === 'finalized')) setTimeout(() => refetch(), 3000);
    states.forEach((s) => {
      if (s.status === 'error' && s.error) toast.error(s.error);
    });
  }, [takeState, deliverState, evalState, releaseState, refetch]);

  if (isLoading)
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <Navbar />
        <main className="pt-32 flex items-center justify-center px-4">
          <JobHudLoader jobId={jobId} />
        </main>
      </div>
    );

  if (!job)
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <Navbar />
        <main className="pt-32 flex flex-col items-center justify-center px-4 text-center">
          <AlertCircle
            className="w-16 h-16 mb-5"
            style={{ color: 'rgba(167,139,250,0.45)' }}
          />
          <h2
            className="text-xl font-bold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Job not found
          </h2>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
            Job #{jobId} doesn&apos;t exist on this network.
          </p>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-mid)',
              color: 'var(--text-secondary)',
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Jobs
          </Link>
        </main>
      </div>
    );

  const isClient = address?.toLowerCase() === job.client.toLowerCase();
  const isFreelancer = job.freelancer && address?.toLowerCase() === job.freelancer.toLowerCase();

  const handleDeliver = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!evidenceUrl.trim()) {
      toast.error('Evidence URL is required');
      return;
    }
    submitDelivery(jobId, evidenceUrl, evidenceNote);
  };

  // Compute days since posting
  const daysAgoPosted = job.created_at
    ? Math.max(0, Math.floor((Date.now() - new Date(job.created_at).getTime()) / 86_400_000))
    : null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Navbar />

      {/* Page header */}
      <div
        className="pt-24 pb-8 px-4 md:px-8 relative overflow-hidden"
        style={{ borderBottom: '1px solid var(--border-page)' }}
      >
        <div className="orb orb-violet absolute w-96 h-96 -top-20 -right-20 opacity-20" />
        <div className="max-w-3xl mx-auto relative z-10">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 text-xs mb-5 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
            }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to jobs
          </Link>

          <div className="flex items-start justify-between gap-4 mb-5">
            <h1
              className="text-2xl md:text-3xl font-black leading-tight flex-1"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              {job.title}
            </h1>
            <div className="flex items-center gap-2 shrink-0">
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
              background: 'var(--surface-card)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <MetaItem label="Budget" value={formatBudget(job.budget)} color="#a78bfa" mono />
            <MetaItem
              label="Deadline"
              value={formatDeadline(job.deadline)}
              icon={<Calendar className="w-3.5 h-3.5" />}
            />
            <MetaItem
              label="Client"
              value={truncateAddress(job.client)}
              fullValue={job.client}
              mono
              copyable
              icon={<User className="w-3.5 h-3.5" />}
            />
            {job.freelancer ? (
              <MetaItem
                label="Freelancer"
                value={truncateAddress(job.freelancer)}
                fullValue={job.freelancer}
                mono
                copyable
                icon={<Wallet className="w-3.5 h-3.5" />}
              />
            ) : job.created_at ? (
              <MetaItem
                label="Posted"
                value={new Date(job.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
                icon={<Clock className="w-3.5 h-3.5" />}
              />
            ) : null}
          </div>

          {/* Description */}
          <Section title="Job Description">
            <p
              className="text-sm leading-relaxed whitespace-pre-wrap"
              style={{ color: 'var(--text-secondary)' }}
            >
              {job.description}
            </p>
          </Section>

          {/* ── OPEN ── */}
          {job.status === 'open' && (
            <Section title={isClient ? 'Awaiting Freelancer' : 'Accept This Job'} accent="#38bdf8">
              {isClient ? (
                <div className="space-y-4">
                  {/* Pulsing waiting indicator */}
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span
                        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                        style={{ background: '#38bdf8' }}
                      />
                      <span
                        className="relative inline-flex rounded-full h-2.5 w-2.5"
                        style={{ background: '#38bdf8' }}
                      />
                    </span>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Waiting for freelancer
                    </p>
                  </div>

                  {daysAgoPosted !== null && (
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Posted{' '}
                      {daysAgoPosted === 0
                        ? 'today'
                        : daysAgoPosted === 1
                        ? '1 day ago'
                        : `${daysAgoPosted} days ago`}
                    </p>
                  )}

                  {/* Share nudge */}
                  <div
                    className="flex items-center justify-between gap-3 p-3 rounded-xl"
                    style={{
                      background: 'rgba(56,189,248,0.06)',
                      border: '1px solid rgba(56,189,248,0.15)',
                    }}
                  >
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Share this job to find a freelancer faster →
                    </p>
                    <ShareButton compact />
                  </div>
                </div>
              ) : isConnected ? (
                <div className="space-y-3">
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Accept this job and start working. You&apos;ll be the assigned freelancer.
                  </p>
                  <ActionButton
                    onClick={() => takeJob(jobId)}
                    loading={takingJob}
                    label="Accept & Start Working"
                    loadingLabel="Accepting…"
                  />
                  <TxHudOverlay
                    status={takeState.status}
                    consensusStatus={takeState.consensusStatus}
                    txHash={takeState.txHash}
                    error={takeState.error}
                    operation={takeState.operation ?? "take_job"}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Connect your wallet to take this job
                  </p>
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
          {job.status === 'active' && isFreelancer && (
            <Section title="Submit Your Delivery" accent="#f59e0b">
              <form onSubmit={handleDeliver} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold" style={{ color: 'var(--text-label)' }}>
                    Evidence URL
                    <span
                      className="text-xs font-normal ml-2"
                      style={{ color: 'var(--text-muted)' }}
                    >
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
                  <EvidencePreview
                    url={evidenceUrl}
                    jobTitle={job.title}
                    jobDescription={job.description}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold" style={{ color: 'var(--text-label)' }}>
                    Delivery Note
                  </label>
                  <Textarea
                    rows={4}
                    placeholder="Explain what you built and how it satisfies every requirement in the job description…"
                    value={evidenceNote}
                    onChange={(e) => setEvidenceNote(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <ActionButton
                  type="submit"
                  loading={submitting}
                  label="Submit Delivery"
                  loadingLabel="Submitting…"
                />
                <TxHudOverlay
                  status={deliverState.status}
                  consensusStatus={deliverState.consensusStatus}
                  txHash={deliverState.txHash}
                  error={deliverState.error}
                  operation={deliverState.operation ?? "submit_delivery"}
                />
              </form>
            </Section>
          )}

          {job.status === 'active' && !isFreelancer && !isClient && (
            <Section title="In Progress">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                This job is currently being worked on.
              </p>
            </Section>
          )}

          {/* ── DELIVERED ── */}
          {job.status === 'delivered' && (
            <>
              <Section title="Freelancer Submission" accent="#fb923c">
                <a
                  href={job.evidence_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm break-all transition-colors mb-3"
                  style={{ color: '#fdba74' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = '#fbbf24';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = '#fdba74';
                  }}
                >
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  {job.evidence_url}
                </a>
                {job.evidence_note && (
                  <p
                    className="text-sm whitespace-pre-wrap leading-relaxed pt-3"
                    style={{
                      color: 'var(--text-secondary)',
                      borderTop: '1px solid var(--border-divider)',
                    }}
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
                      style={{
                        background: 'rgba(124,58,237,0.06)',
                        border: '1px solid rgba(124,58,237,0.15)',
                      }}
                    >
                      <div>
                        <p
                          className="text-sm font-semibold mb-1 flex items-center gap-2"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          <Brain className="w-4 h-4" style={{ color: '#a78bfa' }} />
                          AI Evaluation
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          GenLayer&apos;s validator network will read the job spec and the evidence
                          URL, then reach consensus.
                        </p>
                      </div>
                      <ActionButton
                        onClick={() => autoEvaluate(jobId)}
                        loading={evaluating}
                        label="Trigger AI Evaluation"
                        loadingLabel="AI Validators reviewing…"
                        icon={<Brain className="w-4 h-4" />}
                      />
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Typical evaluation time: 1–5 minutes. You&apos;ll see live validator
                        progress below.
                      </p>
                      <TxHudOverlay
                        status={evalState.status}
                        consensusStatus={evalState.consensusStatus}
                        txHash={evalState.txHash}
                        error={evalState.error}
                        operation={evalState.operation ?? "auto_evaluate"}
                      />
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                      <div
                        className="flex-1 h-px"
                        style={{ background: 'var(--border-divider)' }}
                      />
                      <span className="text-xs" style={{ color: 'var(--text-label-dim)' }}>
                        or
                      </span>
                      <div
                        className="flex-1 h-px"
                        style={{ background: 'var(--border-divider)' }}
                      />
                    </div>

                    {/* Manual release */}
                    <div
                      className="p-4 rounded-xl space-y-3"
                      style={{
                        background: 'rgba(34,197,94,0.06)',
                        border: '1px solid rgba(34,197,94,0.15)',
                      }}
                    >
                      <p
                        className="text-sm font-semibold flex items-center gap-2"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        Manual Approval
                      </p>
                      <button
                        onClick={() => release(jobId)}
                        disabled={releasing}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                        style={{
                          background: 'rgba(34,197,94,0.12)',
                          border: '1px solid rgba(34,197,94,0.25)',
                          color: '#86efac',
                        }}
                      >
                        {releasing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Releasing…
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" /> Approve & Pay Manually
                          </>
                        )}
                      </button>
                      <TxHudOverlay
                        status={releaseState.status}
                        consensusStatus={releaseState.consensusStatus}
                        txHash={releaseState.txHash}
                        error={releaseState.error}
                        operation={releaseState.operation ?? "release_manually"}
                      />
                    </div>
                  </div>
                </Section>
              )}

              {isFreelancer && (
                <Section title="Waiting for Client">
                  <div
                    className="flex items-center gap-3 text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <Clock className="w-5 h-5 text-orange-400 shrink-0" />
                    Delivery submitted. The client can approve or trigger AI evaluation.
                  </div>
                </Section>
              )}
            </>
          )}

          {/* ── COMPLETED ── */}
          {job.status === 'completed' && (
            <div
              className="p-6 rounded-2xl space-y-3 anim-scale-in"
              style={{
                background:
                  'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.03) 100%)',
                border: '1px solid rgba(34,197,94,0.2)',
                boxShadow: '0 0 40px rgba(34,197,94,0.08)',
              }}
            >
              <div className="flex items-center gap-2 font-bold text-green-300">
                <CheckCircle2 className="w-5 h-5" />
                ✦ AI Approved — Funds Released
              </div>
              <p className="text-xs" style={{ color: 'rgba(34,197,94,0.6)' }}>
                Funds were transferred automatically on consensus.
              </p>
              {job.ai_reasoning && (
                <div className="pt-3" style={{ borderTop: '1px solid rgba(34,197,94,0.12)' }}>
                  <p
                    className="text-[10px] uppercase font-bold tracking-widest mb-2"
                    style={{ color: 'rgba(34,197,94,0.5)' }}
                  >
                    AI Reasoning
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {job.ai_reasoning}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── DISPUTED ── */}
          {job.status === 'disputed' && (
            <div
              className="p-6 rounded-2xl space-y-3 anim-scale-in"
              style={{
                background:
                  'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.03) 100%)',
                border: '1px solid rgba(239,68,68,0.2)',
                boxShadow: '0 0 40px rgba(239,68,68,0.08)',
              }}
            >
              <div className="flex items-center gap-2 font-bold text-red-300">
                <AlertCircle className="w-5 h-5" />
                AI Rejected — Disputed
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(239,68,68,0.65)' }}>
                The AI evaluated the evidence and found it insufficient for the job spec. Funds
                remain locked. Re-evaluate with better evidence when available.
              </p>
              {job.ai_reasoning && (
                <div className="pt-3" style={{ borderTop: '1px solid rgba(239,68,68,0.12)' }}>
                  <p
                    className="text-[10px] uppercase font-bold tracking-widest mb-2"
                    style={{ color: 'rgba(239,68,68,0.5)' }}
                  >
                    AI Reasoning
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {job.ai_reasoning}
                  </p>
                </div>
              )}
              <button
                disabled
                className="w-full py-2.5 rounded-xl text-sm font-semibold mt-2 opacity-40 cursor-not-allowed"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: '#fca5a5',
                }}
              >
                Appeal — Coming Soon
              </button>
            </div>
          )}

          {/* ── ON-CHAIN CHAT — only visible to client + assigned freelancer ── */}
          {job.freelancer && (isClient || isFreelancer) && (
            <JobChat
              jobId={jobId}
              address={address!}
              clientAddress={job.client}
              freelancerAddress={job.freelancer}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function MetaItem({
  label,
  value,
  fullValue,
  mono,
  copyable,
  icon,
  color,
}: {
  label: string;
  value: string;
  fullValue?: string;
  mono?: boolean;
  copyable?: boolean;
  icon?: React.ReactNode;
  color?: string;
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
      <p
        className="text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: 'var(--text-label-dim)' }}
      >
        {label}
      </p>
      <div className="flex items-center gap-1.5">
        <p
          className="text-sm flex items-center gap-1.5 font-medium"
          style={{
            fontFamily: mono ? 'monospace' : undefined,
            color: color ?? 'var(--text-label)',
          }}
        >
          {icon}
          {value}
        </p>
        {copyable && (
          <button
            onClick={copy}
            title="Copy address"
            className="transition-all"
            style={{ color: copied ? '#86efac' : 'var(--text-muted)', lineHeight: 1 }}
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button>
        )}
      </div>
    </div>
  );
}

function ShareButton({ compact }: { compact?: boolean }) {
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

  if (compact) {
    return (
      <button
        onClick={share}
        title="Share this job"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0"
        style={{
          background: 'rgba(56,189,248,0.1)',
          border: '1px solid rgba(56,189,248,0.2)',
          color: shared ? '#86efac' : '#7dd3fc',
        }}
      >
        {shared ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
        {shared ? 'Copied!' : 'Share'}
      </button>
    );
  }

  return (
    <button
      onClick={share}
      title="Share this job"
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
      style={{
        background: 'var(--surface-raised)',
        border: '1px solid var(--border-mid)',
        color: shared ? '#86efac' : 'var(--text-muted)',
      }}
    >
      {shared ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
    </button>
  );
}

function Section({
  title,
  children,
  accent,
}: {
  title: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div
      className="p-6 md:p-7 rounded-2xl space-y-4 relative overflow-hidden"
      style={{
        background: 'var(--surface-card)',
        border: `1px solid ${accent ? `${accent}22` : 'var(--border-subtle)'}`,
      }}
    >
      {/* Left border accent */}
      {accent && (
        <div
          className="absolute left-0 top-0 bottom-0 rounded-l-2xl"
          style={{ width: 3, background: accent, opacity: 0.7 }}
        />
      )}
      <h2
        className="text-[11px] font-bold uppercase tracking-widest"
        style={{ color: accent ?? 'var(--text-label)' }}
      >
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
  type = 'button',
}: {
  onClick?: () => void;
  loading: boolean;
  label: string;
  loadingLabel: string;
  icon?: React.ReactNode;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
      style={{ color: 'white' }}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {loadingLabel}
        </>
      ) : (
        <>
          {icon}
          {label}
        </>
      )}
    </button>
  );
}
