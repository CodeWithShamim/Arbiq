'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Shield, Zap, Brain, ArrowRight, CheckCircle, Lock, Scale, Coins, ChevronDown, X } from 'lucide-react';
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

const comparisonRows = [
  {
    feature: 'Payment protection',
    traditional: 'Manual dispute + customer support',
    arbiq: 'AI consensus, enforced on-chain',
  },
  {
    feature: 'Platform fee',
    traditional: '5–20%',
    arbiq: '0%',
  },
  {
    feature: 'Dispute resolution',
    traditional: 'Days to weeks, outcome uncertain',
    arbiq: 'Minutes, deterministic AI verdict',
  },
  {
    feature: 'Trust required',
    traditional: 'High (platform goodwill)',
    arbiq: 'None — contract enforces both sides',
  },
  {
    feature: 'Work evidence',
    traditional: 'Screenshots, emails',
    arbiq: 'On-chain immutable record',
  },
  {
    feature: 'Payout speed',
    traditional: '7–14 days',
    arbiq: 'Instant on approval',
  },
];

const faqs = [
  {
    q: 'What if the AI makes the wrong call?',
    a: 'The AI uses strict consensus: all 7 validators must independently agree. If they don\'t, the transaction doesn\'t finalize. Additionally, the evidence URL and job description are both evaluated — write detailed specs to reduce misjudgment risk.',
  },
  {
    q: 'Can the client take the money back?',
    a: 'No. Once a job is posted, the GEN is locked in the smart contract. The client cannot withdraw it outside the defined state machine (AI approval or manual release after delivery).',
  },
  {
    q: 'Is this real money?',
    a: 'Arbiq runs on GenLayer Bradbury Testnet. GEN tokens have no real monetary value. This is an experimental dApp for testing AI-enforced freelance contracts.',
  },
  {
    q: 'What kinds of work can I post?',
    a: 'Anything with a verifiable digital deliverable: web dev, smart contracts, design, writing, video, APIs. Work that can\'t be submitted as a URL or document isn\'t a good fit.',
  },
  {
    q: 'How long does AI evaluation take?',
    a: 'Typically 1–5 minutes. Each validator independently calls an LLM and they must all agree before the transaction finalizes.',
  },
];

/* ── 3D floating scene ─────────────────────────────────────────────────────── */
function Hero3DScene() {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;
    const onMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;
      el.style.transform = `perspective(1200px) rotateX(${-dy * 14}deg) rotateY(${dx * 18}deg) translateZ(20px)`;
    };
    const onLeave = () => {
      el.style.transform = '';
    };
    window.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div style={{ width: 420, height: 520, position: 'relative' }}>

      {/* Spinning hex rings */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: 460, height: 460,
        marginLeft: -230, marginTop: -230,
        border: '1px solid rgba(124,58,237,0.12)',
        borderRadius: '50%',
        animation: 'borderRing 20s linear infinite',
      }} />
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: 380, height: 380,
        marginLeft: -190, marginTop: -190,
        border: '1px dashed rgba(167,139,250,0.10)',
        borderRadius: '50%',
        animation: 'borderRing 14s linear infinite reverse',
      }} />

      {/* Rotating outer hex ring */}
      <svg
        style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 500, height: 500,
          marginLeft: -250, marginTop: -250,
          animation: 'hexSpin 30s linear infinite',
          opacity: 0.18,
        }}
        viewBox="0 0 500 500"
      >
        {[0,60,120,180,240,300].map((deg, i) => {
          const r = 230;
          const x = 250 + r * Math.cos((deg * Math.PI) / 180);
          const y = 250 + r * Math.sin((deg * Math.PI) / 180);
          return <circle key={i} cx={x} cy={y} r={4} fill="#a78bfa" />;
        })}
        <polygon points="250,20 476,135 476,365 250,480 24,365 24,135" fill="none" stroke="rgba(124,58,237,0.4)" strokeWidth="1" />
      </svg>

      {/* Inner counter-rotating ring */}
      <svg
        style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 320, height: 320,
          marginLeft: -160, marginTop: -160,
          animation: 'hexSpinRev 18s linear infinite',
          opacity: 0.25,
        }}
        viewBox="0 0 320 320"
      >
        <polygon points="160,10 302,85 302,235 160,310 18,235 18,85" fill="none" stroke="rgba(167,139,250,0.5)" strokeWidth="1" strokeDasharray="6 4" />
        {[0,60,120,180,240,300].map((deg, i) => {
          const r = 148;
          const x = 160 + r * Math.cos(((deg + 30) * Math.PI) / 180);
          const y = 160 + r * Math.sin(((deg + 30) * Math.PI) / 180);
          return <circle key={i} cx={x} cy={y} r={2.5} fill="#c4b5fd" />;
        })}
      </svg>

      {/* Main 3D card */}
      <div
        ref={cardRef}
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: 300, height: 360,
          marginLeft: -150, marginTop: -180,
          borderRadius: 24,
          background: 'linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(124,58,237,0.06) 50%, rgba(99,102,241,0.04) 100%)',
          border: '1px solid rgba(167,139,250,0.20)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 60px rgba(124,58,237,0.15), inset 0 1px 0 rgba(255,255,255,0.10)',
          backdropFilter: 'blur(20px)',
          transition: 'transform 0.12s ease-out',
          animation: 'heroCardFloat 10s ease-in-out infinite',
          overflow: 'hidden',
        }}
      >
        {/* Scan line */}
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.6), transparent)',
          animation: 'scanLine 5s ease-in-out infinite',
          zIndex: 3,
        }} />

        {/* Card header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(124,58,237,0.4)',
            }}>
              <Lock size={14} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', letterSpacing: '0.08em' }}>SMART CONTRACT</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.05em' }}>arbiq.genlayer.eth</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', background: '#22c55e',
                boxShadow: '0 0 8px #22c55e',
                animation: 'glowPulse3D 2s ease-in-out infinite',
              }} />
            </div>
          </div>

          {/* Escrow amount */}
          <div style={{
            background: 'rgba(124,58,237,0.10)',
            border: '1px solid rgba(124,58,237,0.18)',
            borderRadius: 12, padding: '10px 14px',
          }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.10em', marginBottom: 3 }}>ESCROWED</div>
            <div style={{ fontSize: 22, fontFamily: '"Bebas Neue",sans-serif', color: '#c4b5fd', letterSpacing: '0.06em', lineHeight: 1 }}>2.5 GEN</div>
            <div style={{ fontSize: 9, color: '#22c55e', fontWeight: 700, letterSpacing: '0.06em', marginTop: 2 }}>● LOCKED UNTIL CONSENSUS</div>
          </div>
        </div>

        {/* Validators section */}
        <div style={{ padding: '14px 20px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.10em', marginBottom: 10 }}>AI VALIDATORS</div>
          {[
            { label: 'PROPOSING', color: '#22c55e', done: true },
            { label: 'COMMITTING', color: '#22c55e', done: true },
            { label: 'REVEALING', color: '#a78bfa', active: true },
            { label: 'ACCEPTED', color: 'rgba(255,255,255,0.2)', done: false },
          ].map(({ label, color, done, active }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
              <div style={{
                width: 14, height: 14, borderRadius: '50%',
                border: `1.5px solid ${color}`,
                background: done ? `${color}22` : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {done && <div style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />}
                {active && <div style={{ width: 5, height: 5, borderRadius: '50%', background: color, animation: 'dotPulse 1s ease-in-out infinite' }} />}
              </div>
              <div style={{ flex: 1, height: 1, background: done ? `${color}40` : 'rgba(255,255,255,0.05)', borderRadius: 1 }} />
              <div style={{ fontSize: 8, fontFamily: '"JetBrains Mono",monospace', color, fontWeight: 700, letterSpacing: '0.06em', opacity: done || active ? 1 : 0.35 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Bottom verdict */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '12px 20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(34,197,94,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#86efac', letterSpacing: '0.08em' }}>✦ AI VERDICT: APPROVED</div>
          <div style={{ fontSize: 9, fontFamily: '"JetBrains Mono",monospace', color: 'rgba(255,255,255,0.3)' }}>7/7</div>
        </div>
      </div>

      {/* Secondary floating card */}
      <div style={{
        position: 'absolute',
        top: '15%', right: -20,
        width: 160, height: 90,
        borderRadius: 16,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(99,102,241,0.06) 100%)',
        border: '1px solid rgba(99,102,241,0.25)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        padding: '12px 14px',
        animation: 'heroCardFloatB 8s ease-in-out infinite',
        animationDelay: '2s',
      }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: '#38bdf8', letterSpacing: '0.10em', marginBottom: 6 }}>PAYOUT</div>
        <div style={{ fontSize: 18, fontFamily: '"Bebas Neue",sans-serif', color: '#f0f0ff', letterSpacing: '0.06em', lineHeight: 1 }}>INSTANT</div>
        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>On consensus · 0% fee</div>
      </div>

      {/* Tertiary floating chip */}
      <div style={{
        position: 'absolute',
        bottom: '20%', left: -10,
        width: 140, height: 68,
        borderRadius: 14,
        background: 'rgba(236,72,153,0.06)',
        border: '1px solid rgba(236,72,153,0.22)',
        backdropFilter: 'blur(10px)',
        padding: '10px 14px',
        animation: 'heroCardFloat 12s ease-in-out infinite',
        animationDelay: '5s',
        boxShadow: '0 16px 32px rgba(0,0,0,0.3)',
      }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: '#f9a8d4', letterSpacing: '0.10em', marginBottom: 4 }}>PLATFORM FEE</div>
        <div style={{ fontSize: 24, fontFamily: '"Bebas Neue",sans-serif', color: '#f0f0ff', letterSpacing: '0.06em', lineHeight: 1 }}>0%</div>
      </div>

    </div>
  );
}

/* ── Particle field ─────────────────────────────────────────────────────────── */
function HeroParticles() {
  const particles = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1.5 + Math.random() * 2.5,
    delay: Math.random() * 6,
    duration: 5 + Math.random() * 8,
    dx: (Math.random() - 0.5) * 120,
    dy: -60 - Math.random() * 100,
    color: i % 3 === 0 ? '#a78bfa' : i % 3 === 1 ? '#38bdf8' : '#c4b5fd',
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            animation: `particleDrift ${p.duration}s ease-in infinite`,
            animationDelay: `${p.delay}s`,
            '--dx': `${p.dx}px`,
            '--dy': `${p.dy}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

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

function FAQItem({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: 'var(--glass-bg)',
        border: isOpen ? '1px solid rgba(124,58,237,0.40)' : '1px solid var(--border-subtle)',
        boxShadow: isOpen ? '0 0 0 1px rgba(124,58,237,0.12)' : 'none',
      }}
    >
      <button
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
        onClick={onToggle}
      >
        <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{q}</span>
        <ChevronDown
          className="w-4 h-4 shrink-0 transition-transform duration-300"
          style={{ color: '#a78bfa', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>
      {isOpen && (
        <div className="px-6 pb-5">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{a}</p>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const featuresRef = useScrollReveal<HTMLDivElement>(70);
  const stepsRef    = useScrollReveal<HTMLDivElement>(80);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Navbar />

      {/* ─── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        {/* Background layers */}
        <div className="dot-grid" />
        <div className="absolute inset-0 hero-grain pointer-events-none" />

        {/* Deep glow cores */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 10%, rgba(124,58,237,0.18) 0%, transparent 70%)',
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 40% 60% at 80% 60%, rgba(99,102,241,0.10) 0%, transparent 70%)',
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 35% 50% at 10% 70%, rgba(236,72,153,0.07) 0%, transparent 70%)',
        }} />

        {/* Polymorphic blob — top left */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: 480, height: 480,
            top: -80, left: -120,
            background: 'radial-gradient(circle at 40% 40%, rgba(124,58,237,0.22) 0%, rgba(99,102,241,0.12) 40%, transparent 70%)',
            filter: 'blur(40px)',
            animation: 'polyMorph 14s ease-in-out infinite',
          }}
        />
        {/* Polymorphic blob — bottom right */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: 360, height: 360,
            bottom: -60, right: -60,
            background: 'radial-gradient(circle at 60% 60%, rgba(236,72,153,0.14) 0%, rgba(124,58,237,0.08) 50%, transparent 70%)',
            filter: 'blur(50px)',
            animation: 'polyMorph 18s ease-in-out infinite reverse',
            animationDelay: '3s',
          }}
        />

        {/* Floating 3D cards — right side (desktop) */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none hidden lg:block" style={{ zIndex: 2 }}>
          <Hero3DScene />
        </div>

        {/* Particle field */}
        <HeroParticles />

        {/* ── Left content ── */}
        <div className="relative z-10 w-full px-6 md:px-16 pt-32 pb-24 lg:max-w-[58%]">

          {/* Badge */}
          <div
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-bold mb-10 anim-fade-in"
            style={{
              background: 'rgba(124,58,237,0.08)',
              border: '1px solid rgba(124,58,237,0.24)',
              color: '#c4b5fd',
              letterSpacing: '0.10em',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#a78bfa', boxShadow: '0 0 8px #a78bfa', animation: 'brandPulse 2s ease-in-out infinite' }} />
            POWERED BY GENLAYER AI CONSENSUS
          </div>

          {/* Headline */}
          <h1
            className="display grad-text-hero anim-fade-up"
            style={{
              animationDelay: '60ms',
              fontSize: 'clamp(3.8rem, 9vw, 8.5rem)',
              lineHeight: 0.9,
              letterSpacing: '0.02em',
              animation: 'fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both 60ms, heroTextGlow 4s ease-in-out infinite 1s',
            }}
          >
            GET PAID.<br />
            <span style={{ opacity: 0.85 }}>OR GET</span><br />
            PROOF.
          </h1>

          {/* Animated underline */}
          <div className="mt-4 mb-8 anim-fade-in" style={{ animationDelay: '200ms' }}>
            <div style={{
              height: 2,
              width: 120,
              background: 'linear-gradient(90deg, #7c3aed, #a78bfa, transparent)',
              borderRadius: 2,
              animation: 'gradientShift 3s ease infinite',
              backgroundSize: '200% 100%',
            }} />
          </div>

          <p
            className="text-lg max-w-md leading-relaxed anim-fade-up"
            style={{ color: 'var(--text-secondary)', animationDelay: '160ms', fontWeight: 500, fontSize: '1.0625rem' }}
          >
            Arbiq locks client funds on-chain and uses AI to judge every delivery.
            If the work ships, you get paid. No negotiation, no waiting, no disputes left open.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-start gap-3 mt-10 anim-fade-up" style={{ animationDelay: '220ms' }}>
            <Link
              href="/jobs/new"
              className="btn-primary relative overflow-hidden flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-bold text-base"
            >
              <span
                className="absolute top-0 bottom-0 w-12"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
                  animation: 'ctaShimmer 2.8s ease-in-out infinite',
                  left: '-60%',
                }}
              />
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

          {/* Trust chips */}
          <div
            className="flex flex-wrap items-center gap-4 mt-10 text-xs anim-fade-in"
            style={{ color: 'var(--text-muted)', animationDelay: '320ms', fontWeight: 600, letterSpacing: '0.05em' }}
          >
            {['Funds locked in escrow', 'AI-enforced verdicts', 'Fully on-chain'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" style={{ color: '#7c3aed' }} />
                {t.toUpperCase()}
              </span>
            ))}
          </div>

          <LiveStats />
        </div>
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
              className="inline-flex items-center gap-3 px-6 text-xs font-bold shrink-0"
              style={{ color: i % 4 === 0 ? '#a78bfa' : i % 4 === 1 ? '#38bdf8' : i % 4 === 2 ? '#22c55e' : 'var(--text-muted)', letterSpacing: '0.10em' }}
            >
              {tag}
              <span className="opacity-30" style={{ fontSize: '7px' }}>◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ─── COMPARISON TABLE ──────────────────────────────────────────── */}
      <section className="py-28 px-4 relative">
        <div className="orb orb-indigo absolute w-112.5 h-112.5 top-10 right-0 opacity-[0.06] pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <p className="label mb-3" style={{ color: '#7c3aed' }}>Honest comparison</p>
            <h2 className="headline" style={{ color: 'var(--text-primary)' }}>Why not Upwork, Fiverr, or Escrow.com?</h2>
            <p className="text-base mt-4 max-w-md mx-auto" style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
              Every traditional platform relies on human support staff and goodwill. Arbiq relies on code.
            </p>
          </div>

          <div
            className="rounded-3xl overflow-hidden"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}
          >
            {/* Table header */}
            <div
              className="grid grid-cols-3 px-6 py-4"
              style={{ background: 'rgba(124,58,237,0.06)', borderBottom: '1px solid var(--border-subtle)' }}
            >
              <div className="text-xs font-bold tracking-widest" style={{ color: 'var(--text-muted)', letterSpacing: '0.10em' }}>FEATURE</div>
              <div className="text-xs font-bold tracking-widest text-center" style={{ color: '#ef4444', letterSpacing: '0.10em' }}>TRADITIONAL PLATFORMS</div>
              <div
                className="text-xs font-bold tracking-widest text-center"
                style={{ color: '#a78bfa', letterSpacing: '0.10em' }}
              >
                ARBIQ
              </div>
            </div>

            {/* Table rows */}
            {comparisonRows.map(({ feature, traditional, arbiq }, i) => (
              <div
                key={feature}
                className="grid grid-cols-3 items-center px-6 py-5 transition-colors duration-150"
                style={{
                  borderBottom: i < comparisonRows.length - 1 ? '1px solid var(--border-divider)' : 'none',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.04)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'; }}
              >
                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{feature}</div>
                <div className="flex items-center justify-center gap-2">
                  <X className="w-3.5 h-3.5 shrink-0" style={{ color: '#ef4444' }} />
                  <span className="text-sm text-center" style={{ color: '#9ca3af' }}>{traditional}</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: '#22c55e' }} />
                  <span className="text-sm font-medium text-center" style={{ color: '#c4b5fd' }}>{arbiq}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ──────────────────────────────────────────────────── */}
      <section className="py-32 px-4 relative">
        <div className="orb orb-violet absolute w-125 h-125 top-10 left-1/2 -translate-x-1/2 opacity-[0.07] pointer-events-none" />
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
      <section id="how-it-works" className="py-28 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-16">
            <p className="label mb-3" style={{ color: '#7c3aed' }}>The flow</p>
            <h2 className="headline" style={{ color: 'var(--text-primary)' }}>Five steps, fully on-chain</h2>
          </div>

          <div ref={stepsRef} className="relative">
            <div
              className="absolute left-4.75 top-10 bottom-10 w-px"
              style={{ background: 'linear-gradient(to bottom, rgba(124,58,237,0.50), transparent)' }}
            />
            <div className="space-y-8">
              {steps.map(({ n, title, desc }, i) => (
                <div key={n} className="reveal flex gap-6 relative">
                  <div
                    className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-xs font-bold relative z-10 font-mono"
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

      {/* ─── FAQ ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 relative">
        <div className="orb orb-violet absolute w-100 h-100 bottom-0 left-1/2 -translate-x-1/2 opacity-[0.06] pointer-events-none" />
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <p className="label mb-3" style={{ color: '#7c3aed' }}>FAQ</p>
            <h2 className="headline" style={{ color: 'var(--text-primary)' }}>Common questions</h2>
          </div>

          <div className="space-y-3">
            {faqs.map(({ q, a }, i) => (
              <FAQItem
                key={q}
                q={q}
                a={a}
                isOpen={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
              />
            ))}
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
