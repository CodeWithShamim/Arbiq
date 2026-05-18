"use client";

import { Navbar } from "@/components/Navbar";
import { JobCard, JobCardSkeleton } from "@/components/JobCard";
import { useGetAllJobs, useGetMyJobs } from "@/hooks/useArbiqContract";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { formatBudget } from "@/lib/utils";
import { Briefcase, Wallet, AlertTriangle, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useCountUp } from "@/hooks/useCountUp";
import { Footer } from "@/components/Footer";
import { PostJobFAB } from "@/components/PostJobFAB";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { isLoading } = useGetAllJobs();
  const { postedJobs, activeJobs } = useGetMyJobs(address);

  if (!isConnected) {
    return (
      <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
        <Navbar />
        <main className="pt-40 flex flex-col items-center justify-center px-4 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8"
            style={{ background: "rgba(124,58,237,0.10)", border: "1px solid rgba(124,58,237,0.22)" }}
          >
            <Wallet className="w-7 h-7" style={{ color: "#a78bfa" }} />
          </div>
          <h1
            className="font-display text-5xl mb-3"
            style={{ color: "var(--text-primary)", letterSpacing: "0.04em" }}
          >
            CONNECT
          </h1>
          <p className="text-sm mb-8 max-w-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Connect your wallet to view posted jobs, active work, and earnings.
          </p>
          <button
            onClick={() => openConnectModal?.()}
            className="btn-primary px-8 py-3 rounded-xl text-white font-bold"
          >
            Connect Wallet
          </button>
        </main>
      </div>
    );
  }

  const totalEarned = activeJobs.filter((j) => j.status === "completed").reduce((s, j) => s + j.budget, 0);
  const disputes    = [...postedJobs, ...activeJobs].filter((j) => j.status === "disputed").length;

  const stats = [
    { label: "Jobs Posted",     value: String(postedJobs.length), icon: Briefcase,     accent: "#7c3aed", glow: "rgba(124,58,237,0.12)" },
    { label: "Working On",      value: String(activeJobs.length), icon: TrendingUp,    accent: "#38bdf8", glow: "rgba(56,189,248,0.10)" },
    { label: "Total Earned",    value: formatBudget(totalEarned), icon: Wallet,        accent: "#22c55e", glow: "rgba(34,197,94,0.10)" },
    { label: "Active Disputes", value: String(disputes),          icon: AlertTriangle, accent: disputes > 0 ? "#ef4444" : "#5a5a7a", glow: disputes > 0 ? "rgba(239,68,68,0.10)" : "transparent" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <Navbar />

      {/* Header */}
      <div
        className="pt-24 pb-10 px-4 md:px-8 relative overflow-hidden"
        style={{ borderBottom: "1px solid var(--border-page)" }}
      >
        <div className="dot-grid opacity-40" style={{ bottom: 'auto', height: '100%' }} />
        <div className="orb orb-violet absolute w-80 h-80 -top-24 right-0 opacity-20 pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <p className="label mb-3" style={{ color: "#7c3aed" }}>Overview</p>
          <h1 className="font-display text-6xl" style={{ color: "var(--text-primary)", letterSpacing: "0.04em" }}>
            DASHBOARD
          </h1>
        </div>
      </div>

      <main className="px-4 md:px-8 py-10 max-w-6xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 stagger">
          {stats.map(({ label, value, icon: Icon, accent, glow }) => (
            <AnimatedStatCard key={label} label={label} value={value} Icon={Icon} accent={accent} glow={glow} />
          ))}
        </div>

        {/* Two-column jobs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <JobColumn
            title="Jobs I Posted"
            jobs={postedJobs}
            isLoading={isLoading}
            emptyMsg="No jobs posted yet."
            emptyLink={{ href: "/jobs/new", label: "Post your first job" }}
            headerLink={{ href: "/jobs/new", label: "+ Post new" }}
          />
          <JobColumn
            title="Jobs I'm Working On"
            jobs={activeJobs}
            isLoading={isLoading}
            emptyMsg="You haven't taken any jobs yet."
            emptyLink={{ href: "/jobs", label: "Browse open jobs" }}
            headerLink={{ href: "/jobs", label: "Browse jobs" }}
          />
        </div>
      </main>
      <Footer />
      <PostJobFAB />
    </div>
  );
}

function AnimatedStatCard({
  label, value, Icon, accent, glow,
}: {
  label: string;
  value: string;
  Icon: React.ElementType;
  accent: string;
  glow: string;
}) {
  const numeric = parseFloat(value.replace(/[^\d.]/g, ""));
  const isNum   = !isNaN(numeric) && value === String(Math.round(numeric));
  const counted = useCountUp(isNum ? numeric : 0, 900, isNum);
  const display = isNum ? String(counted) : value;

  return (
    <div
      className="anim-fade-up p-6 rounded-2xl relative overflow-hidden"
      style={{ background: "var(--glass-bg)", border: "1px solid var(--border-subtle)" }}
    >
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{ background: `radial-gradient(ellipse at top left, ${glow} 0%, transparent 65%)` }}
      />
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-4 relative z-10"
        style={{ background: `${accent}14`, border: `1px solid ${accent}28` }}
      >
        <Icon className="w-4 h-4" style={{ color: accent }} strokeWidth={1.8} />
      </div>
      <p
        className="text-2xl font-black mb-0.5 relative z-10 tracking-tight tabular-nums"
        style={{ color: "var(--text-primary)", fontFamily: '"JetBrains Mono", monospace' }}
      >
        {display}
      </p>
      <p className="text-xs font-semibold relative z-10" style={{ color: "var(--text-muted)", letterSpacing: '0.06em' }}>
        {label.toUpperCase()}
      </p>
    </div>
  );
}

function JobColumn({
  title, jobs, isLoading, emptyMsg, emptyLink, headerLink,
}: {
  title: string;
  jobs: ReturnType<typeof useGetMyJobs>["postedJobs"];
  isLoading: boolean;
  emptyMsg: string;
  emptyLink: { href: string; label: string };
  headerLink: { href: string; label: string };
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-sm" style={{ color: "var(--text-primary)", letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {title}
        </h2>
        <Link
          href={headerLink.href}
          className="flex items-center gap-1 text-xs font-bold transition-colors"
          style={{ color: "#7c3aed" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#a78bfa"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#7c3aed"; }}
        >
          {headerLink.label}
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <JobCardSkeleton key={i} />)}
        </div>
      ) : jobs.length > 0 ? (
        <div className="space-y-3 stagger">
          {[...jobs].reverse().map((job, i) => (
            <div key={job.id} className="anim-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <JobCard job={job} />
            </div>
          ))}
        </div>
      ) : (
        <div
          className="text-center py-16 rounded-2xl"
          style={{ background: "var(--surface-subtle)", border: "1px solid var(--border-subtle)" }}
        >
          <p className="text-sm mb-3 font-medium" style={{ color: "var(--text-muted)" }}>{emptyMsg}</p>
          <Link
            href={emptyLink.href}
            className="text-sm font-bold transition-colors"
            style={{ color: "#7c3aed" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#a78bfa"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#7c3aed"; }}
          >
            {emptyLink.label} →
          </Link>
        </div>
      )}
    </section>
  );
}
