'use client';

import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Shield, Zap, Brain, ArrowRight, CheckCircle } from 'lucide-react';
import { useGetAllJobs } from '@/hooks/useArbiqContract';
import { useCountUp } from '@/hooks/useCountUp';

const features = [
  {
    icon: Shield,
    title: 'Escrow Protection',
    body: 'Client funds are cryptographically locked on job creation. Neither party touches them until the AI renders its verdict.',
    accent: '#7c3aed',
    glow: 'rgba(124,58,237,0.15)',
  },
  {
    icon: Brain,
    title: 'AI Evaluation',
    body: "GenLayer's consensus AI reads the original spec and the freelancer's evidence, then makes an impartial decision.",
    accent: '#38bdf8',
    glow: 'rgba(56,189,248,0.12)',
  },
  {
    icon: Zap,
    title: 'Instant Payout',
    body: "On approval, GEN transfers automatically to the freelancer's wallet with no human delay or intermediary.",
    accent: '#22c55e',
    glow: 'rgba(34,197,94,0.12)',
  },
];

const steps = [
  {
    n: '01',
    title: 'Post a Job',
    desc: 'Describe what you need in plain language. Set a GEN budget — it locks in escrow immediately.',
  },
  {
    n: '02',
    title: 'Freelancer Accepts',
    desc: 'Any connected wallet can browse open jobs and claim one with a single click.',
  },
  {
    n: '03',
    title: 'Work & Deliver',
    desc: 'Freelancer submits a GitHub link, live URL, or any evidence proving the work is done.',
  },
  {
    n: '04',
    title: 'AI Judges',
    desc: "GenLayer's validator network reads the spec + evidence and reaches on-chain consensus.",
  },
  {
    n: '05',
    title: 'Funds Released',
    desc: 'Approved? GEN flows instantly. Disputed? Funds are held for appeal.',
  },
];

function LiveStats() {
  const { data: jobs = [] } = useGetAllJobs();
  const total     = useCountUp(jobs.length, 800);
  const open      = useCountUp(jobs.filter((j) => j.status === 'open').length, 900);
  const completed = useCountUp(jobs.filter((j) => j.status === 'completed').length, 1000);

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-8 mt-14 relative z-10 anim-fade-in"
      style={{ animationDelay: '350ms' }}
    >
      {[
        { value: total,     label: 'Jobs on-chain',  color: '#a78bfa' },
        { value: open,      label: 'Open now',        color: '#38bdf8' },
        { value: completed, label: 'Completed',       color: '#22c55e' },
      ].map(({ value, label, color }) => (
        <div key={label} className="text-center">
          <div className="text-3xl font-black tracking-tight tabular-nums" style={{ color }}>
            {value}
          </div>
          <div className="text-xs font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div
      className="min-h-screen flex flex-col overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      <Navbar />

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center pt-36 pb-28 px-4 text-center overflow-hidden">
        {/* Background orbs */}
        <div className="orb orb-violet absolute w-[700px] h-[700px] -top-40 left-1/2 -translate-x-1/2 opacity-40" />
        <div className="orb orb-indigo absolute w-[400px] h-[400px] top-60 -left-40 opacity-30" />
        <div className="orb orb-pink absolute w-[350px] h-[350px] top-80 -right-32 opacity-25" />

        {/* Grain overlay */}
        <div className="absolute inset-0 hero-grain pointer-events-none" />

        {/* Eyebrow */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8 anim-fade-in relative z-10"
          style={{
            background: 'rgba(124,58,237,0.12)',
            border: '1px solid rgba(124,58,237,0.3)',
            color: '#c4b5fd',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full bg-violet-400"
            style={{ boxShadow: '0 0 8px #a78bfa' }}
          />
          Powered by GenLayer AI Consensus
        </div>

        {/* Headline */}
        <h1
          className="display grad-text-hero max-w-4xl mx-auto mb-6 relative z-10 anim-fade-up"
          style={{ animationDelay: '60ms' }}
        >
          Freelance Contracts.
          <br />
          Enforced by AI.
        </h1>

        <p
          className="text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed relative z-10 anim-fade-up"
          style={{ color: 'var(--text-secondary)', animationDelay: '120ms' }}
        >
          Post jobs, earn crypto, and let an AI validator judge every delivery. No middlemen. No
          unresolved disputes.
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col sm:flex-row items-center gap-3 relative z-10 anim-fade-up"
          style={{ animationDelay: '180ms' }}
        >
          <Link
            href="/jobs/new"
            className="btn-primary flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-bold text-base"
          >
            Post a Job
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/jobs"
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-base transition-all duration-200"
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
          className="flex flex-wrap items-center justify-center gap-4 mt-10 text-xs relative z-10 anim-fade-in"
          style={{ color: 'var(--text-muted)', animationDelay: '280ms' }}
        >
          {['Trustless escrow', 'AI-enforced verdicts', 'On-chain transparency'].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-violet-500" />
              {t}
            </span>
          ))}
        </div>

        {/* Live chain stats */}
        <LiveStats />
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="label mb-3" style={{ color: '#7c3aed' }}>
              How it protects you
            </p>
            <h2 className="headline" style={{ color: 'var(--text-primary)' }}>Built on trustless infrastructure</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger">
            {features.map(({ icon: Icon, title, body, accent, glow }) => (
              <div
                key={title}
                className="card-lift anim-fade-up rounded-2xl p-6 relative overflow-hidden group"
                style={{
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-2xl"
                  style={{
                    background: `radial-gradient(ellipse at top left, ${glow} 0%, transparent 65%)`,
                  }}
                />

                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 relative z-10"
                  style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
                >
                  <Icon className="w-5 h-5" style={{ color: accent }} strokeWidth={1.8} />
                </div>

                <h3 className="font-bold mb-2 text-base relative z-10" style={{ color: 'var(--text-primary)' }}>{title}</h3>
                <p className="text-sm leading-relaxed relative z-10" style={{ color: 'var(--text-muted)' }}>
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-14">
            <p className="label mb-3" style={{ color: '#7c3aed' }}>
              The flow
            </p>
            <h2 className="headline" style={{ color: 'var(--text-primary)' }}>Five steps, fully on-chain</h2>
          </div>

          <div className="relative">
            {/* Vertical timeline line */}
            <div
              className="absolute left-[19px] top-10 bottom-10 w-px"
              style={{ background: 'linear-gradient(to bottom, rgba(124,58,237,0.5), transparent)' }}
            />

            <div className="space-y-8 stagger">
              {steps.map(({ n, title, desc }, i) => (
                <div
                  key={n}
                  className="flex gap-6 anim-fade-up relative"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold relative z-10"
                    style={{
                      background:
                        i < 3 ? 'linear-gradient(135deg,#7c3aed,#a78bfa)' : 'rgba(124,58,237,0.15)',
                      border: i >= 3 ? '1px solid rgba(124,58,237,0.3)' : 'none',
                      color: i < 3 ? 'white' : '#a78bfa',
                    }}
                  >
                    {n}
                  </div>
                  <div className="pt-1.5">
                    <h4 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h4>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────────── */}
      <section className="py-16 px-4 mb-8">
        <div className="max-w-3xl mx-auto">
          <div
            className="rounded-3xl p-10 text-center relative overflow-hidden"
            style={{
              background:
                'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(99,102,241,0.08) 100%)',
              border: '1px solid rgba(124,58,237,0.25)',
            }}
          >
            <div className="orb orb-violet absolute w-80 h-80 -top-20 left-1/2 -translate-x-1/2 opacity-40" />
            <h2 className="headline mb-4 relative z-10" style={{ color: 'var(--text-primary)' }}>Ready to work smarter?</h2>
            <p className="text-base mb-8 relative z-10" style={{ color: 'var(--text-secondary)' }}>
              Join Arbiq and let AI handle the trust layer.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
              <Link
                href="/jobs/new"
                className="btn-primary flex items-center gap-2 px-7 py-3 rounded-xl text-white font-bold"
              >
                Post Your First Job <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/jobs"
                className="px-7 py-3 rounded-xl font-semibold transition-colors"
                style={{ color: '#a78bfa' }}
              >
                Browse Open Jobs →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-8 text-center text-xs"
        style={{ borderTop: '1px solid var(--border-divider)', color: 'var(--text-muted)' }}
      >
        © 2026 Arbiq — Built on{' '}
        <a
          href="https://genlayer.com"
          target="_blank"
          className="hover:text-violet-400 transition-colors"
          style={{ color: '#7c3aed' }}
        >
          GenLayer
        </a>
      </footer>
    </div>
  );
}
