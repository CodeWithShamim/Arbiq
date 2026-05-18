'use client';

import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Shield, Zap, Brain, ArrowRight, CheckCircle, Lock, Scale, Coins } from 'lucide-react';
import { useGetAllJobs } from '@/hooks/useArbiqContract';
import { useCountUp } from '@/hooks/useCountUp';
import { useScrollReveal } from '@/hooks/useScrollReveal';

/* ── Marquee tech strip ─────────────────────────────────────────────────── */
const TECH_TAGS = [
  'GenLayer Consensus', 'AI Enforcement', 'Trustless Escrow', 'On-chain Verdicts',
  'ZK Proofs', 'Immutable Contracts', 'Instant Payouts', 'No Middlemen',
  'GenLayer Consensus', 'AI Enforcement', 'Trustless Escrow', 'On-chain Verdicts',
  'ZK Proofs', 'Immutable Contracts', 'Instant Payouts', 'No Middlemen',
];

/* ── Feature cards ──────────────────────────────────────────────────────── */
const features = [
  {
    icon: Lock,
    title: 'Escrow Protection',
    body: 'Client funds lock on-chain at job creation. Released only after AI renders verdict.',
    accent: '#7c3aed',
  },
  {
    icon: Brain,
    title: 'AI Evaluation',
    body: "GenLayer's consensus AI reads your spec and freelancer evidence, then decides impartially.",
    accent: '#38bdf8',
  },
  {
    icon: Zap,
    title: 'Instant Payout',
    body: 'On approval, GEN transfers automatically. No delay, no human intermediary.',
    accent: '#22c55e',
  },
  {
    icon: Scale,
    title: 'Dispute Resolution',
    body: 'Every dispute is settled by decentralized AI consensus — not a single arbiter.',
    accent: '#f59e0b',
  },
  {
    icon: Shield,
    title: 'Trustless by Design',
    body: 'Smart contracts enforce every rule. Neither party can cheat or withdraw early.',
    accent: '#ec4899',
  },
  {
    icon: Coins,
    title: 'No Platform Fees',
    body: 'Zero cut. Every GEN you earn goes directly to your wallet.',
    accent: '#fb923c',
  },
];

/* ── How it works steps ─────────────────────────────────────────────────── */
const steps = [
  { n: '01', title: 'Post a Job',          desc: 'Describe what you need in plain language. Set a GEN budget — it locks in escrow immediately.' },
  { n: '02', title: 'Freelancer Accepts',  desc: 'Any connected wallet can browse open jobs and claim one with a single click.' },
  { n: '03', title: 'Work & Deliver',      desc: 'Freelancer submits a GitHub link, live URL, or any evidence proving the work is done.' },
  { n: '04', title: 'AI Judges',           desc: "GenLayer's validator network reads the spec + evidence and reaches on-chain consensus." },
  { n: '05', title: 'Funds Released',      desc: 'Approved? GEN flows instantly. Disputed? Funds are held pending appeal.' },
];

/* ── Live chain stats ───────────────────────────────────────────────────── */
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
    <div className="flex flex-wrap items-center justify-center gap-10 mt-14 relative z-10 anim-fade-in" style={{ animationDelay: '400ms' }}>
      {stats.map(({ value, label, color }, i) => (
        <div key={label} className="text-center">
          <div
            className="font-display text-5xl tabular-nums"
            style={{ color, letterSpacing: '0.04em' }}
          >
            {value}
          </div>
          <div className="text-sm font-semibold mt-1" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
            {label.toUpperCase()}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */
export default function HomePage() {
  const featuresRef = useScrollReveal<HTMLDivElement>(70);
  const stepsRef    = useScrollReveal<HTMLDivElement>(80);

  return (
    <div className="min-h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Navbar />

      {/* ─── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center pt-40 pb-28 px-4 text-center overflow-hidden">
        {/* Dot grid */}
        <div className="dot-grid" />

        {/* Floating orbs */}
        <div
          className="orb orb-violet absolute w-[600px] h-[600px] -top-32 left-1/2 -translate-x-1/2 opacity-50 anim-orb-float"
          style={{ animationDuration: '14s' }}
        />
        <div className="orb orb-indigo absolute w-[360px] h-[360px] top-64 -left-40 opacity-30 anim-orb-float" style={{ animationDelay: '4s', animationDuration: '18s' }} />
        <div className="orb orb-pink   absolute w-[300px] h-[300px] top-80 -right-24 opacity-25 anim-orb-float" style={{ animationDelay: '8s', animationDuration: '16s' }} />

        {/* Grain overlay */}
        <div className="absolute inset-0 hero-grain pointer-events-none" />

        {/* Eyebrow pill */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-10 anim-fade-in relative z-10"
          style={{
            background: 'rgba(124,58,237,0.10)',
            border: '1px solid rgba(124,58,237,0.28)',
            color: '#c4b5fd',
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#a78bfa', boxShadow: '0 0 8px #a78bfa', animation: 'brandPulse 2s ease-in-out infinite' }} />
          Powered by GenLayer AI Consensus
        </div>

        {/* Headline — Bebas Neue display */}
        <h1
          className="display grad-text-hero mx-auto relative z-10 anim-fade-up whitespace-nowrap"
          style={{ animationDelay: '80ms' }}
        >
          FREELANCE JUSTICE.
        </h1>

        <p
          className="text-lg md:text-xl max-w-xl mx-auto mt-6 mb-10 leading-relaxed relative z-10 anim-fade-up"
          style={{ color: 'var(--text-secondary)', animationDelay: '140ms', fontWeight: 500 }}
        >
          Post jobs, earn crypto, and let an AI validator judge every delivery.
          No middlemen. No unresolved disputes.
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

        {/* Trust pills */}
        <div
          className="flex flex-wrap items-center justify-center gap-5 mt-10 text-xs relative z-10 anim-fade-in"
          style={{ color: 'var(--text-muted)', animationDelay: '300ms', fontWeight: 600, letterSpacing: '0.04em' }}
        >
          {['Trustless escrow', 'AI-enforced verdicts', 'On-chain transparency'].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" style={{ color: '#7c3aed' }} />
              {t.toUpperCase()}
            </span>
          ))}
        </div>

        {/* Live stats */}
        <LiveStats />
      </section>

      {/* ─── MARQUEE ───────────────────────────────────────────────────── */}
      <div
        className="overflow-hidden py-5 relative"
        style={{ borderTop: '1px solid var(--border-divider)', borderBottom: '1px solid var(--border-divider)' }}
      >
        <div className="marquee-track">
          {TECH_TAGS.map((tag, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-3 px-6 text-sm font-bold flex-shrink-0"
              style={{ color: i % 4 === 0 ? '#a78bfa' : i % 4 === 1 ? '#38bdf8' : i % 4 === 2 ? '#22c55e' : 'var(--text-muted)', letterSpacing: '0.08em' }}
            >
              {tag}
              <span className="text-[8px] opacity-40">◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ─── FEATURES ──────────────────────────────────────────────────── */}
      <section className="py-28 px-4 relative">
        <div className="orb orb-violet absolute w-[500px] h-[500px] top-10 left-1/2 -translate-x-1/2 opacity-10 pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <p className="label mb-3" style={{ color: '#7c3aed' }}>How it protects you</p>
            <h2 className="headline" style={{ color: 'var(--text-primary)' }}>Built on trustless infrastructure</h2>
          </div>

          <div ref={featuresRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, body, accent }) => (
              <div
                key={title}
                className="reveal card-lift rounded-2xl p-7 relative overflow-hidden group"
                style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-2xl"
                  style={{ background: `radial-gradient(ellipse at top left, ${accent}18 0%, transparent 65%)` }}
                />
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 relative z-10"
                  style={{ background: `${accent}15`, border: `1px solid ${accent}28` }}
                >
                  <Icon className="w-5 h-5" style={{ color: accent }} strokeWidth={1.8} />
                </div>
                <h3 className="font-bold mb-2 text-base relative z-10" style={{ color: 'var(--text-primary)' }}>{title}</h3>
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
            style={{ border: '1px solid rgba(124,58,237,0.22)', background: 'linear-gradient(135deg,rgba(124,58,237,0.10) 0%,rgba(99,102,241,0.06) 100%)' }}
          >
            <div className="orb orb-violet absolute w-96 h-96 -top-24 right-0 opacity-30 pointer-events-none" />

            <div className="relative z-10 p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(124,58,237,0.3)' }}
                >
                  <Brain className="w-5 h-5" style={{ color: '#a78bfa' }} strokeWidth={1.8} />
                </div>
                <div>
                  <p className="label" style={{ color: '#7c3aed' }}>AI Verdict System</p>
                </div>
              </div>

              <h2 className="headline mb-4" style={{ color: 'var(--text-primary)' }}>
                Every dispute resolved by consensus AI
              </h2>
              <p className="text-base mb-8 leading-relaxed" style={{ color: 'var(--text-secondary)', maxWidth: '540px' }}>
                GenLayer's validator network independently evaluates job specs, delivered work, and evidence.
                Multiple validators reach consensus — no single point of failure or manipulation.
              </p>

              {/* Mock verdict card */}
              <div
                className="rounded-2xl p-6"
                style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', maxWidth: '520px' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="label" style={{ color: 'var(--text-muted)' }}>Sample Verdict</span>
                  <span
                    className="pill"
                    style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.28)', color: '#86efac' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px #22c55e' }} />
                    APPROVED
                  </span>
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                  "The delivered GitHub repository implements all 5 specified endpoints with tests covering edge cases.
                  API documentation matches the job spec. Work is complete and satisfactory."
                </p>
                <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>Consensus: 7/7 validators</span>
                  <span>0.5 GEN released</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-16">
            <p className="label mb-3" style={{ color: '#7c3aed' }}>The flow</p>
            <h2 className="headline" style={{ color: 'var(--text-primary)' }}>Five steps, fully on-chain</h2>
          </div>

          <div ref={stepsRef} className="relative">
            <div
              className="absolute left-[19px] top-10 bottom-10 w-px"
              style={{ background: 'linear-gradient(to bottom, rgba(124,58,237,0.55), transparent)' }}
            />
            <div className="space-y-8">
              {steps.map(({ n, title, desc }, i) => (
                <div key={n} className="reveal flex gap-6 relative">
                  <div
                    className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold relative z-10 font-mono"
                    style={{
                      background: i < 3
                        ? 'linear-gradient(135deg,#7c3aed,#a78bfa)'
                        : 'rgba(124,58,237,0.14)',
                      border: i >= 3 ? '1px solid rgba(124,58,237,0.28)' : 'none',
                      color: i < 3 ? 'white' : '#a78bfa',
                    }}
                  >
                    {n}
                  </div>
                  <div className="pt-1.5">
                    <h4 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h4>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ────────────────────────────────────────────────── */}
      <section className="py-16 px-4 mb-8">
        <div className="max-w-3xl mx-auto">
          <div
            className="rounded-3xl p-10 md:p-14 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.14) 0%, rgba(99,102,241,0.07) 100%)',
              border: '1px solid rgba(124,58,237,0.24)',
            }}
          >
            <div className="orb orb-violet absolute w-80 h-80 -top-20 left-1/2 -translate-x-1/2 opacity-40 pointer-events-none" />
            <h2 className="headline mb-4 relative z-10" style={{ color: 'var(--text-primary)' }}>Ready to work smarter?</h2>
            <p className="text-base mb-8 relative z-10" style={{ color: 'var(--text-secondary)' }}>
              Join Arbiq and let AI handle the trust layer.
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
