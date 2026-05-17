"use client";

import Link from "next/link";
import { Job } from "@/lib/types";
import { truncateAddress, formatBudget, formatDeadline } from "@/lib/utils";
import { StatusBadge } from "./ui/badge";
import { Calendar, User, ArrowUpRight } from "lucide-react";

export function JobCard({ job }: { job: Job }) {
  return (
    <Link href={`/jobs/${job.id}`} className="block group">
      <div
        className="card-lift rounded-2xl p-5 h-full flex flex-col relative overflow-hidden cursor-pointer"
        style={{
          background: "var(--glass-bg)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {/* Hover glow */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
          style={{ background: "radial-gradient(ellipse at top left, rgba(124,58,237,0.08) 0%, transparent 60%)" }}
        />

        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3 relative z-10">
          <StatusBadge status={job.status} />
          <ArrowUpRight
            className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            style={{ color: "#a78bfa" }}
          />
        </div>

        {/* Title */}
        <h3
          className="font-bold text-base leading-snug mb-2 line-clamp-2 relative z-10 transition-colors duration-200"
          style={{ color: "var(--text-primary)" }}
        >
          {job.title}
        </h3>

        {/* Description */}
        <p className="text-sm line-clamp-2 mb-4 relative z-10 leading-relaxed flex-1" style={{ color: "var(--text-muted)" }}>
          {job.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between relative z-10 pt-3" style={{ borderTop: "1px solid var(--border-divider)" }}>
          <span
            className="text-sm font-bold font-mono"
            style={{ color: "#a78bfa" }}
          >
            {formatBudget(job.budget)}
          </span>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
              <Calendar className="w-3 h-3" />
              {formatDeadline(job.deadline)}
            </span>
            <span className="flex items-center gap-1 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              <User className="w-3 h-3" />
              {truncateAddress(job.client)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function JobCardSkeleton() {
  return (
    <div
      className="rounded-2xl p-5 h-[180px]"
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div className="space-y-3">
        <div className="flex justify-between">
          <div className="shimmer h-5 w-16 rounded-full" />
          <div className="shimmer h-5 w-5 rounded" />
        </div>
        <div className="shimmer h-5 w-3/4" />
        <div className="shimmer h-4 w-full" />
        <div className="shimmer h-4 w-2/3" />
        <div className="flex justify-between pt-2">
          <div className="shimmer h-4 w-20" />
          <div className="shimmer h-4 w-24" />
        </div>
      </div>
    </div>
  );
}
