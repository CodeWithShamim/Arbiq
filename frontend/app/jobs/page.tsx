"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { JobCard, JobCardSkeleton } from "@/components/JobCard";
import { useGetAllJobs } from "@/hooks/useArbiqContract";
import { JobStatus } from "@/lib/types";
import Link from "next/link";
import { PlusCircle, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const FILTERS: { label: string; value: JobStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Active", value: "active" },
  { label: "Delivered", value: "delivered" },
  { label: "Completed", value: "completed" },
  { label: "Disputed", value: "disputed" },
];

export default function BrowseJobsPage() {
  const { data: jobs = [], isLoading } = useGetAllJobs();
  const [filter, setFilter] = useState<JobStatus | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = jobs
    .filter((j) => filter === "all" || j.status === filter)
    .filter(
      (j) =>
        !search ||
        j.title.toLowerCase().includes(search.toLowerCase()) ||
        j.description.toLowerCase().includes(search.toLowerCase())
    )
    .slice()
    .reverse(); // newest first

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />

      <main className="pt-24 pb-16 px-4 md:px-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Browse Jobs</h1>
            <p className="text-gray-400 text-sm mt-1">
              {jobs.length} job{jobs.length !== 1 ? "s" : ""} posted
            </p>
          </div>
          <Link
            href="/jobs/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Post a Job
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap mb-8">
          {FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                filter === value
                  ? "bg-purple-600 text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Job grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <JobCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 text-gray-500">
            <p className="text-lg mb-2">No jobs found</p>
            <p className="text-sm">
              {filter !== "all"
                ? "Try changing the filter"
                : "Be the first to post a job!"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
