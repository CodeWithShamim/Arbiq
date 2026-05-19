"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  BookOpen,
  Zap,
  Brain,
  Code2,
  Layers,
  Bell,
  MessageSquare,
  Shield,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  ArrowRight,
  Wallet,
  GitBranch,
  Lock,
  Coins,
  AlertCircle,
  CheckCircle2,
  Clock,
  Package,
} from "lucide-react";

/* ─── Section registry ────────────────────────────────────────────────────── */

const SECTIONS = [
  { id: "overview",       label: "Overview",             icon: BookOpen   },
  { id: "quickstart",     label: "Quick Start",          icon: Zap        },
  { id: "architecture",   label: "Architecture",         icon: Layers     },
  { id: "contract",       label: "Smart Contract",       icon: Code2      },
  { id: "job-lifecycle",  label: "Job Lifecycle",        icon: GitBranch  },
  { id: "ai-evaluation",  label: "AI Evaluation",        icon: Brain      },
  { id: "wallet",         label: "Wallet & Network",     icon: Wallet     },
  { id: "notifications",  label: "Notifications",        icon: Bell       },
  { id: "chat",           label: "On-Chain Chat",        icon: MessageSquare },
  { id: "hooks",          label: "Hooks Reference",      icon: Package    },
  { id: "security",       label: "Security Model",       icon: Shield     },
];

/* ─── Code block ──────────────────────────────────────────────────────────── */

function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div
      className="relative rounded-2xl overflow-hidden my-4"
      style={{ background: "rgba(0,0,0,0.45)", border: "1px solid var(--border-mid)" }}
    >
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ borderBottom: "1px solid var(--border-divider)", background: "rgba(255,255,255,0.02)" }}
      >
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: "var(--text-muted)", fontFamily: '"JetBrains Mono", monospace' }}
        >
          {lang}
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1 text-[11px] font-semibold transition-all px-2 py-0.5 rounded-md"
          style={{
            color: copied ? "#86efac" : "var(--text-muted)",
            background: copied ? "rgba(34,197,94,0.10)" : "transparent",
          }}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre
        className="overflow-x-auto p-5 text-sm leading-relaxed"
        style={{ fontFamily: '"JetBrains Mono", monospace', color: "#c4b5fd", margin: 0 }}
      >
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
}

/* ─── Callout ─────────────────────────────────────────────────────────────── */

function Callout({
  icon: Icon,
  color,
  bg,
  border,
  children,
}: {
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex gap-3 rounded-xl p-4 my-4 text-sm leading-relaxed"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color }} />
      <div style={{ color: "var(--text-secondary)" }}>{children}</div>
    </div>
  );
}

/* ─── Section heading ─────────────────────────────────────────────────────── */

function SectionHead({
  id,
  icon: Icon,
  accent,
  label,
  title,
  sub,
}: {
  id: string;
  icon: React.ElementType;
  accent: string;
  label: string;
  title: string;
  sub: string;
}) {
  return (
    <div id={id} className="pt-16 pb-2 scroll-mt-20">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
        </div>
        <span
          className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: accent, letterSpacing: "0.1em" }}
        >
          {label}
        </span>
      </div>
      <h2
        className="font-display text-3xl md:text-4xl mb-2"
        style={{ color: "var(--text-primary)", letterSpacing: "0.04em" }}
      >
        {title}
      </h2>
      <p className="text-base mb-6" style={{ color: "var(--text-muted)" }}>
        {sub}
      </p>
      <div className="h-px mb-8" style={{ background: "var(--border-divider)" }} />
    </div>
  );
}

/* ─── Method row ──────────────────────────────────────────────────────────── */

function MethodRow({
  method,
  type,
  typeColor,
  desc,
  params,
}: {
  method: string;
  type: string;
  typeColor: string;
  desc: string;
  params?: string;
}) {
  return (
    <div
      className="rounded-xl p-4 mb-3"
      style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
        <code
          className="text-sm font-bold"
          style={{ fontFamily: '"JetBrains Mono", monospace', color: "#a78bfa" }}
        >
          {method}
        </code>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${typeColor}18`, border: `1px solid ${typeColor}30`, color: typeColor }}
        >
          {type}
        </span>
      </div>
      {params && (
        <p
          className="text-xs mb-1.5"
          style={{ fontFamily: '"JetBrains Mono", monospace', color: "var(--text-muted)" }}
        >
          {params}
        </p>
      )}
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {desc}
      </p>
    </div>
  );
}

/* ─── Hook row ────────────────────────────────────────────────────────────── */

function HookRow({
  name,
  sig,
  returns,
  desc,
}: {
  name: string;
  sig: string;
  returns: string;
  desc: string;
}) {
  return (
    <div
      className="rounded-xl p-4 mb-3"
      style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}
    >
      <code
        className="block text-sm font-bold mb-1"
        style={{ fontFamily: '"JetBrains Mono", monospace', color: "#38bdf8" }}
      >
        {name}({sig})
      </code>
      <code
        className="block text-xs mb-2"
        style={{ fontFamily: '"JetBrains Mono", monospace', color: "var(--text-muted)" }}
      >
        → {returns}
      </code>
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {desc}
      </p>
    </div>
  );
}

/* ─── Status pill ─────────────────────────────────────────────────────────── */

const STATUS_COLORS: Record<string, { fg: string; bg: string }> = {
  open:      { fg: "#38bdf8", bg: "rgba(56,189,248,0.12)"  },
  active:    { fg: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
  delivered: { fg: "#fb923c", bg: "rgba(251,146,60,0.12)"  },
  completed: { fg: "#22c55e", bg: "rgba(34,197,94,0.12)"   },
  disputed:  { fg: "#ef4444", bg: "rgba(239,68,68,0.12)"   },
};

function StatusPill({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? { fg: "#a78bfa", bg: "rgba(124,58,237,0.12)" };
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold"
      style={{ color: c.fg, background: c.bg, border: `1px solid ${c.fg}30` }}
    >
      {status.toUpperCase()}
    </span>
  );
}

/* ─── Sidebar ─────────────────────────────────────────────────────────────── */

function Sidebar({ active }: { active: string }) {
  return (
    <nav className="sticky top-20 space-y-0.5">
      <p
        className="text-[10px] font-bold uppercase tracking-widest mb-3 px-3"
        style={{ color: "var(--text-muted)", letterSpacing: "0.12em" }}
      >
        Contents
      </p>
      {SECTIONS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <a
            key={id}
            href={`#${id}`}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-150"
            style={{
              color: isActive ? "#a78bfa" : "var(--text-muted)",
              background: isActive ? "rgba(124,58,237,0.10)" : "transparent",
              borderLeft: isActive ? "2px solid #7c3aed" : "2px solid transparent",
            }}
          >
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            {label}
          </a>
        );
      })}
    </nav>
  );
}

/* ─── Main page ───────────────────────────────────────────────────────────── */

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("overview");
  const contentRef = useRef<HTMLDivElement>(null);

  // Track which section is in view for sidebar highlight
  useEffect(() => {
    const ids = SECTIONS.map((s) => s.id);
    const observers: IntersectionObserver[] = [];

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <Navbar />

      {/* Page header */}
      <div
        className="pt-24 pb-10 px-4 md:px-8 relative overflow-hidden"
        style={{ borderBottom: "1px solid var(--border-page)" }}
      >
        <div className="dot-grid absolute inset-0 pointer-events-none" />
        <div className="orb orb-violet absolute w-[500px] h-[500px] -top-40 right-0 opacity-20 pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(124,58,237,0.14)", border: "1px solid rgba(124,58,237,0.28)" }}
            >
              <BookOpen className="w-4 h-4" style={{ color: "#a78bfa" }} />
            </div>
            <span
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: "#7c3aed", letterSpacing: "0.12em" }}
            >
              Documentation
            </span>
          </div>

          <h1
            className="font-display text-5xl md:text-6xl mb-3"
            style={{ color: "var(--text-primary)", letterSpacing: "0.04em" }}
          >
            ARBIQ DOCS
          </h1>
          <p className="text-lg max-w-xl" style={{ color: "var(--text-muted)", fontWeight: 500 }}>
            Everything you need to understand, use, and build on Arbiq — the AI-enforced freelance marketplace on GenLayer.
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            {[
              { label: "GenLayer Docs",    href: "https://docs.genlayer.com",              color: "#7c3aed" },
              { label: "Explorer",         href: "https://explorer-bradbury.genlayer.com", color: "#38bdf8" },
              { label: "GitHub",           href: "https://github.com/CodeWithShamim/Arbiq",color: "#a78bfa" },
            ].map(({ label, href, color }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-lg transition-all"
                style={{
                  color,
                  background: `${color}12`,
                  border: `1px solid ${color}28`,
                }}
              >
                {label}
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Body: sidebar + content */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 flex gap-10">

        {/* Sidebar */}
        <aside className="hidden lg:block w-52 flex-shrink-0">
          <Sidebar active={activeSection} />
        </aside>

        {/* Content */}
        <main ref={contentRef} className="flex-1 min-w-0">

          {/* ── OVERVIEW ──────────────────────────────────────────────────── */}
          <SectionHead
            id="overview"
            icon={BookOpen}
            accent="#a78bfa"
            label="Introduction"
            title="WHAT IS ARBIQ"
            sub="A decentralized freelance platform where payment disputes are settled by AI consensus — not humans."
          />

          <p className="text-base leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
            Arbiq is built on <strong style={{ color: "var(--text-primary)" }}>GenLayer</strong> — a blockchain that
            supports <em>Intelligent Contracts</em>: Python contracts that can call LLMs and make non-deterministic
            decisions through validator consensus. Arbiq uses this to let an AI judge evaluate freelance deliveries
            and automatically release or withhold escrow.
          </p>

          <p className="text-base leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
            When a client posts a job, their GEN tokens lock in the contract immediately. When the freelancer submits
            work, the client can trigger an AI evaluation — multiple GenLayer validators independently read the job
            spec and evidence, reach consensus, and execute payment atomically. No platform takes a cut. No human
            arbiter decides the outcome.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { icon: Lock,   label: "Trustless Escrow",  desc: "Funds locked at post time. Released only on AI approval or manual client sign-off.", color: "#7c3aed" },
              { icon: Brain,  label: "AI Enforcement",    desc: "GenLayer validator consensus runs LLMs to evaluate evidence. No single point of control.", color: "#38bdf8" },
              { icon: Coins,  label: "Zero Platform Fee", desc: "100% of escrowed GEN goes to the freelancer on approval. No middleman percentage.", color: "#22c55e" },
            ].map(({ icon: Icon, label, desc, color }) => (
              <div
                key={label}
                className="rounded-2xl p-5"
                style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${color}15`, border: `1px solid ${color}25` }}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <p className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>{label}</p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{desc}</p>
              </div>
            ))}
          </div>

          <Callout icon={AlertCircle} color="#f59e0b" bg="rgba(245,158,11,0.07)" border="rgba(245,158,11,0.22)">
            <strong style={{ color: "#fbbf24" }}>Testnet only.</strong> Arbiq runs on GenLayer Bradbury Testnet
            (Chain ID 4221). GEN tokens have no real monetary value. The network is experimental.
          </Callout>

          {/* ── QUICK START ───────────────────────────────────────────────── */}
          <SectionHead
            id="quickstart"
            icon={Zap}
            accent="#22c55e"
            label="Getting Started"
            title="QUICK START"
            sub="From zero to posting your first job in under 5 minutes."
          />

          <div className="space-y-6">
            {[
              {
                n: "01",
                title: "Install a wallet",
                body: "Install MetaMask or any WalletConnect-compatible wallet. Arbiq uses RainbowKit and supports injected wallets, WalletConnect, and Coinbase Wallet.",
                color: "#7c3aed",
              },
              {
                n: "02",
                title: "Add GenLayer Bradbury Testnet",
                body: "Arbiq will prompt you to switch networks automatically when you connect. Accept the network switch.",
                code: `Network name: GenLayer Bradbury Testnet\nChain ID:     4221\nRPC URL:      https://rpc-bradbury.genlayer.com\nSymbol:       GEN\nExplorer:     https://explorer-bradbury.genlayer.com`,
                codeLang: "text",
                color: "#38bdf8",
              },
              {
                n: "03",
                title: "Get testnet GEN tokens",
                body: "Visit the GenLayer Studio faucet to receive testnet GEN. You need GEN to post jobs (budget is held in escrow).",
                color: "#f59e0b",
              },
              {
                n: "04",
                title: "Post a job",
                body: 'Go to /jobs/new, fill in the title, description, deadline, and budget. Click "Post Job" — your wallet will prompt you to sign a transaction. The budget is locked in the contract immediately.',
                color: "#22c55e",
              },
              {
                n: "05",
                title: "Wait for a freelancer",
                body: "Your job appears on /jobs. Any wallet can browse and accept it. You'll receive a notification when someone takes the job.",
                color: "#a78bfa",
              },
            ].map(({ n, title, body, code, codeLang, color }) => (
              <div key={n} className="flex gap-5">
                <div
                  className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold font-mono"
                  style={{ background: `${color}18`, border: `1px solid ${color}30`, color }}
                >
                  {n}
                </div>
                <div className="flex-1 pt-1.5">
                  <p className="font-bold mb-1.5 text-sm" style={{ color: "var(--text-primary)" }}>{title}</p>
                  <p className="text-sm leading-relaxed mb-0" style={{ color: "var(--text-secondary)" }}>{body}</p>
                  {code && <CodeBlock code={code} lang={codeLang} />}
                </div>
              </div>
            ))}
          </div>

          {/* ── ARCHITECTURE ──────────────────────────────────────────────── */}
          <SectionHead
            id="architecture"
            icon={Layers}
            accent="#38bdf8"
            label="System Design"
            title="ARCHITECTURE"
            sub="How the browser, genlayer-js, and the GenLayer validator network fit together."
          />

          <div
            className="rounded-2xl p-6 mb-6 overflow-x-auto"
            style={{ background: "rgba(0,0,0,0.35)", border: "1px solid var(--border-mid)" }}
          >
            <pre
              className="text-xs leading-relaxed"
              style={{ fontFamily: '"JetBrains Mono", monospace', color: "#c4b5fd", margin: 0 }}
            >
{`Browser (Next.js 16 · React 19 · Tailwind CSS v4)
   │
   ├─ wagmi v2 + RainbowKit  ──── wallet signing (MetaMask, WalletConnect…)
   ├─ TanStack Query v5       ──── caches chain reads, auto-refetches
   └─ genlayer-js v1.1.8      ──── encodes calls, polls consensus status
        │
        │  readContract()  → gen_call(type:"read")   ─── view methods
        │  writeContract() → eth_sendTransaction      ─── state mutations
        │  getTransaction()→ poll every 1s            ─── consensus tracking
        │
        ▼
GenLayer Bradbury Testnet  (Chain ID 4221)
   │
   ├─ Consensus Main Contract  ←── all transactions land here first
   │     PROPOSING → COMMITTING → REVEALING → ACCEPTED
   │
   └─ arbiq.py  (Intelligent Contract · Python)
         ├─ job_count : u256
         ├─ jobs      : TreeMap[u256, str]    ← JSON job objects
         └─ messages  : TreeMap[u256, str]    ← JSON message arrays`}
            </pre>
          </div>

          <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
            <strong style={{ color: "var(--text-primary)" }}>Read calls</strong> go directly to an RPC node via{" "}
            <code style={{ fontFamily: '"JetBrains Mono"', color: "#a78bfa" }}>gen_call(type:&quot;read&quot;)</code> — no wallet needed,
            instant response. <strong style={{ color: "var(--text-primary)" }}>Write calls</strong> are msgpack-encoded
            and sent as <code style={{ fontFamily: '"JetBrains Mono"', color: "#a78bfa" }}>eth_sendTransaction</code> to
            the consensus contract. The frontend then polls <code style={{ fontFamily: '"JetBrains Mono"', color: "#a78bfa" }}>getTransaction()</code>{" "}
            every second until the transaction reaches a decided state (ACCEPTED or FINALIZED_ERROR).
          </p>

          <Callout icon={CheckCircle2} color="#22c55e" bg="rgba(34,197,94,0.07)" border="rgba(34,197,94,0.22)">
            <strong style={{ color: "#86efac" }}>Why poll at 1 second?</strong> The built-in{" "}
            <code style={{ fontFamily: '"JetBrains Mono"' }}>waitForTransactionReceipt</code> sleeps 3s between polls
            with no intermediate status. Custom polling surfaces live consensus phases (PROPOSING, COMMITTING,
            REVEALING) and reaches finality ~3× faster.
          </Callout>

          {/* ── CONTRACT ──────────────────────────────────────────────────── */}
          <SectionHead
            id="contract"
            icon={Code2}
            accent="#a78bfa"
            label="Smart Contract"
            title="CONTRACT REFERENCE"
            sub="All methods on arbiq.py — the GenLayer Intelligent Contract."
          />

          <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--text-secondary)" }}>
            The contract is a Python class inheriting from{" "}
            <code style={{ fontFamily: '"JetBrains Mono"', color: "#a78bfa" }}>gl.Contract</code>. State is stored in
            two <code style={{ fontFamily: '"JetBrains Mono"', color: "#a78bfa" }}>TreeMap</code> fields — GenLayer&apos;s
            on-chain key-value store — with values serialized as JSON strings.
          </p>

          <CodeBlock lang="python" code={`
class Arbiq(gl.Contract):
    job_count : u256                   # auto-incrementing ID counter
    jobs      : TreeMap[u256, str]     # job_id → JSON job object
    messages  : TreeMap[u256, str]     # job_id → JSON message array
`} />

          <h3 className="text-sm font-bold uppercase tracking-widest mt-8 mb-4" style={{ color: "var(--text-muted)", letterSpacing: "0.1em" }}>
            Write Methods
          </h3>

          <MethodRow
            method="post_job(title, description, deadline)"
            type="payable write"
            typeColor="#a78bfa"
            params="title: str · description: str · deadline: str · value: GEN (required)"
            desc="Creates a new job. The GEN sent with the transaction is locked in escrow. Title must be ≥ 3 chars, description ≥ 20 chars. Job starts in OPEN status."
          />
          <MethodRow
            method="take_job(job_id)"
            type="write"
            typeColor="#38bdf8"
            params="job_id: int"
            desc="Assigns the caller as the freelancer. Job must be OPEN. The caller cannot be the client. Transitions status to ACTIVE."
          />
          <MethodRow
            method="submit_delivery(job_id, evidence_url, evidence_note)"
            type="write"
            typeColor="#f59e0b"
            params="job_id: int · evidence_url: str (required) · evidence_note: str"
            desc="Freelancer marks the job as delivered with a URL pointing to the work (GitHub, live site, Figma, Loom, etc.). Transitions status to DELIVERED."
          />
          <MethodRow
            method="auto_evaluate(job_id)"
            type="non-deterministic write"
            typeColor="#ec4899"
            params="job_id: int"
            desc="Triggers AI consensus evaluation. Validators independently run an LLM prompt against the job spec + evidence URL. If approved, funds transfer to the freelancer automatically. Status becomes COMPLETED or DISPUTED."
          />
          <MethodRow
            method="release_manually(job_id)"
            type="write"
            typeColor="#22c55e"
            params="job_id: int"
            desc="Client bypasses AI and approves payment directly. Job must be DELIVERED. Only the client can call this. Funds transfer immediately. Status becomes COMPLETED."
          />
          <MethodRow
            method="send_message(job_id, content)"
            type="write"
            typeColor="#fb923c"
            params="job_id: int · content: str (max 500 chars)"
            desc="Appends a message to the job's chat thread. Only the client or assigned freelancer can message. Job must not be OPEN (messaging starts after a freelancer takes the job)."
          />

          <h3 className="text-sm font-bold uppercase tracking-widest mt-8 mb-4" style={{ color: "var(--text-muted)", letterSpacing: "0.1em" }}>
            View Methods
          </h3>

          <MethodRow
            method="get_job(job_id)"
            type="view"
            typeColor="#71717a"
            params="job_id: int → str (JSON)"
            desc="Returns a single job as a JSON string. Returns empty string if the job does not exist."
          />
          <MethodRow
            method="get_all_jobs()"
            type="view"
            typeColor="#71717a"
            params="→ str (JSON array)"
            desc="Returns all jobs ever posted as a JSON array. Used by the browse page."
          />
          <MethodRow
            method="get_jobs_by_client(address)"
            type="view"
            typeColor="#71717a"
            params="client: str → str (JSON array)"
            desc="Returns all jobs posted by the given wallet address. Case-insensitive match."
          />
          <MethodRow
            method="get_jobs_by_freelancer(address)"
            type="view"
            typeColor="#71717a"
            params="freelancer: str → str (JSON array)"
            desc="Returns all jobs taken by the given wallet address. Used by the notification system."
          />
          <MethodRow
            method="get_messages(job_id)"
            type="view"
            typeColor="#71717a"
            params="job_id: int → str (JSON array)"
            desc='Returns the chat message array for a job as a JSON string. Returns "[]" if no messages exist.'
          />
          <MethodRow
            method="get_job_count()"
            type="view"
            typeColor="#71717a"
            params="→ int"
            desc="Returns the total number of jobs ever posted (includes all statuses). Used by the landing page stats."
          />

          {/* ── JOB LIFECYCLE ─────────────────────────────────────────────── */}
          <SectionHead
            id="job-lifecycle"
            icon={GitBranch}
            accent="#f59e0b"
            label="Job States"
            title="JOB LIFECYCLE"
            sub="How a job moves through states from creation to completion."
          />

          <div
            className="rounded-2xl p-6 mb-6 overflow-x-auto"
            style={{ background: "rgba(0,0,0,0.35)", border: "1px solid var(--border-mid)" }}
          >
            <pre
              className="text-xs leading-relaxed"
              style={{ fontFamily: '"JetBrains Mono", monospace', color: "#c4b5fd", margin: 0 }}
            >
{`post_job()  ──────────────────────────────► OPEN
                                              │
                                         take_job()
                                              │
                                              ▼
                                           ACTIVE
                                              │
                                     submit_delivery()
                                              │
                                              ▼
                                          DELIVERED
                                         /          \\
                              auto_evaluate()   release_manually()
                                   /                    \\
                       approved  /   rejected             \\
                                 ▼         ▼               ▼
                             COMPLETED  DISPUTED        COMPLETED
                            (funds out) (funds held)   (funds out)`}
            </pre>
          </div>

          <div className="space-y-3 mb-6">
            {[
              { status: "open",      who: "Anyone",                 action: "take_job()",           next: "active",    color: "#38bdf8" },
              { status: "active",    who: "Assigned freelancer",    action: "submit_delivery()",    next: "delivered", color: "#f59e0b" },
              { status: "delivered", who: "Client",                 action: "auto_evaluate()",      next: "completed or disputed", color: "#fb923c" },
              { status: "delivered", who: "Client",                 action: "release_manually()",   next: "completed", color: "#22c55e" },
            ].map((row) => (
              <div
                key={row.action}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm flex-wrap"
                style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}
              >
                <StatusPill status={row.status} />
                <ChevronRight className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                <code style={{ fontFamily: '"JetBrains Mono"', color: row.color, fontSize: 12 }}>{row.action}</code>
                <span style={{ color: "var(--text-muted)" }}>by {row.who}</span>
                <ChevronRight className="w-3.5 h-3.5 ml-auto" style={{ color: "var(--text-muted)" }} />
                <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{row.next}</span>
              </div>
            ))}
          </div>

          <Callout icon={AlertCircle} color="#ef4444" bg="rgba(239,68,68,0.07)" border="rgba(239,68,68,0.22)">
            <strong style={{ color: "#fca5a5" }}>DISPUTED status</strong> means the AI evaluated the delivery and
            rejected it. The escrow funds remain locked in the contract. An appeal mechanism is on the roadmap but
            not yet implemented.
          </Callout>

          {/* ── AI EVALUATION ─────────────────────────────────────────────── */}
          <SectionHead
            id="ai-evaluation"
            icon={Brain}
            accent="#ec4899"
            label="AI System"
            title="AI EVALUATION"
            sub="How GenLayer validators reach consensus on freelance work quality."
          />

          <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
            <code style={{ fontFamily: '"JetBrains Mono"', color: "#a78bfa" }}>auto_evaluate</code> is the only{" "}
            <strong style={{ color: "var(--text-primary)" }}>non-deterministic</strong> contract method. It uses
            GenLayer&apos;s <code style={{ fontFamily: '"JetBrains Mono"', color: "#a78bfa" }}>gl.eq_principle.strict_eq</code> to
            ensure all validator nodes must produce the exact same result before the transaction finalizes.
          </p>

          <CodeBlock lang="python" code={`
def evaluate() -> str:
    prompt = f"""You are an impartial AI judge evaluating freelance work.

JOB: {title}
DESCRIPTION: {description}
BUDGET: {budget} GEN

SUBMISSION:
- Evidence URL:  {evidence_url}
- Freelancer note: {evidence_note}

Respond ONLY with this JSON:
{{"approved": bool, "reasoning": str}}"""

    result = gl.nondet.exec_prompt(prompt)
    return result

result_str = gl.eq_principle.strict_eq(evaluate)
# All validators must agree on this string before tx finalizes
`} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {[
              {
                label: "What AI checks",
                items: [
                  "Is the evidence URL relevant to the job spec?",
                  "Does the freelancer note describe completing the work?",
                  "Is there a reasonable basis to believe the work is done?",
                ],
                color: "#a78bfa",
              },
              {
                label: "What AI does NOT check",
                items: [
                  "Code quality or test coverage",
                  "Whether the URL is currently live",
                  "Long-term maintenance or edge cases",
                ],
                color: "#ef4444",
              },
            ].map(({ label, items, color }) => (
              <div
                key={label}
                className="rounded-xl p-4"
                style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}
              >
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color, letterSpacing: "0.08em" }}>
                  {label}
                </p>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div
            className="rounded-xl p-5 mb-4"
            style={{ background: "rgba(236,72,153,0.07)", border: "1px solid rgba(236,72,153,0.22)" }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#ec4899", letterSpacing: "0.08em" }}>
              Consensus phases during AI evaluation
            </p>
            <div className="space-y-2">
              {[
                { phase: "PROPOSING",  desc: "Leader validator runs the LLM prompt against your evidence",          color: "#a78bfa" },
                { phase: "COMMITTING", desc: "Each other validator independently runs the same prompt and hashes the result", color: "#f59e0b" },
                { phase: "REVEALING",  desc: "Validators reveal their hashes — all must match (strict_eq)",          color: "#fb923c" },
                { phase: "ACCEPTED",   desc: "Supermajority agreed — payment transfer executes atomically",           color: "#22c55e" },
              ].map(({ phase, desc, color }) => (
                <div key={phase} className="flex items-start gap-3 text-sm">
                  <code
                    className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded"
                    style={{ fontFamily: '"JetBrains Mono"', background: `${color}18`, color, border: `1px solid ${color}28` }}
                  >
                    {phase}
                  </code>
                  <span style={{ color: "var(--text-secondary)" }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>

          <Callout icon={Clock} color="#f59e0b" bg="rgba(245,158,11,0.07)" border="rgba(245,158,11,0.22)">
            AI evaluation typically takes <strong style={{ color: "#fbbf24" }}>1–5 minutes</strong> because each
            validator independently calls an LLM and they must all agree. The UI polls every second and shows live
            phase progress. Other contract writes (take job, submit delivery) finalize in 15–45 seconds.
          </Callout>

          {/* ── WALLET & NETWORK ──────────────────────────────────────────── */}
          <SectionHead
            id="wallet"
            icon={Wallet}
            accent="#38bdf8"
            label="Wallet Setup"
            title="WALLET & NETWORK"
            sub="Connecting, signing, and staying on the right chain."
          />

          <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--text-secondary)" }}>
            Arbiq uses <strong style={{ color: "var(--text-primary)" }}>RainbowKit v2</strong> with{" "}
            <strong style={{ color: "var(--text-primary)" }}>wagmi v2</strong>. Any EIP-1193 compatible wallet works —
            MetaMask, Coinbase Wallet, WalletConnect-compatible mobile wallets. The app is locked to Bradbury Testnet
            only.
          </p>

          <CodeBlock lang="text" code={`
Network name:  GenLayer Bradbury Testnet
Chain ID:      4221
RPC URL:       https://rpc-bradbury.genlayer.com
Currency:      GEN (18 decimals)
Explorer:      https://explorer-bradbury.genlayer.com
`} />

          <div className="space-y-3 mb-6">
            {[
              {
                title: "Automatic network switch",
                desc: "When you connect your wallet, Arbiq checks the active chain. If it's not Bradbury (4221), it silently calls switchChain(). A banner appears if you decline the switch.",
                color: "#38bdf8",
              },
              {
                title: "Transaction signing",
                desc: "All write transactions are signed by your connected wallet provider — MetaMask, WalletConnect, etc. The app never has access to your private key. The PRIVATE_KEY env var in the deploy script is only used for server-side contract deployment, not the frontend.",
                color: "#a78bfa",
              },
              {
                title: "Read-only mode",
                desc: "You can browse jobs and view job details without connecting a wallet. A wallet is only required to post jobs, take jobs, submit deliveries, evaluate, or chat.",
                color: "#22c55e",
              },
            ].map(({ title, desc, color }) => (
              <div
                key={title}
                className="flex gap-4 rounded-xl p-4"
                style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}
              >
                <div
                  className="w-1 rounded-full flex-shrink-0"
                  style={{ background: color, minHeight: 40 }}
                />
                <div>
                  <p className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>{title}</p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── NOTIFICATIONS ─────────────────────────────────────────────── */}
          <SectionHead
            id="notifications"
            icon={Bell}
            accent="#f59e0b"
            label="Notification System"
            title="NOTIFICATIONS"
            sub="Real-time job status alerts without WebSockets — pure polling."
          />

          <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--text-secondary)" }}>
            Every 15 seconds, the notification system fetches{" "}
            <code style={{ fontFamily: '"JetBrains Mono"', color: "#a78bfa" }}>get_jobs_by_client(address)</code> and{" "}
            <code style={{ fontFamily: '"JetBrains Mono"', color: "#a78bfa" }}>get_jobs_by_freelancer(address)</code>,
            then diffs the results against a snapshot stored in a React ref. Status transitions trigger notifications.
          </p>

          <div className="rounded-xl overflow-hidden mb-5" style={{ border: "1px solid var(--border-subtle)" }}>
            <div
              className="px-4 py-2.5"
              style={{ background: "var(--surface-raised)", borderBottom: "1px solid var(--border-divider)" }}
            >
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)", letterSpacing: "0.1em" }}>
                Notification Types
              </p>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border-divider)" }}>
              {[
                { dot: "#22c55e", type: "approved",  trigger: "Job transitions DELIVERED → COMPLETED",  msg: 'Your delivery was AI approved! Funds released for "Job Title".' },
                { dot: "#ef4444", type: "disputed",  trigger: "Job transitions DELIVERED → DISPUTED",   msg: "AI disputed your delivery on Job #12. Re-evaluate?" },
                { dot: "#38bdf8", type: "delivered", trigger: "Job transitions ACTIVE → DELIVERED",     msg: "Freelancer submitted delivery on your Job #5." },
                { dot: "#f59e0b", type: "taken",     trigger: "Job transitions OPEN → ACTIVE",          msg: "A freelancer accepted your Job #8." },
                { dot: "#71717a", type: "stale",     trigger: "Open job older than 48 hours (client)",  msg: "Your job #3 has had no activity for 48+ hours." },
              ].map(({ dot, type, trigger, msg }) => (
                <div key={type} className="px-4 py-3 flex gap-3 items-start">
                  <span
                    className="mt-1 flex-shrink-0 w-2.5 h-2.5 rounded-full"
                    style={{ background: dot, boxShadow: `0 0 6px ${dot}88` }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <code className="text-[11px] font-bold" style={{ fontFamily: '"JetBrains Mono"', color: dot }}>{type}</code>
                      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>· {trigger}</span>
                    </div>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>"{msg}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Callout icon={CheckCircle2} color="#22c55e" bg="rgba(34,197,94,0.07)" border="rgba(34,197,94,0.22)">
            Notifications persist to <code style={{ fontFamily: '"JetBrains Mono"' }}>localStorage</code> under the
            key <code style={{ fontFamily: '"JetBrains Mono"', color: "#a78bfa" }}>arbiq:notifications</code> (latest 100 kept).
            The first poll on page load silently seeds the state snapshot — no false positives on login.
          </Callout>

          {/* ── ON-CHAIN CHAT ──────────────────────────────────────────────── */}
          <SectionHead
            id="chat"
            icon={MessageSquare}
            accent="#fb923c"
            label="Messaging"
            title="ON-CHAIN CHAT"
            sub="Immutable client ↔ freelancer messages stored directly in the contract."
          />

          <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
            Every message is written on-chain via{" "}
            <code style={{ fontFamily: '"JetBrains Mono"', color: "#a78bfa" }}>send_message(job_id, content)</code>.
            Messages are stored as a JSON array in{" "}
            <code style={{ fontFamily: '"JetBrains Mono"', color: "#a78bfa" }}>messages: TreeMap[u256, str]</code> keyed
            by job ID. Only the client and assigned freelancer can send or read messages for a given job.
          </p>

          <CodeBlock lang="json" code={`
{
  "sender":    "0xabc123...",
  "content":   "I've pushed the initial commit to the repo.",
  "role":      "freelancer",
  "timestamp": 1716000000
}`} />

          <div className="space-y-3 mb-5">
            {[
              { label: "Who can message",    value: "Client and assigned freelancer only. Third parties cannot read or write messages." },
              { label: "When messaging opens", value: "After a freelancer takes the job (status moves from OPEN to ACTIVE). Messaging before that is blocked at the contract level." },
              { label: "Content limit",      value: "Messages are truncated to 500 characters on-chain. The UI shows a warning when approaching the limit." },
              { label: "Polling interval",   value: "Messages refetch every 10 seconds. Optimistic messages appear immediately with a 'confirming…' spinner until the transaction finalizes." },
              { label: "Persistence",        value: "Messages are permanent and immutable on-chain. There is no delete or edit functionality." },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="grid grid-cols-3 gap-4 rounded-xl px-4 py-3 text-sm"
                style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}
              >
                <span className="font-semibold col-span-1" style={{ color: "var(--text-label)" }}>{label}</span>
                <span className="col-span-2" style={{ color: "var(--text-secondary)" }}>{value}</span>
              </div>
            ))}
          </div>

          {/* ── HOOKS REFERENCE ───────────────────────────────────────────── */}
          <SectionHead
            id="hooks"
            icon={Package}
            accent="#38bdf8"
            label="Frontend Hooks"
            title="HOOKS REFERENCE"
            sub="All React hooks exported from useArbiqContract.ts and the utility hooks."
          />

          <h3 className="text-xs font-bold uppercase tracking-widest mb-4 mt-2" style={{ color: "#38bdf8", letterSpacing: "0.1em" }}>
            Read Hooks
          </h3>

          <HookRow
            name="useGetAllJobs"
            sig=""
            returns="{ data: Job[], isLoading, isError }"
            desc="Fetches all jobs on-chain. Refetches every 15 seconds. Used by Browse Jobs and Dashboard pages."
          />
          <HookRow
            name="useGetJob"
            sig="id: number | undefined"
            returns="{ data: Job | null, isLoading, refetch }"
            desc="Fetches a single job by ID. Refetches every 10 seconds. Disabled when id is undefined."
          />
          <HookRow
            name="useGetMyJobs"
            sig="address: string | undefined"
            returns="{ postedJobs: Job[], activeJobs: Job[] }"
            desc="Derived hook — filters useGetAllJobs() locally by client and freelancer address. No extra contract call."
          />
          <HookRow
            name="useGetJobCount"
            sig=""
            returns="{ data: number | unknown }"
            desc="Returns total job count. Refetches every 30 seconds. Used by landing page stats."
          />
          <HookRow
            name="useGetMessages"
            sig="jobId: number | undefined"
            returns="{ data: ChatMessage[], isLoading }"
            desc="Fetches chat messages for a job. Refetches every 10 seconds. Returns [] if jobId is undefined."
          />

          <h3 className="text-xs font-bold uppercase tracking-widest mb-4 mt-8" style={{ color: "#a78bfa", letterSpacing: "0.1em" }}>
            Write Hooks
          </h3>

          <HookRow
            name="usePostJob"
            sig=""
            returns="{ postJob(params), simulatePostJob(params), txState, reset, isLoading }"
            desc="Sends a payable post_job transaction. params: { title, description, deadline, budgetEth }. budgetEth is converted to wei via parseEther(). AI evaluation timeout: 90s."
          />
          <HookRow
            name="useTakeJob"
            sig=""
            returns="{ takeJob(jobId), txState, reset, isLoading }"
            desc="Assigns the connected wallet as freelancer for the given job. Fails if job is not OPEN or caller is the client."
          />
          <HookRow
            name="useSubmitDelivery"
            sig=""
            returns="{ submitDelivery(jobId, url, note), txState, reset, isLoading }"
            desc="Marks a job as DELIVERED with an evidence URL and optional note. Only the assigned freelancer can call this."
          />
          <HookRow
            name="useAutoEvaluate"
            sig=""
            returns="{ autoEvaluate(jobId), txState, reset, isLoading }"
            desc="Triggers AI consensus evaluation. Uses 300s retry timeout because LLM inference across validators takes 1–5 minutes."
          />
          <HookRow
            name="useRelease"
            sig=""
            returns="{ release(jobId), txState, reset, isLoading }"
            desc="Client manually approves and pays the freelancer. Bypasses AI. Only callable by the client when status is DELIVERED."
          />
          <HookRow
            name="useSendMessage"
            sig=""
            returns="{ sendMessage(jobId, content), txState, reset, isLoading }"
            desc="Appends a message to the job's on-chain chat thread. Content is truncated to 500 chars on-chain."
          />

          <h3 className="text-xs font-bold uppercase tracking-widest mb-4 mt-8" style={{ color: "#22c55e", letterSpacing: "0.1em" }}>
            Utility Hooks
          </h3>

          <HookRow
            name="useNotifications"
            sig=""
            returns="{ notifications, unreadCount, newToast, markAllRead, dismissToast }"
            desc="Polls chain every 15s, diffs job state, fires typed notifications. Persists to localStorage. First poll is silent (no false positives on page load)."
          />
          <HookRow
            name="useLocalFavorites"
            sig=""
            returns="{ favorites: Set<number>, toggle(id), isFavorite(id) }"
            desc="localStorage-backed job favorites under key arbiq:favorites. Hydrated in useEffect to avoid SSR mismatch."
          />
          <HookRow
            name="useScrollReveal"
            sig="staggerMs = 80"
            returns="RefObject<T>"
            desc="Attach the returned ref to a container. All .reveal children animate in with staggered delay when they enter the viewport via IntersectionObserver."
          />
          <HookRow
            name="useCountUp"
            sig="target, duration = 900, trigger = true"
            returns="number"
            desc="Animates a number from 0 to target using easeOutExpo over duration ms. Only starts when trigger is true — pair with a scroll reveal intersection flag."
          />

          {/* ── SECURITY ──────────────────────────────────────────────────── */}
          <SectionHead
            id="security"
            icon={Shield}
            accent="#22c55e"
            label="Trust Model"
            title="SECURITY MODEL"
            sub="What Arbiq guarantees and what it does not."
          />

          <div className="space-y-3 mb-6">
            {[
              {
                title: "Funds are safe from the client",
                desc: "Once a job is posted, the client cannot withdraw the escrow. The contract has no admin function that lets the client reclaim funds outside of the status machine.",
                ok: true,
              },
              {
                title: "Funds are safe from the platform",
                desc: "There is no admin key or owner address on the contract. No one can drain the escrow except via the defined state transitions (AI approval or manual release by client).",
                ok: true,
              },
              {
                title: "AI is tamper-resistant, not infallible",
                desc: "The AI evaluation uses gl.eq_principle.strict_eq — all validators must independently agree. A single malicious validator cannot alter the outcome. However, the AI can still misjudge a delivery based on insufficient evidence.",
                ok: true,
              },
              {
                title: "Messages are immutable",
                desc: "On-chain messages cannot be deleted or edited. Do not send sensitive personal data through the chat system.",
                ok: true,
              },
              {
                title: "No appeal in DISPUTED state",
                desc: "If AI rejects a delivery, funds remain locked. There is currently no mechanism to appeal or escalate. Write detailed job descriptions and delivery notes to reduce dispute risk.",
                ok: false,
              },
              {
                title: "Frontend is not the source of truth",
                desc: "Always verify transactions on the GenLayer Explorer. The frontend polls chain state and may lag by up to 15 seconds. Never rely solely on UI state for financial decisions.",
                ok: false,
              },
            ].map(({ title, desc, ok }) => (
              <div
                key={title}
                className="flex gap-4 rounded-xl p-4"
                style={{
                  background: ok ? "rgba(34,197,94,0.05)" : "rgba(239,68,68,0.05)",
                  border: `1px solid ${ok ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.18)"}`,
                }}
              >
                {ok
                  ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-400" />
                  : <AlertCircle  className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400"  />
                }
                <div>
                  <p className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>{title}</p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── CTA ───────────────────────────────────────────────────────── */}
          <div
            className="rounded-3xl p-8 mt-10 text-center relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(99,102,241,0.06) 100%)",
              border: "1px solid rgba(124,58,237,0.22)",
            }}
          >
            <div className="orb orb-violet absolute w-64 h-64 -top-16 left-1/2 -translate-x-1/2 opacity-30 pointer-events-none" />
            <h3
              className="font-display text-3xl mb-2 relative z-10"
              style={{ color: "var(--text-primary)", letterSpacing: "0.04em" }}
            >
              READY TO BUILD?
            </h3>
            <p className="text-sm mb-6 relative z-10" style={{ color: "var(--text-muted)" }}>
              Post your first job or start earning on Arbiq.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
              <Link
                href="/jobs/new"
                className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-sm"
              >
                Post a Job <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/jobs"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all"
                style={{ color: "#a78bfa", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.22)" }}
              >
                Browse Open Jobs
              </Link>
            </div>
          </div>

        </main>
      </div>

      <Footer />
    </div>
  );
}
