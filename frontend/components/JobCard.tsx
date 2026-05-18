"use client";

import Link from "next/link";
import { Job } from "@/lib/types";
import { truncateAddress, formatBudget } from "@/lib/utils";
import { StatusBadge } from "./ui/badge";
import { Calendar, User, ArrowUpRight, Clock, AlertTriangle, Heart } from "lucide-react";
import { useLocalFavorites } from "@/hooks/useLocalFavorites";

function useDeadlineInfo(deadline: string) {
  const now  = Date.now();
  const due  = new Date(deadline).getTime();
  const diff = due - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (diff < 0)  return { label: "Overdue",       urgent: true,  color: "#ef4444" };
  if (days <= 2) return { label: `${days}d left`,  urgent: true,  color: "#f59e0b" };
  if (days <= 7) return { label: `${days}d left`,  urgent: false, color: "#fb923c" };
  return           { label: `${days}d left`,        urgent: false, color: "var(--text-muted)" };
}

function isNewJob(createdAt: string) {
  const created = new Date(createdAt).getTime();
  const ageHours = (Date.now() - created) / (1000 * 60 * 60);
  return ageHours < 48;
}

export function JobCard({ job }: { job: Job }) {
  const dl = useDeadlineInfo(job.deadline);
  const { isFavorite, toggle } = useLocalFavorites();
  const fav = isFavorite(job.id);
  const isNew = job.created_at ? isNewJob(job.created_at) : false;

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
          style={{ background: "radial-gradient(ellipse at top left, rgba(124,58,237,0.09) 0%, transparent 65%)" }}
        />

        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-3 relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={job.status} />
            {isNew && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  background: "rgba(124,58,237,0.18)",
                  border: "1px solid rgba(124,58,237,0.35)",
                  color: "#c4b5fd",
                  letterSpacing: "0.06em",
                }}
              >
                NEW
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Favorite button */}
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(job.id); }}
              title={fav ? "Remove from favorites" : "Save to favorites"}
              className="w-6 h-6 flex items-center justify-center rounded-md transition-all duration-200 opacity-0 group-hover:opacity-100"
              style={{
                background: fav ? "rgba(239,68,68,0.12)" : "var(--surface-raised)",
                border: `1px solid ${fav ? "rgba(239,68,68,0.28)" : "var(--border-subtle)"}`,
                color: fav ? "#f87171" : "var(--text-muted)",
              }}
            >
              <Heart className="w-3 h-3" fill={fav ? "currentColor" : "none"} />
            </button>
            <ArrowUpRight
              className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              style={{ color: "#a78bfa" }}
            />
          </div>
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
            <span
              className="text-sm font-bold"
              style={{ color: "#a78bfa", fontFamily: '"JetBrains Mono", monospace' }}
            >
              {formatBudget(job.budget)}
            </span>
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: "var(--text-muted)", fontFamily: '"JetBrains Mono", monospace' }}
            >
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
