"use client";

import { useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useGetAllJobs } from "@/hooks/useArbiqContract";
import { formatBudget } from "@/lib/utils";
import type { Job } from "@/lib/types";
import {
  TrendingUp, TrendingDown, Minus,
  BarChart2, Download, RefreshCw,
  Coins, Briefcase, Brain, Clock,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar,
  LineChart, Line,
  Legend,
} from "recharts";

/* ─── Types ──────────────────────────────────────────────────────────────── */

type Range = "7d" | "30d" | "90d" | "all";

/* ─── Constants ──────────────────────────────────────────────────────────── */

const STATUS_COLOR: Record<string, string> = {
  open:      "#38bdf8",
  active:    "#f59e0b",
  delivered: "#fb923c",
  completed: "#22c55e",
  disputed:  "#ef4444",
};

const CHART_GRID    = "var(--chart-grid)";
const CHART_AXIS    = "var(--chart-axis)";
const TOOLTIP_BG    = "var(--bg-elevated)";
const TOOLTIP_BORDER = "rgba(124,58,237,0.3)";
const BAR_COLORS    = ["#a78bfa","#38bdf8","#22c55e","#f59e0b","#fb923c","#ec4899","#6b7280"];

/* ─── Timestamp helpers ──────────────────────────────────────────────────── */

// created_at from contract is unix SECONDS; convert to ms for Date
function toMs(ts: number | undefined): number {
  if (!ts) return 0;
  // Values < 1e12 are seconds, ≥ 1e12 are already ms
  return ts < 1_000_000_000_000 ? ts * 1000 : ts;
}

function jobDate(job: Job): Date | null {
  if (!job.created_at) return null;
  return new Date(toMs(job.created_at));
}

function rangeStart(range: Range): Date | null {
  if (range === "all") return null;
  const d = new Date();
  d.setDate(d.getDate() - (range === "7d" ? 7 : range === "30d" ? 30 : 90));
  d.setHours(0, 0, 0, 0);
  return d;
}

// Jobs that have created_at AND fall within the selected range
function filterByRange(jobs: Job[], range: Range): Job[] {
  const from = rangeStart(range);
  if (!from) return jobs; // "all" — include everything, even jobs without timestamp
  return jobs.filter((j) => {
    const d = jobDate(j);
    if (!d) return false; // no timestamp → exclude from time-range views
    return d >= from;
  });
}

// Previous equivalent window (for trend comparison)
function prevWindow(jobs: Job[], range: Range): Job[] {
  if (range === "all") return [];
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const to   = rangeStart(range)!; // start of current window = end of prev window
  const from = new Date(to); from.setDate(from.getDate() - days);
  return jobs.filter((j) => {
    const d = jobDate(j);
    if (!d) return false;
    return d >= from && d < to;
  });
}

function fmtDay(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/* ─── Data derivation ────────────────────────────────────────────────────── */

function deriveStats(jobs: Job[], prev: Job[]) {
  const vol      = jobs.reduce((s, j) => s + j.budget, 0);
  const prevVol  = prev.reduce((s, j) => s + j.budget, 0);
  const completed  = jobs.filter((j) => j.status === "completed");
  const disputed   = jobs.filter((j) => j.status === "disputed");
  const pCompleted = prev.filter((j) => j.status === "completed");
  const pDisputed  = prev.filter((j) => j.status === "disputed");
  const evaluated  = completed.length + disputed.length;
  const pEvaluated = pCompleted.length + pDisputed.length;
  const approval   = evaluated  ? Math.round((completed.length  / evaluated)  * 100) : 0;
  const pApproval  = pEvaluated ? Math.round((pCompleted.length / pEvaluated) * 100) : 0;
  const avg        = jobs.length ? Math.round(vol / jobs.length) : 0;
  const pAvg       = prev.length ? Math.round(prevVol / prev.length) : 0;
  return { vol, prevVol, count: jobs.length, pCount: prev.length, approval, pApproval, avg, pAvg };
}

function deriveStatusDonut(jobs: Job[]) {
  const counts: Record<string, number> = {};
  for (const j of jobs) counts[j.status] = (counts[j.status] ?? 0) + 1;
  return Object.entries(counts)
    .map(([status, count]) => ({ status, count, color: STATUS_COLOR[status] ?? "#6b7280" }))
    .sort((a, b) => b.count - a.count);
}

function deriveVolumeArea(jobs: Job[], range: Range) {
  // Only jobs that have a timestamp can be plotted on a time axis
  const timed = jobs.filter((j) => j.created_at).sort(
    (a, b) => toMs(a.created_at) - toMs(b.created_at)
  );
  if (timed.length === 0) return [];

  // Build daily bucket
  const buckets = new Map<string, number>();
  for (const j of timed) {
    const day = isoDay(new Date(toMs(j.created_at)));
    buckets.set(day, (buckets.get(day) ?? 0) + j.budget / 1e18);
  }

  // Enumerate every day in the window
  const from = rangeStart(range) ?? new Date(toMs(timed[0].created_at));
  const to   = new Date();
  const days: string[] = [];
  for (const d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    days.push(isoDay(d));
  }

  let cumulative = 0;
  return days.map((day) => {
    const daily   = +(buckets.get(day) ?? 0).toFixed(4);
    cumulative    = +(cumulative + daily).toFixed(4);
    return { day: fmtDay(new Date(day)), daily, cumulative };
  });
}

function deriveVerdictBars(jobs: Job[]) {
  const b = {
    high:   { approved: 0, disputed: 0 },
    medium: { approved: 0, disputed: 0 },
    low:    { approved: 0, disputed: 0 },
  };
  for (const j of jobs) {
    if (j.status !== "completed" && j.status !== "disputed") continue;
    const len = j.ai_reasoning?.length ?? 0;
    const bucket = len > 300 ? "high" : len > 100 ? "medium" : "low";
    if (j.status === "completed") b[bucket].approved++;
    else                          b[bucket].disputed++;
  }
  return [
    { label: "High",   ...b.high   },
    { label: "Medium", ...b.medium },
    { label: "Low",    ...b.low    },
  ];
}

function deriveResolutionLine(jobs: Job[]) {
  // Resolution time = updated_at - created_at for completed jobs
  return jobs
    .filter((j) => j.status === "completed" && j.created_at && j.updated_at)
    .slice(-20)
    .map((j) => {
      const hrs = +((toMs(j.updated_at!) - toMs(j.created_at!)) / 3_600_000).toFixed(1);
      return { name: `#${j.id}`, hours: Math.max(0, hrs) };
    });
}

function deriveCategoryBars(jobs: Job[]) {
  const KEYWORDS: [string, RegExp][] = [
    ["Web Dev",         /web|frontend|react|next|vue|html|css|javascript|typescript/i],
    ["Smart Contract",  /contract|solidity|blockchain|web3|defi|nft|genlayer/i],
    ["Design",          /design|ui|ux|figma|logo|graphic|branding/i],
    ["Backend / API",   /backend|api|node|python|server|database|django|express|fastapi/i],
    ["Mobile",          /mobile|ios|android|react native|flutter/i],
    ["AI / ML",         /\bai\b|ml|machine learning|gpt|llm|data science|model/i],
    ["Writing",         /writ|copy|content|blog|article|seo|documentation/i],
    ["Other",           /.*/],
  ];
  const counts: Record<string, number> = {};
  for (const j of jobs) {
    const text = `${j.title} ${j.description}`;
    for (const [cat, re] of KEYWORDS) {
      if (re.test(text)) { counts[cat] = (counts[cat] ?? 0) + 1; break; }
    }
  }
  return Object.entries(counts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);
}

/* ─── CSV export ─────────────────────────────────────────────────────────── */

function exportCSV(jobs: Job[]) {
  const header = ["id","title","status","budget_gen","client","freelancer","deadline","created_at_unix","updated_at_unix"];
  const rows = jobs.map((j) => [
    j.id,
    `"${j.title.replace(/"/g,'""')}"`,
    j.status,
    (j.budget / 1e18).toFixed(6),
    j.client,
    j.freelancer || "",
    j.deadline,
    j.created_at ?? "",
    j.updated_at ?? "",
  ].join(","));
  const blob = new Blob([[header.join(","), ...rows].join("\n")], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), { href: url, download: `arbiq-${new Date().toISOString().slice(0,10)}.csv` });
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── Shared chart tooltip ───────────────────────────────────────────────── */

type TooltipPayloadItem = { name: string; value: number; color: string };

function ChartTip({ active, payload, label, unit = "" }: {
  active?: boolean; payload?: TooltipPayloadItem[]; label?: string; unit?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: TOOLTIP_BG, border: `1px solid ${TOOLTIP_BORDER}`, borderRadius: 10, padding: "10px 14px", minWidth: 130 }}>
      {label && <p style={{ color: "#a78bfa", fontSize: 11, fontWeight: 700, marginBottom: 6, fontFamily: '"JetBrains Mono"' }}>{label}</p>}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, fontSize: 12, fontFamily: '"JetBrains Mono"', margin: "2px 0" }}>
          {p.name}: <strong>{p.value.toLocaleString()}{unit}</strong>
        </p>
      ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  const color = entry?.payload?.color ?? "#a78bfa";
  return (
    <div style={{ background: TOOLTIP_BG, border: `1px solid ${TOOLTIP_BORDER}`, borderRadius: 10, padding: "8px 12px" }}>
      <p style={{ color, fontSize: 12, fontFamily: '"JetBrains Mono"', fontWeight: 700 }}>
        {String(entry.name).toUpperCase()}: {entry.value}
      </p>
    </div>
  );
}

/* ─── Trend arrow ────────────────────────────────────────────────────────── */

function Trend({ curr, prev, suffix = "" }: { curr: number; prev: number; suffix?: string }) {
  const pct = prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);
  const color = pct === 0 ? "var(--text-muted)" : pct > 0 ? "#22c55e" : "#ef4444";
  const Icon  = pct === 0 ? Minus : pct > 0 ? TrendingUp : TrendingDown;
  return (
    <span className="flex items-center gap-0.5 text-[11px] font-bold" style={{ color, fontFamily: '"JetBrains Mono"' }}>
      <Icon className="w-3 h-3" />
      {pct > 0 ? "+" : ""}{pct}%{suffix}
    </span>
  );
}

/* ─── Reusable wrappers ──────────────────────────────────────────────────── */

function ChartCard({ title, subtitle, accent, icon: Icon, children, note }: {
  title: string; subtitle: string; accent: string; icon: React.ElementType; children: React.ReactNode; note?: string;
}) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2.5 mb-0.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${accent}18`, border: `1px solid ${accent}28` }}>
            <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
          </div>
          <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{title}</p>
        </div>
        <p className="text-xs ml-9" style={{ color: "var(--text-muted)" }}>{subtitle}</p>
        {note && <p className="text-[10px] ml-9 mt-0.5 italic" style={{ color: "var(--text-muted)" }}>{note}</p>}
      </div>
      <div className="px-2 pb-4">{children}</div>
    </div>
  );
}

function EmptyChart({ msg }: { msg?: string }) {
  return (
    <div className="flex items-center justify-center h-52 flex-col gap-2">
      <BarChart2 className="w-8 h-8 opacity-15" style={{ color: "var(--text-muted)" }} />
      <p className="text-xs text-center max-w-xs" style={{ color: "var(--text-muted)" }}>{msg ?? "No data available"}</p>
    </div>
  );
}

function DonutLabel({ viewBox, total }: { viewBox?: { cx?: number; cy?: number }; total: number }) {
  const { cx = 0, cy = 0 } = viewBox ?? {};
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
      <tspan x={cx} dy="-8" style={{ fontSize: 26, fontWeight: 900, fill: "var(--text-primary)", fontFamily: '"JetBrains Mono"' }}>{total}</tspan>
      <tspan x={cx} dy="22"  style={{ fontSize: 10,  fontWeight: 700, fill: "var(--text-muted)", letterSpacing: 2 }}>TOTAL</tspan>
    </text>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function AnalyticsPage() {
  const { data: allJobs = [], isLoading, refetch, isRefetching } = useGetAllJobs();
  const [range, setRange] = useState<Range>("all");

  const jobs     = useMemo(() => filterByRange(allJobs, range), [allJobs, range]);
  const prev     = useMemo(() => prevWindow(allJobs, range),    [allJobs, range]);

  const stats         = useMemo(() => deriveStats(jobs, prev),         [jobs, prev]);
  const statusDonut   = useMemo(() => deriveStatusDonut(jobs),         [jobs]);
  const volumeArea    = useMemo(() => deriveVolumeArea(jobs, range),   [jobs, range]);
  const verdictBars   = useMemo(() => deriveVerdictBars(jobs),         [jobs]);
  const resolutionLine= useMemo(() => deriveResolutionLine(jobs),      [jobs]);
  const categoryBars  = useMemo(() => deriveCategoryBars(allJobs),     [allJobs]); // always all jobs for categories

  // How many jobs actually have timestamps (for the range picker note)
  const withTimestamp = allJobs.filter((j) => j.created_at).length;
  const noTimestamp   = allJobs.length - withTimestamp;

  const RANGES: { key: Range; label: string }[] = [
    { key: "7d",  label: "7D"  },
    { key: "30d", label: "30D" },
    { key: "90d", label: "90D" },
    { key: "all", label: "ALL" },
  ];

  const summaryCards = [
    { label: "Total Volume",    value: `${(stats.vol / 1e18).toFixed(2)} GEN`, icon: Coins,     accent: "#a78bfa", curr: stats.vol,      pr: stats.prevVol   },
    { label: "Total Jobs",      value: String(jobs.length),                    icon: Briefcase, accent: "#38bdf8", curr: stats.count,    pr: stats.pCount    },
    { label: "AI Approval",     value: `${stats.approval}%`,                   icon: Brain,     accent: "#22c55e", curr: stats.approval, pr: stats.pApproval },
    { label: "Avg Budget",      value: formatBudget(stats.avg),                icon: Clock,     accent: "#f59e0b", curr: stats.avg,      pr: stats.pAvg      },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <Navbar />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        className="pt-24 pb-10 px-4 md:px-8 relative overflow-hidden"
        style={{ borderBottom: "1px solid var(--border-page)" }}
      >
        <div className="dot-grid absolute inset-0 pointer-events-none" />
        <div className="orb orb-violet absolute w-96 h-96 -top-24 right-0 opacity-20 pointer-events-none" />
        <div className="orb orb-indigo absolute w-64 h-64 top-0 -left-20 opacity-10 pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <p className="label mb-3" style={{ color: "#7c3aed" }}>Live on-chain data</p>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display text-6xl" style={{ color: "var(--text-primary)", letterSpacing: "0.04em" }}>
                ANALYTICS
              </h1>
              <p className="text-sm mt-2 font-medium" style={{ color: "var(--text-muted)" }}>
                Volume, verdicts, and job activity — sourced directly from the contract.
              </p>
              {noTimestamp > 0 && (
                <p className="text-[11px] mt-1.5" style={{ color: "var(--text-muted)", fontFamily: '"JetBrains Mono"', opacity: 0.7 }}>
                  {withTimestamp}/{allJobs.length} jobs have timestamps · {noTimestamp} pre-update job{noTimestamp !== 1 ? "s" : ""} appear in ALL view only
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {/* Range picker */}
              <div className="flex items-center rounded-xl p-1 gap-0.5" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
                {RANGES.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setRange(key)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150"
                    style={{
                      background: range === key ? "rgba(124,58,237,0.22)" : "transparent",
                      border:     range === key ? "1px solid rgba(124,58,237,0.35)" : "1px solid transparent",
                      color:      range === key ? "#c4b5fd" : "var(--text-muted)",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Refresh */}
              <button
                onClick={() => refetch()}
                disabled={isRefetching}
                title="Refresh"
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
              </button>

              {/* Export */}
              <button
                onClick={() => exportCSV(jobs)}
                disabled={jobs.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: "rgba(124,58,237,0.12)",
                  border: "1px solid rgba(124,58,237,0.28)",
                  color: "#a78bfa",
                  opacity: jobs.length === 0 ? 0.4 : 1,
                }}
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="px-4 md:px-8 py-10 max-w-6xl mx-auto">

        {/* ── Summary cards ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {summaryCards.map(({ label, value, icon: Icon, accent, curr, pr }) => (
            <div key={label} className="rounded-2xl p-5 relative overflow-hidden" style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
              <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at top left, ${accent}12 0%, transparent 65%)` }} />
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}>
                  <Icon className="w-4 h-4" style={{ color: accent }} strokeWidth={1.8} />
                </div>
                {range !== "all" && <Trend curr={curr} prev={pr} />}
              </div>
              <p className="text-xl font-black mb-0.5 relative z-10 tabular-nums leading-none" style={{ color: "var(--text-primary)", fontFamily: '"JetBrains Mono", monospace' }}>
                {isLoading ? <span className="shimmer inline-block w-20 h-5 rounded" /> : value}
              </p>
              <p className="text-[10px] font-bold relative z-10" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                {label.toUpperCase()}
              </p>
            </div>
          ))}
        </div>

        {/* ── Row 1: Donut + Area ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">

          {/* 1. Jobs by Status */}
          <div className="lg:col-span-2">
            <ChartCard title="Jobs by Status" subtitle="Count per lifecycle state" accent="#a78bfa" icon={BarChart2}>
              {isLoading ? (
                <EmptyChart msg="Loading…" />
              ) : statusDonut.length === 0 ? (
                <EmptyChart msg="No jobs found" />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={statusDonut}
                        cx="50%" cy="50%"
                        innerRadius={60} outerRadius={86}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="status"
                        label={false}
                      >
                        {statusDonut.map((e) => <Cell key={e.status} fill={e.color} stroke="transparent" />)}
                        {/* Center label rendered as recharts label prop */}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Manual center label overlay */}
                  <div className="relative" style={{ marginTop: -220 + 4, height: 220, pointerEvents: "none" }}>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span style={{ fontFamily: '"JetBrains Mono"', fontSize: 26, fontWeight: 900, color: "var(--text-primary)", lineHeight: 1 }}>{jobs.length}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: 2 }}>TOTAL</span>
                    </div>
                  </div>
                  {/* Legend */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-4 pb-1">
                    {statusDonut.map(({ status, count, color }) => (
                      <div key={status} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                        <span className="text-[11px] font-semibold capitalize" style={{ color: "var(--text-secondary)" }}>{status}</span>
                        <span className="text-[11px]" style={{ color: "var(--text-muted)", fontFamily: '"JetBrains Mono"' }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </ChartCard>
          </div>

          {/* 2. GEN Volume Over Time */}
          <div className="lg:col-span-3">
            <ChartCard
              title="GEN Volume Over Time"
              subtitle="Daily posted + cumulative escrow"
              accent="#38bdf8"
              icon={TrendingUp}
              note={volumeArea.length === 0 && !isLoading ? "Requires jobs with timestamps — deploy the updated contract and post new jobs." : undefined}
            >
              {isLoading ? (
                <EmptyChart msg="Loading…" />
              ) : volumeArea.length === 0 ? (
                <EmptyChart msg="No timestamped jobs in this range. Switch to ALL or post new jobs." />
              ) : (
                <ResponsiveContainer width="100%" height={248}>
                  <AreaChart data={volumeArea} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="gDaily" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}    />
                      </linearGradient>
                      <linearGradient id="gCumul" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.20} />
                        <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: CHART_AXIS, fontSize: 10, fontFamily: '"JetBrains Mono"' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: CHART_AXIS, fontSize: 10, fontFamily: '"JetBrains Mono"' }} axisLine={false} tickLine={false} width={44} unit=" GEN" />
                    <Tooltip content={(props: any) => <ChartTip {...props} unit=" GEN" />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: "var(--text-muted)", fontFamily: '"JetBrains Mono"', paddingTop: 8 }} />
                    <Area type="monotone" dataKey="daily"      name="Daily"      stroke="#38bdf8" fill="url(#gDaily)" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="cumulative" name="Cumulative" stroke="#a78bfa" fill="url(#gCumul)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>
        </div>

        {/* ── Row 2: Verdict bars + Resolution line ────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

          {/* 3. AI Verdict Distribution */}
          <ChartCard title="AI Verdict Distribution" subtitle="Approved vs disputed — grouped by reasoning depth" accent="#ec4899" icon={Brain}>
            {isLoading ? (
              <EmptyChart msg="Loading…" />
            ) : verdictBars.every((r) => r.approved === 0 && r.disputed === 0) ? (
              <EmptyChart msg="No AI-evaluated jobs yet. Trigger auto_evaluate on a delivered job." />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={verdictBars} margin={{ top: 8, right: 16, bottom: 0, left: 0 }} barGap={4}>
                  <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: CHART_AXIS, fontSize: 10, fontFamily: '"JetBrains Mono"' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: CHART_AXIS, fontSize: 10, fontFamily: '"JetBrains Mono"' }} axisLine={false} tickLine={false} width={24} allowDecimals={false} />
                  <Tooltip content={(props: any) => <ChartTip {...props} />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "var(--text-muted)", fontFamily: '"JetBrains Mono"', paddingTop: 8 }} />
                  <Bar dataKey="approved" name="Approved" fill="#22c55e" radius={[4,4,0,0]} maxBarSize={40} />
                  <Bar dataKey="disputed" name="Disputed" fill="#ef4444" radius={[4,4,0,0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* 4. Resolution Time */}
          <ChartCard
            title="Resolution Time"
            subtitle="Hours from job posted → completed (last 20)"
            accent="#f59e0b"
            icon={Clock}
            note={resolutionLine.length === 0 && !isLoading ? "Requires completed jobs with timestamps." : undefined}
          >
            {isLoading ? (
              <EmptyChart msg="Loading…" />
            ) : resolutionLine.length === 0 ? (
              <EmptyChart msg="No completed jobs with timestamps yet." />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={resolutionLine} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: CHART_AXIS, fontSize: 10, fontFamily: '"JetBrains Mono"' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: CHART_AXIS, fontSize: 10, fontFamily: '"JetBrains Mono"' }} axisLine={false} tickLine={false} width={40} unit="h" />
                  <Tooltip content={(props: any) => <ChartTip {...props} unit="h" />} />
                  <Line type="monotone" dataKey="hours" name="Hours" stroke="#f59e0b" strokeWidth={2.5}
                    dot={{ r: 4, fill: "#f59e0b", strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: "#fbbf24", strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* ── Row 3: Top Categories ─────────────────────────────────────── */}
        <div className="mb-4">
          <ChartCard title="Top Job Categories" subtitle={`Keyword-matched from all ${allJobs.length} jobs`} accent="#fb923c" icon={BarChart2}>
            {isLoading ? (
              <EmptyChart msg="Loading…" />
            ) : categoryBars.length === 0 ? (
              <EmptyChart />
            ) : (
              <div className="px-4 py-3 space-y-3">
                {(() => {
                  const max = Math.max(...categoryBars.map((c) => c.count), 1);
                  return categoryBars.map(({ category, count }, i) => (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{category}</span>
                        <span className="text-[11px] font-bold" style={{ color: BAR_COLORS[i % BAR_COLORS.length], fontFamily: '"JetBrains Mono"' }}>
                          {count} {count === 1 ? "job" : "jobs"}
                        </span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-raised)" }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.round((count / max) * 100)}%`,
                            background: `linear-gradient(90deg, ${BAR_COLORS[i % BAR_COLORS.length]}bb, ${BAR_COLORS[i % BAR_COLORS.length]})`,
                            boxShadow: `0 0 8px ${BAR_COLORS[i % BAR_COLORS.length]}55`,
                          }}
                        />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </ChartCard>
        </div>

        {/* ── Raw data table ────────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{ background: "var(--surface-raised)", borderBottom: "1px solid var(--border-divider)" }}
          >
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4" style={{ color: "#a78bfa" }} />
              <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Raw Job Data</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(124,58,237,0.14)", border: "1px solid rgba(124,58,237,0.25)", color: "#c4b5fd", fontFamily: '"JetBrains Mono"' }}>
                {jobs.length} rows
              </span>
            </div>
            <button onClick={() => exportCSV(jobs)} className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "#7c3aed" }}>
              <Download className="w-3.5 h-3.5" /> Download CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-divider)" }}>
                  {["ID","Title","Status","Budget","Client","Deadline","Posted"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left font-bold uppercase tracking-wider whitespace-nowrap"
                      style={{ color: "var(--text-muted)", fontSize: 10, letterSpacing: "0.08em", background: "var(--surface-card)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...jobs].sort((a, b) => b.id - a.id).slice(0, 15).map((job, i) => (
                  <tr key={job.id} style={{ borderBottom: i < 14 ? "1px solid var(--border-divider)" : "none", background: i % 2 ? "rgba(255,255,255,0.008)" : "transparent" }}>
                    <td className="px-4 py-2.5 whitespace-nowrap" style={{ color: "#a78bfa", fontFamily: '"JetBrains Mono"' }}>#{job.id}</td>
                    <td className="px-4 py-2.5" style={{ maxWidth: 180 }}>
                      <span className="block truncate" style={{ color: "var(--text-secondary)" }}>{job.title}</span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ color: STATUS_COLOR[job.status], background: `${STATUS_COLOR[job.status]}18`, border: `1px solid ${STATUS_COLOR[job.status]}28` }}>
                        {job.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap" style={{ color: "var(--text-secondary)", fontFamily: '"JetBrains Mono"' }}>
                      {(job.budget / 1e18).toFixed(3)} GEN
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap" style={{ color: "var(--text-muted)", fontFamily: '"JetBrains Mono"' }}>
                      {job.client.slice(0,6)}…{job.client.slice(-4)}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                      {job.deadline ? new Date(job.deadline).toLocaleDateString("en-US",{ month:"short", day:"numeric", year:"2-digit"}) : "—"}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap" style={{ color: "var(--text-muted)", fontFamily: '"JetBrains Mono"' }}>
                      {job.created_at
                        ? new Date(toMs(job.created_at)).toLocaleDateString("en-US",{ month:"short", day:"numeric"})
                        : <span style={{ color: "var(--text-muted)" }}>—</span>
                      }
                    </td>
                  </tr>
                ))}
                {jobs.length === 0 && !isLoading && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center" style={{ color: "var(--text-muted)" }}>No jobs in selected range</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}
