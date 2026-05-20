'use client';

import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Shield, Zap, Brain, ArrowRight, CheckCircle, Lock, Scale, Coins } from 'lucide-react';
import { useGetAllJobs } from '@/hooks/useArbiqContract';
import { useCountUp } from '@/hooks/useCountUp';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const TECH_TAGS = [
  'GenLayer Consensus', 'Zero Platform Fees', 'Trustless Escrow', 'On-chain Verdicts',
  'AI Arbitration', 'Immutable Contracts', 'Instant Payouts', 'No Middlemen',
  'GenLayer Consensus', 'Zero Platform Fees', 'Trustless Escrow', 'On-chain Verdicts',
  'AI Arbitration', 'Immutable Contracts', 'Instant Payouts', 'No Middlemen',
];

const features = [
  {
    icon: Lock,
    title: 'Escrow at Post Time',
    body: "Client funds lock the moment a job is created — not when you shake hands. The contract holds GEN until work is verified.",
    accent: '#7c3aed',
  },
  {
    icon: Brain,
    title: 'AI Reads the Spec',
    body: "Multiple GenLayer validators independently evaluate your job description against the submitted evidence. Consensus, not a coin flip.",
    accent: '#38bdf8',
  },
  {
    icon: Zap,
    title: 'Automatic Settlement',
    body: 'Approved work triggers an immediate on-chain transfer. No invoice chasing, no payment delays, no excuses.',
    accent: '#22c55e',
  },
  {
    icon: Scale,
    title: 'Decentralized Disputes',
    body: 'No single arbiter can be bribed or pressured. Every contested job is settled by AI validator consensus.',
    accent: '#f59e0b',
  },
  {
    icon: Shield,
    title: 'Neither Side Can Cheat',
    body: "Clients can't pull funds early. Freelancers can't claim payment without delivering. The contract enforces both sides.",
    accent: '#ec4899',
  },
  {
    icon: Coins,
    title: '0% Platform Cut',
    body: 'What you earn is what you keep. Every GEN you make goes straight to your wallet — nothing skimmed off the top.',
    accent: '#fb923c',
  },
];

const steps = [
  { n: '01', title: 'Post a Job',          desc: 'Describe what you need in plain language. Set a GEN budget — it locks in escrow immediately on transaction confirmation.' },
  { n: '02', title: 'Freelancer Accepts',  desc: 'Any wallet can browse open jobs and claim one. Once taken, the job moves to Active and messaging opens between both parties.' },
  { n: '03', title: 'Work & Deliver',      desc: 'Freelancer submits a GitHub link, live URL, Loom, Figma — any evidence that proves the work exists.' },
  { n: '04', title: 'AI Evaluates',        desc: "GenLayer validators each run the same LLM prompt against your spec and evidence, then compare results until they agree." },
  { n: '05', title: 'Funds Settle',        desc: 'Approved? GEN transfers automatically. Disputed? Funds stay locked until resolved.' },
];

function LiveStats() {
  const { data: jobs = [] } = useGetAllJobs();
  const total     = useCountUp(jobs.length, 800);
  const open      = useCountUp(jobs.filter((j) => j.status === 'open').length, 900);
  const completed = useCountUp(jobs.filter((j) => j.status === 'completed').length, 1000);

  const stats = [
    { value: total,     label: 'Jobs on-chain', color: '#a78bfa' },
    { value: open,      label: 'Open now',       color: '#38bdf8' },
    { value: completed, label: 'Completed',      color: '#22c55e' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-12 mt-16 relative z-10 anim-fade-in" style={{ animationDelay: '400ms' }}>
      {stats.map(({ value, label, color }) => (
        <div key={label} className="text-center">
          <div
            className="font-display text-5xl tabular-nums"
            style={{ color, letterSpacing: '0.04em' }}
          >
            {value}
          </div>
          <div className="text-xs font-bold mt-1.5 tracking-widest" style={{ color: 'var(--text-muted)', letterSpacing: '0.10em' }}>
            {label.toUpperCase()}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const featuresRef = useScrollReveal<HTMLDivElement>(70);
  const stepsRef    = useScrollReveal<HTMLDivElement>(80);

  return (
    <div className="min-h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Navbar />

      {/* ─── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center pt-44 pb-32 px-4 text-center overflow-hidden">
        <div className="dot-grid" />

        <div
          className="orb orb-violet absolute w-[700px] h-[700px] -top-40 left-1/2 -translate-x-1/2 opacity-40 anim-orb-float"
          style={{ animationDuration: '14s' }}
        />
        <div className="orb orb-indigo absolute w-[380px] h-[380px] top-72 -left-40 opacity-25 anim-orb-float" style={{ animationDelay: '4s', animationDuration: '18s' }} />
        <div className="orb orb-pink   absolute w-[280px] h-[280px] top-80 -right-20 opacity-20 anim-orb-float" style={{ animationDelay: '8s', animationDuration: '16s' }} />

        <div className="absolute inset-0 hero-grain pointer-events-none" />

        {/* Eyebrow */}
        <div
          className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-bold mb-12 anim-fade-in relative z-10"
          style={{
            background: 'rgba(124,58,237,0.08)',
            border: '1px solid rgba(124,58,237,0.24)',
            color: '#c4b5fd',
            letterSpacing: '0.10em',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#a78bfa', boxShadow: '0 0 8px #a78bfa', animation: 'brandPulse 2s ease-in-out infinite' }} />
          POWERED BY GENLAYER AI CONSENSUS
        </div>

        {/* Headline */}
        <h1
          className="display grad-text-hero mx-auto relative z-10 anim-fade-up"
          style={{ animationDelay: '80ms', maxWidth: '900px' }}
        >
          GET PAID.<br />OR GET PROOF.
        </h1>

        <p
          className="text-lg md:text-xl max-w-lg mx-auto mt-7 mb-10 leading-relaxed relative z-10 anim-fade-up"
          style={{ color: 'var(--text-secondary)', animationDelay: '140ms', fontWeight: 500 }}
        >
          Arbiq locks client funds on-chain and uses AI to judge every delivery.
          If the work ships, you get paid. No negotiation, no waiting, no disputes left open.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 relative z-10 anim-fade-up" style={{ animationDelay: '200ms' }}>
          <Link
            href="/jobs/new"
            className="btn-primary flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-bold text-base"
          >
            Post a Job <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/jobs"
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-base transition-all duration-200"
            style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-mid)',
              color: 'var(--text-label)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)';
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--surface-raised)';
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-mid)';
            }}
          >
            Find Work
          </Link>
        </div>

        {/* Trust strip */}
        <div
          className="flex flex-wrap items-center justify-center gap-6 mt-10 text-xs relative z-10 anim-fade-in"
          style={{ color: 'var(--text-muted)', animationDelay: '300ms', fontWeight: 600, letterSpacing: '0.05em' }}
        >
          {['Funds locked in escrow', 'AI-enforced verdicts', 'Fully on-chain'].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" style={{ color: '#7c3aed' }} />
              {t.toUpperCase()}
            </span>
          ))}
        </div>

        <LiveStats />
      </section>

      {/* ─── MARQUEE ───────────────────────────────────────────────────── */}
      <div
        className="overflow-hidden py-4 relative"
        style={{ borderTop: '1px solid var(--border-divider)', borderBottom: '1px solid var(--border-divider)' }}
      >
        <div className="marquee-track">
          {TECH_TAGS.map((tag, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-3 px-6 text-xs font-bold flex-shrink-0"
              style={{ color: i % 4 === 0 ? '#a78bfa' : i % 4 === 1 ? '#38bdf8' : i % 4 === 2 ? '#22c55e' : 'var(--text-muted)', letterSpacing: '0.10em' }}
            >
              {tag}
              <span className="opacity-30" style={{ fontSize: '7px' }}>◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ─── FEATURES ──────────────────────────────────────────────────── */}
      <section className="py-32 px-4 relative">
        <div className="orb orb-violet absolute w-[500px] h-[500px] top-10 left-1/2 -translate-x-1/2 opacity-[0.07] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <p className="label mb-3" style={{ color: '#7c3aed' }}>How it protects you</p>
            <h2 className="headline" style={{ color: 'var(--text-primary)' }}>Built on trustless infrastructure</h2>
            <p className="text-base mt-4 max-w-md mx-auto" style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
              Every rule is encoded in the contract. No one can override it — not us, not the client, not the freelancer.
            </p>
          </div>

          <div ref={featuresRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, body, accent }) => (
              <div
                key={title}
                className="reveal card-lift rounded-2xl p-7 relative overflow-hidden group"
                style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-2xl"
                  style={{ background: `radial-gradient(ellipse at top left, ${accent}14 0%, transparent 65%)` }}
                />
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 relative z-10"
                  style={{ background: `${accent}12`, border: `1px solid ${accent}24` }}
                >
                  <Icon className="w-5 h-5" style={{ color: accent }} strokeWidth={1.8} />
                </div>
                <h3 className="font-bold mb-2.5 text-sm relative z-10 tracking-tight" style={{ color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{title}</h3>
                <p className="text-sm leading-relaxed relative z-10" style={{ color: 'var(--text-muted)' }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AI VERDICT PANEL ──────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div
            className="rounded-3xl relative overflow-hidden"
            style={{ border: '1px solid rgba(124,58,237,0.20)', background: 'linear-gradient(135deg,rgba(124,58,237,0.08) 0%,rgba(99,102,241,0.04) 100%)' }}
          >
            <div className="orb orb-violet absolute w-96 h-96 -top-24 right-0 opacity-25 pointer-events-none" />

            <div className="relative z-10 p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(124,58,237,0.16)', border: '1px solid rgba(124,58,237,0.28)' }}
                >
                  <Brain className="w-4.5 h-4.5" style={{ color: '#a78bfa' }} strokeWidth={1.8} />
                </div>
                <span className="label" style={{ color: '#7c3aed' }}>AI Verdict Engine</span>
              </div>

              <h2 className="headline mb-4" style={{ color: 'var(--text-primary)', maxWidth: '480px' }}>
                Every dispute settled by validator consensus
              </h2>
              <p className="text-base mb-8 leading-relaxed" style={{ color: 'var(--text-secondary)', maxWidth: '520px' }}>
                GenLayer runs multiple independent validators. Each one reads your job spec and the submitted
                evidence, runs an LLM evaluation, then hashes the result. All hashes must match before
                the transaction finalizes — no single point of control or manipulation.
              </p>

              {/* Sample verdict */}
              <div
                className="rounded-2xl p-6"
                style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', maxWidth: '520px' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="label" style={{ color: 'var(--text-muted)' }}>Sample Verdict</span>
                  <span
                    className="pill"
                    style={{ background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.24)', color: '#86efac' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px #22c55e' }} />
                    APPROVED
                  </span>
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                  "The submitted repository implements all five specified endpoints with passing test coverage.
                  API documentation is present and matches the job spec. Work is complete."
                </p>
                <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>Consensus: 7/7 validators</span>
                  <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>1.0 GEN released</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section className="py-28 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-16">
            <p className="label mb-3" style={{ color: '#7c3aed' }}>The flow</p>
            <h2 className="headline" style={{ color: 'var(--text-primary)' }}>Five steps, fully on-chain</h2>
          </div>

          <div ref={stepsRef} className="relative">
            <div
              className="absolute left-[19px] top-10 bottom-10 w-px"
              style={{ background: 'linear-gradient(to bottom, rgba(124,58,237,0.50), transparent)' }}
            />
            <div className="space-y-8">
              {steps.map(({ n, title, desc }, i) => (
                <div key={n} className="reveal flex gap-6 relative">
                  <div
                    className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold relative z-10 font-mono"
                    style={{
                      background: i < 3
                        ? 'linear-gradient(135deg,#7c3aed,#a78bfa)'
                        : 'rgba(124,58,237,0.12)',
                      border: i >= 3 ? '1px solid rgba(124,58,237,0.26)' : 'none',
                      color: i < 3 ? 'white' : '#a78bfa',
                    }}
                  >
                    {n}
                  </div>
                  <div className="pt-2">
                    <h4 className="font-bold mb-1.5" style={{ color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{title}</h4>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ────────────────────────────────────────────────── */}
      <section className="py-16 px-4 mb-10">
        <div className="max-w-3xl mx-auto">
          <div
            className="rounded-3xl p-10 md:p-14 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(99,102,241,0.06) 100%)',
              border: '1px solid rgba(124,58,237,0.22)',
            }}
          >
            <div className="orb orb-violet absolute w-80 h-80 -top-20 left-1/2 -translate-x-1/2 opacity-35 pointer-events-none" />
            <p className="label mb-3 relative z-10" style={{ color: '#7c3aed' }}>Start now</p>
            <h2 className="headline mb-4 relative z-10" style={{ color: 'var(--text-primary)' }}>Stop worrying about payment.</h2>
            <p className="text-base mb-8 relative z-10 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
              The contract handles it. Post your first job or pick up open work — both sides are protected from the start.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
              <Link
                href="/jobs/new"
                className="btn-primary flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-bold"
              >
                Post Your First Job <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/jobs"
                className="px-8 py-3.5 rounded-xl font-semibold transition-colors"
                style={{ color: '#a78bfa' }}
              >
                Browse Open Jobs →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
