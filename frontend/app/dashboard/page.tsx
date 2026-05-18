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

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { isLoading } = useGetAllJobs();
  const { postedJobs, activeJobs } = useGetMyJobs(address);

  if (!isConnected) {
    return (
      <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
        <Navbar />
        <main className="pt-32 flex flex-col items-center justify-center px-4 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)" }}
          >
            <Wallet className="w-8 h-8" style={{ color: "#a78bfa" }} />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Connect Your Wallet</h1>
          <p className="text-sm mb-8 max-w-xs" style={{ color: "var(--text-muted)" }}>
            Connect to view your posted jobs, active work, and earnings.
          </p>
          <button
            onClick={() => openConnectModal?.()}
            className="btn-primary px-7 py-3 rounded-xl text-white font-bold"
          >
            Connect Wallet
          </button>
        </main>
      </div>
    );
  }

  const totalEarned = activeJobs.filter((j) => j.status === "completed").reduce((s, j) => s + j.budget, 0);
  const totalSpent  = postedJobs.filter((j) => j.status === "completed").reduce((s, j) => s + j.budget, 0);
  const disputes = [...postedJobs, ...activeJobs].filter((j) => j.status === "disputed").length;

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
        <div className="orb orb-violet absolute w-96 h-96 -top-32 right-0 opacity-20" />
        <div className="max-w-6xl mx-auto relative z-10">
          <p className="label mb-2" style={{ color: "#7c3aed" }}>Overview</p>
          <h1 className="headline" style={{ color: "var(--text-primary)" }}>Dashboard</h1>
        </div>
      </div>

      <main className="px-4 md:px-8 py-8 max-w-6xl mx-auto">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 stagger">
          {stats.map(({ label, value, icon: Icon, accent, glow }) => (
            <AnimatedStatCard key={label} label={label} value={value} Icon={Icon} accent={accent} glow={glow} />
          ))}
        </div>

        {/* Two-column jobs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
  // Animate if the value is a plain number; leave budget strings as-is
  const numeric = parseFloat(value.replace(/[^\d.]/g, ""));
  const isNum   = !isNaN(numeric) && value === String(Math.round(numeric));
  const counted = useCountUp(isNum ? numeric : 0, 900, isNum);
  const display = isNum ? String(counted) : value;

  return (
    <div
      className="anim-fade-up p-5 rounded-2xl relative overflow-hidden"
      style={{ background: "var(--glass-bg)", border: "1px solid var(--border-subtle)" }}
    >
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{ background: `radial-gradient(ellipse at top left, ${glow} 0%, transparent 60%)` }}
      />
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-4 relative z-10"
        style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
      >
        <Icon className="w-4 h-4" style={{ color: accent }} strokeWidth={1.8} />
      </div>
      <p
        className="text-2xl font-extrabold mb-0.5 relative z-10 tracking-tight tabular-nums"
        style={{ color: "var(--text-primary)" }}
      >
        {display}
      </p>
      <p className="text-xs relative z-10" style={{ color: "var(--text-muted)" }}>{label}</p>
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>{title}</h2>
        <Link
          href={headerLink.href}
          className="flex items-center gap-1 text-xs font-semibold transition-colors"
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
          className="text-center py-14 rounded-2xl"
          style={{
            background: "var(--surface-subtle)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>{emptyMsg}</p>
          <Link
            href={emptyLink.href}
            className="text-sm font-semibold transition-colors"
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
