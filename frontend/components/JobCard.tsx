"use client";

import Link from "next/link";
import { Job } from "@/lib/types";
import { truncateAddress, formatBudget } from "@/lib/utils";
import { StatusBadge } from "./ui/badge";
import { Calendar, User, ArrowUpRight, Clock, AlertTriangle } from "lucide-react";

function useDeadlineInfo(deadline: string) {
  const now  = Date.now();
  const due  = new Date(deadline).getTime();
  const diff = due - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (diff < 0)      return { label: "Overdue",         urgent: true,  color: "#ef4444" };
  if (days <= 2)     return { label: `${days}d left`,   urgent: true,  color: "#f59e0b" };
  if (days <= 7)     return { label: `${days}d left`,   urgent: false, color: "#fb923c" };
  return               { label: `${days}d left`,         urgent: false, color: "var(--text-muted)" };
}

export function JobCard({ job }: { job: Job }) {
  const dl = useDeadlineInfo(job.deadline);

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
        <div className="relative z-10 pt-3 space-y-2.5" style={{ borderTop: "1px solid var(--border-divider)" }}>
          {/* Budget row */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold font-mono" style={{ color: "#a78bfa" }}>
              {formatBudget(job.budget)}
            </span>
            <span className="flex items-center gap-1 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              <User className="w-3 h-3" />
              {truncateAddress(job.client)}
            </span>
          </div>

          {/* Deadline pill */}
          <div className="flex items-center justify-between">
            <span
              className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                color: dl.color,
                background: dl.urgent ? `${dl.color}18` : "transparent",
                border: dl.urgent ? `1px solid ${dl.color}30` : "none",
              }}
            >
              {dl.urgent ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              {dl.label}
            </span>
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
              <Calendar className="w-3 h-3" />
              {new Date(job.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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
      className="rounded-2xl p-5 h-[196px]"
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
        <div className="flex justify-between">
          <div className="shimmer h-4 w-16 rounded-full" />
          <div className="shimmer h-4 w-16" />
        </div>
      </div>
    </div>
  );
}
