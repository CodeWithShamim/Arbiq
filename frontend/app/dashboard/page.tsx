"use client";

import { Navbar } from "@/components/Navbar";
import { JobCard, JobCardSkeleton } from "@/components/JobCard";
import { useGetAllJobs, useGetMyJobs } from "@/hooks/useArbiqContract";
import { useAccount, useConnect } from "wagmi";
import { injected } from "@wagmi/connectors";
import { Button } from "@/components/ui/button";
import { formatBudget } from "@/lib/utils";
import { Briefcase, Wallet, AlertTriangle, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { isLoading } = useGetAllJobs();
  const { postedJobs, activeJobs } = useGetMyJobs(address);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        <Navbar />
        <main className="pt-24 flex flex-col items-center justify-center gap-6 px-4">
          <div className="text-center">
            <Wallet className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Connect Your Wallet</h1>
            <p className="text-gray-400 text-sm mb-6">
              Connect to view your posted jobs and active work.
            </p>
            <Button onClick={() => connect({ connector: injected() })}>
              Connect Wallet
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Stats
  const totalEarned = activeJobs
    .filter((j) => j.status === "completed")
    .reduce((sum, j) => sum + j.budget, 0);
  const totalSpent = postedJobs
    .filter((j) => j.status === "completed")
    .reduce((sum, j) => sum + j.budget, 0);
  const activeDisputes = [
    ...postedJobs,
    ...activeJobs,
  ].filter((j) => j.status === "disputed").length;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />

      <main className="pt-24 pb-16 px-4 md:px-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            {
              label: "Jobs Posted",
              value: postedJobs.length,
              icon: Briefcase,
              color: "purple",
            },
            {
              label: "Jobs Working On",
              value: activeJobs.length,
              icon: TrendingUp,
              color: "blue",
            },
            {
              label: "Total Earned",
              value: formatBudget(totalEarned),
              icon: Wallet,
              color: "green",
            },
            {
              label: "Active Disputes",
              value: activeDisputes,
              icon: AlertTriangle,
              color: activeDisputes > 0 ? "red" : "gray",
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07]"
            >
              <div className={`w-9 h-9 rounded-lg bg-${color}-500/10 flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 text-${color}-400`} />
              </div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Posted jobs */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Jobs I Posted</h2>
              <Link
                href="/jobs/new"
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                + Post new
              </Link>
            </div>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => <JobCardSkeleton key={i} />)}
              </div>
            ) : postedJobs.length > 0 ? (
              <div className="space-y-4">
                {[...postedJobs].reverse().map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <EmptyState message="You haven't posted any jobs yet." cta={{ href: "/jobs/new", label: "Post your first job" }} />
            )}
          </section>

          {/* Working on */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Jobs I&apos;m Working On</h2>
              <Link
                href="/jobs"
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                Browse jobs
              </Link>
            </div>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => <JobCardSkeleton key={i} />)}
              </div>
            ) : activeJobs.length > 0 ? (
              <div className="space-y-4">
                {[...activeJobs].reverse().map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <EmptyState message="You haven't taken any jobs yet." cta={{ href: "/jobs", label: "Find work" }} />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function EmptyState({
  message,
  cta,
}: {
  message: string;
  cta: { href: string; label: string };
}) {
  return (
    <div className="text-center py-12 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
      <p className="text-gray-500 text-sm mb-3">{message}</p>
      <Link
        href={cta.href}
        className="text-sm text-purple-400 hover:text-purple-300 underline transition-colors"
      >
        {cta.label}
      </Link>
    </div>
  );
}
