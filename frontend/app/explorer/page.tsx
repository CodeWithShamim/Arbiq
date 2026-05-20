"use client";

import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Activity, ArrowUpRight, CheckCircle2, XCircle,
  RefreshCw, ExternalLink, Clock, Hash, Layers,
  ChevronLeft, ChevronRight, Loader2, Zap,
  Box, Copy, Check,
} from "lucide-react";

const CA          = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";
const EXPLORER    = "https://explorer-bradbury.genlayer.com";
const API         = `${EXPLORER}/api/v1`;
const PAGE_SIZE   = 10;

// ── Types ──────────────────────────────────────────────────────────────────

type ValidatorVote = { address: string; vote: string };
type Round        = { round: number; result: string; validators: ValidatorVote[] };

type Tx = {
  hash:               string;
  rollup_hash:        string;
  from:               string;
  value:              string;
  fee:                string;
  block:              string;
  status:             string;
  result:             string;
  tx_type:            string;
  timestamp:          number;
  method:             string | null;
  args:               unknown[] | null;
  error:              string | null;
  validators:         string[];
  leader:             string;
  rounds:             Round[];
};

// ── Helpers ────────────────────────────────────────────────────────────────

function decodeCalldata(encoded: unknown): { method: string | null; args: unknown[] | null } {
  try {
    const content = (encoded as any)?.calldata?.content as string;
    if (!content) return { method: null, args: null };
    for (const pad of ["===", "==", "=", ""]) {
      try {
        const b64  = (content + pad).replace(/-/g, "+").replace(/_/g, "/");
        const parsed = JSON.parse(atob(b64));
        return { method: parsed.method ?? null, args: parsed.args ?? null };
      } catch { /* try next */ }
    }
  } catch {}
  return { method: null, args: null };
}

function parseError(enrichment: unknown): string | null {
  try {
    for (const v of Object.values((enrichment as any)?.traces ?? {}) as any[]) {
      const rt: string = v?.return_text ?? "";
      const first = rt.split("|")[0].trim();
      if (first && first !== "fingerprint") return first;
      const stderr: string = v?.stderr ?? "";
      const m = stderr.match(/(\w+Error[^\n]*)/);
      if (m) return m[1].slice(0, 120);
    }
  } catch {}
  return null;
}

function normalizeTx(raw: any): Tx {
  const { method, args } = decodeCalldata(raw?.data?.params?.encoded_data);
  const rounds: Round[]  = raw?.enrichment_data?.rounds ?? [];
  return {
    hash:        raw.hash,
    rollup_hash: raw.rollup_transaction_hash ?? "",
    from:        raw.from_address,
    value:       raw.value ?? "0",
    fee:         raw.fee ?? "0",
    block:       raw.starting_block_number ?? "—",
    status:      raw.status,
    result:      raw.execution_result ?? "PENDING",
    tx_type:     raw.transaction_type,
    timestamp:   raw.submission_timestamp,
    method,
    args,
    error:       raw.execution_result === "FINISHED_WITH_ERROR" ? parseError(raw?.enrichment_data) : null,
    validators:  (raw.validators ?? []) as string[],
    leader:      raw.leader ?? "",
    rounds,
  };
}

function timeAgo(ts: number) {
  const d = Math.floor(Date.now() / 1000) - ts;
  if (d < 60)    return `${d}s ago`;
  if (d < 3600)  return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

function fmt(ts: number) {
  return new Date(ts * 1000).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function fmtWei(wei: string) {
  const n = BigInt(wei);
  if (n === 0n) return "0 GEN";
  const eth = Number(n) / 1e18;
  return eth < 0.0001 ? `${(Number(n) / 1e9).toFixed(2)} Gwei` : `${eth.toFixed(4)} GEN`;
}

function short(addr: string, n = 8) {
  return `${addr.slice(0, n)}…${addr.slice(-6)}`;
}

const METHOD_COLOR: Record<string, string> = {
  post_job:                   "#38bdf8",
  post_job_milestones:        "#38bdf8",
  take_job:                   "#fb923c",
  submit_delivery:            "#a78bfa",
  submit_milestone_delivery:  "#a78bfa",
  auto_evaluate:              "#f59e0b",
  approve_milestone:          "#22c55e",
  release_manually:           "#22c55e",
  resubmit_delivery:          "#e879f9",
  send_message:               "#94a3b8",
  get_job:                    "#475569",
  get_all_jobs:               "#475569",
  get_profile:                "#475569",
};

// ── Sub-components ─────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="p-0.5 rounded transition-colors"
      style={{ color: copied ? "#22c55e" : "var(--text-muted)" }}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function ResultBadge({ result }: { result: string }) {
  const ok  = result === "FINISHED_WITH_RETURN";
  const err = result === "FINISHED_WITH_ERROR";
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
      background: ok ? "rgba(34,197,94,0.12)" : err ? "rgba(239,68,68,0.12)" : "rgba(251,191,36,0.12)",
      color:      ok ? "#22c55e"              : err ? "#ef4444"              : "#fbbf24",
      border:    `1px solid ${ok ? "rgba(34,197,94,0.25)" : err ? "rgba(239,68,68,0.25)" : "rgba(251,191,36,0.25)"}`,
    }}>
      {ok ? <CheckCircle2 className="w-2.5 h-2.5" /> : err ? <XCircle className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
      {ok ? "SUCCESS" : err ? "ERROR" : "PENDING"}
    </span>
  );
}

function MethodPill({ method, type }: { method: string | null; type: string }) {
  const label = method ?? (type === "CONTRACT_DEPLOYMENT" ? "deploy" : "—");
  const color = METHOD_COLOR[label] ?? "var(--text-secondary)";
  return (
    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md" style={{
      background: `${color}14`,
      border:     `1px solid ${color}30`,
      color,
    }}>
      {label}
    </span>
  );
}

function VoteRow({ vote, address, isLeader }: { vote: string; address: string; isLeader: boolean }) {
  const ok = vote === "finished_with_return";
  return (
    <div className="flex items-center gap-2 text-xs">
      <span style={{ color: ok ? "#22c55e" : "#ef4444" }}>
        {ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
      </span>
      <span className="font-mono" style={{ color: "var(--text-secondary)" }}>{short(address, 10)}</span>
      {isLeader && (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{
          background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)",
        }}>LEADER</span>
      )}
    </div>
  );
}

function TxDetail({ tx }: { tx: Tx }) {
  return (
    <div
      className="col-span-12 mt-2 rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-primary)" }}
    >
      {/* Detail header */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--surface-card)" }}>
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5" style={{ color: "#a78bfa" }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-label)" }}>
            Transaction Details
          </span>
        </div>
        <a
          href={`${EXPLORER}/tx/${tx.hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg"
          style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.28)", color: "#a78bfa" }}
        >
          Bradbury Explorer <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-0" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        {/* Left — tx meta */}
        <div className="p-4 space-y-3 md:col-span-2" style={{ borderRight: "1px solid var(--border-subtle)" }}>
          <Field label="Transaction Hash">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono break-all" style={{ color: "#a78bfa" }}>{tx.hash}</span>
              <CopyButton text={tx.hash} />
            </div>
          </Field>
          <Field label="Rollup Hash">
            <span className="text-xs font-mono break-all" style={{ color: "var(--text-secondary)" }}>{tx.rollup_hash}</span>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="From">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{short(tx.from, 10)}</span>
                <CopyButton text={tx.from} />
              </div>
            </Field>
            <Field label="Block">
              <span className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>#{tx.block}</span>
            </Field>
            <Field label="Value">
              <span className="text-xs font-mono font-bold" style={{ color: tx.value !== "0" ? "#22c55e" : "var(--text-muted)" }}>
                {fmtWei(tx.value)}
              </span>
            </Field>
            <Field label="Fee">
              <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{fmtWei(tx.fee)}</span>
            </Field>
            <Field label="Timestamp">
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{fmt(tx.timestamp)}</span>
            </Field>
            <Field label="Status">
              <ResultBadge result={tx.result} />
            </Field>
          </div>
          {tx.error && (
            <Field label="Error">
              <span className="text-xs font-mono" style={{ color: "#ef4444" }}>{tx.error}</span>
            </Field>
          )}
          {tx.args && tx.args.length > 0 && (
            <Field label="Arguments">
              <pre className="text-[11px] font-mono p-3 rounded-lg overflow-x-auto mt-1" style={{
                background: "var(--surface-card)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)",
              }}>
                {JSON.stringify(tx.args, null, 2)}
              </pre>
            </Field>
          )}
        </div>

        {/* Right — consensus */}
        <div className="p-4 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
            Consensus
          </p>
          {tx.rounds.length > 0 ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
                  background: tx.rounds[0].result === "majority_agree" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                  color: tx.rounds[0].result === "majority_agree" ? "#22c55e" : "#ef4444",
                  border: `1px solid ${tx.rounds[0].result === "majority_agree" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                }}>
                  {tx.rounds[0].result.replace(/_/g, " ").toUpperCase()}
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {tx.rounds[0].validators.length} validators
                </span>
              </div>
              <div className="space-y-2">
                {tx.rounds[0].validators.map((v) => (
                  <VoteRow key={v.address} vote={v.vote} address={v.address} isLeader={v.address.toLowerCase() === tx.leader.toLowerCase()} />
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>No consensus data</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--text-muted)" }}>{label}</p>
      {children}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ExplorerPage() {
  const [txs,        setTxs]        = useState<Tx[]>([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded,   setExpanded]   = useState<string | null>(null);

  const load = useCallback(async (p: number, silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    try {
      const res  = await fetch(`/api/explorer-txs?limit=${PAGE_SIZE}&page=${p}`);
      const data = await res.json();
      setTotal(data.total ?? 0);
      setTxs((data.transactions ?? []).map(normalizeTx));
      if (!silent) setExpanded(null);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(page); }, [page, load]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <Navbar />

      {/* ── Header ── */}
      <div className="pt-24 pb-10 px-4 md:px-8 relative overflow-hidden" style={{ borderBottom: "1px solid var(--border-page)" }}>
        <div className="dot-grid opacity-30" style={{ bottom: "auto", height: "100%" }} />
        <div className="orb orb-violet absolute w-96 h-96 -top-24 right-0 opacity-20 pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <p className="label mb-3" style={{ color: "#7c3aed" }}>On-chain activity</p>
          <h1 className="font-display text-5xl md:text-6xl mb-5" style={{ color: "var(--text-primary)", letterSpacing: "0.04em" }}>
            CONTRACT EXPLORER
          </h1>
          {/* Contract address + stats row */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`${EXPLORER}/address/${CA}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs font-mono px-3 py-2 rounded-xl transition-all"
              style={{ background: "rgba(124,58,237,0.10)", border: "1px solid rgba(124,58,237,0.28)", color: "#a78bfa" }}
            >
              <Hash className="w-3 h-3 shrink-0" />
              {CA}
              <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
            </a>
            <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-2 rounded-xl"
              style={{ background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.22)", color: "#38bdf8" }}>
              <Layers className="w-3 h-3" /> Bradbury · Chain 4221
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-2 rounded-xl"
              style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.20)", color: "#22c55e" }}>
              <Activity className="w-3 h-3" /> {total.toLocaleString()} transactions
            </span>
          </div>
        </div>
      </div>

      <main className="px-4 md:px-8 py-10 max-w-6xl mx-auto">

        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-label)" }}>
            Latest Transactions
          </h2>
          <button
            onClick={() => load(page, true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
            style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.20)", color: "#a78bfa" }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* ── Table ── */}
        <div className="rounded-2xl overflow-hidden mb-6" style={{ border: "1px solid var(--border-subtle)", background: "var(--glass-bg)" }}>

          {/* Column headers */}
          <div
            className="hidden md:grid grid-cols-12 gap-2 px-5 py-3 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border-subtle)", background: "var(--surface-card)" }}
          >
            <div className="col-span-3">Tx Hash</div>
            <div className="col-span-2">Method</div>
            <div className="col-span-2">From</div>
            <div className="col-span-1">Value</div>
            <div className="col-span-2">Result</div>
            <div className="col-span-1">Block</div>
            <div className="col-span-1 text-right">Age</div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 gap-3" style={{ color: "var(--text-muted)" }}>
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#7c3aed" }} />
              <span className="text-sm">Loading transactions…</span>
            </div>
          ) : txs.length === 0 ? (
            <p className="text-center py-20 text-sm" style={{ color: "var(--text-muted)" }}>No transactions found.</p>
          ) : (
            txs.map((tx) => (
              <div key={tx.hash}>
                {/* Row */}
                <div
                  onClick={() => setExpanded(expanded === tx.hash ? null : tx.hash)}
                  className="grid grid-cols-12 gap-2 px-5 py-3.5 cursor-pointer transition-colors duration-100 group"
                  style={{
                    borderBottom: "1px solid var(--border-divider)",
                    background: expanded === tx.hash ? "rgba(124,58,237,0.05)" : "transparent",
                  }}
                  onMouseEnter={(e) => { if (expanded !== tx.hash) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}
                  onMouseLeave={(e) => { if (expanded !== tx.hash) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  {/* Hash */}
                  <div className="col-span-3 flex items-center gap-1.5">
                    <span className="text-xs font-mono truncate" style={{ color: "#a78bfa" }}>
                      {tx.hash.slice(0, 14)}…
                    </span>
                    <CopyButton text={tx.hash} />
                  </div>
                  {/* Method */}
                  <div className="col-span-2 flex items-center">
                    <MethodPill method={tx.method} type={tx.tx_type} />
                  </div>
                  {/* From */}
                  <div className="col-span-2 hidden md:flex items-center">
                    <span className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
                      {short(tx.from, 8)}
                    </span>
                  </div>
                  {/* Value */}
                  <div className="col-span-1 hidden md:flex items-center">
                    <span className="text-xs font-mono" style={{ color: tx.value !== "0" ? "#22c55e" : "var(--text-muted)" }}>
                      {fmtWei(tx.value)}
                    </span>
                  </div>
                  {/* Result */}
                  <div className="col-span-2 flex items-center">
                    <ResultBadge result={tx.result} />
                  </div>
                  {/* Block */}
                  <div className="col-span-1 hidden md:flex items-center">
                    <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>#{tx.block}</span>
                  </div>
                  {/* Age + external link */}
                  <div className="col-span-2 md:col-span-1 flex items-center justify-end gap-2">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{timeAgo(tx.timestamp)}</span>
                    <a
                      href={`${EXPLORER}/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-6 h-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      style={{ background: "rgba(124,58,237,0.12)", color: "#a78bfa" }}
                    >
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Expanded detail */}
                {expanded === tx.hash && (
                  <div className="px-4 pb-4" style={{ borderBottom: "1px solid var(--border-divider)", background: "rgba(124,58,237,0.03)" }}>
                    <TxDetail tx={tx} />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mb-10">
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Page {page} of {totalPages} · {total.toLocaleString()} total
            </p>
            <div className="flex items-center gap-1.5">
              <PagBtn onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </PagBtn>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page + i - 2;
                if (p < 1 || p > totalPages) return null;
                return (
                  <PagBtn key={p} onClick={() => setPage(p)} active={p === page}>{p}</PagBtn>
                );
              })}
              <PagBtn onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight className="w-3.5 h-3.5" />
              </PagBtn>
            </div>
          </div>
        )}

        {/* ── Contract Info ── */}
        <div className="p-6 rounded-2xl" style={{ background: "var(--glass-bg)", border: "1px solid var(--border-subtle)" }}>
          <div className="flex items-center gap-2 mb-5">
            <Box className="w-4 h-4" style={{ color: "#a78bfa" }} />
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-label)" }}>
              Contract Info
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
            <InfoRow label="Contract Address" value={CA} mono copy />
            <InfoRow label="Network" value="GenLayer Bradbury Testnet" />
            <InfoRow label="Chain ID" value="4221" mono />
            <InfoRow label="Language" value="Python (Intelligent Contract)" />
            <InfoRow label="Runtime" value="py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" mono />
            <div className="flex items-center gap-2 pt-1">
              <a
                href={`${EXPLORER}/address/${CA}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.28)", color: "#a78bfa" }}
              >
                <ExternalLink className="w-3 h-3" /> View on Bradbury Explorer
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// ── Tiny helpers ───────────────────────────────────────────────────────────

function PagBtn({ onClick, disabled, active, children }: {
  onClick: () => void; disabled?: boolean; active?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all disabled:opacity-30"
      style={{
        background: active ? "rgba(124,58,237,0.22)" : "var(--glass-bg)",
        border:    `1px solid ${active ? "rgba(124,58,237,0.45)" : "var(--border-subtle)"}`,
        color:      active ? "#c4b5fd" : "var(--text-secondary)",
      }}
    >
      {children}
    </button>
  );
}

function InfoRow({ label, value, mono, copy }: { label: string; value: string; mono?: boolean; copy?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--text-muted)" }}>{label}</p>
      <div className="flex items-center gap-1.5">
        <p className={`text-xs break-all ${mono ? "font-mono" : "font-medium"}`} style={{ color: "var(--text-secondary)" }}>
          {value}
        </p>
        {copy && <CopyButton text={value} />}
      </div>
    </div>
  );
}
