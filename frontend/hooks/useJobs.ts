"use client";

import { useMemo } from "react";
import { useGetAllJobs } from "@/hooks/useArbiqContract";
import type { Job, JobStatus } from "@/lib/types";

export type SortKey =
  | "newest"
  | "oldest"
  | "budget-desc"
  | "budget-asc"
  | "deadline";

export type DeadlineRange = "any" | "this-week" | "this-month";

export interface JobFilters {
  status: (JobStatus | "all")[];
  budgetMin: number;
  budgetMax: number;
  deadline: DeadlineRange;
  search: string;
  sort: SortKey;
}

export const DEFAULT_FILTERS: JobFilters = {
  status: ["all"],
  budgetMin: 0,
  budgetMax: Infinity,
  deadline: "any",
  search: "",
  sort: "newest",
};

// ── Category detection ────────────────────────────────────────────────────────

const CATEGORY_PATTERNS: [string, RegExp][] = [
  ["Smart Contract", /smart.?contract|solidity|evm|defi|blockchain|web3|nft|token/i],
  ["Frontend",       /react|nextjs|next\.js|vue|angular|svelte|ui\/ux|frontend|tailwind|css|html/i],
  ["Backend",        /node|express|django|fastapi|rest.?api|graphql|backend|server|database|postgres|mysql|mongodb/i],
  ["Mobile",         /ios|android|react.?native|flutter|swift|kotlin|mobile.?app/i],
  ["Design",         /design|figma|logo|branding|illustrat|photoshop|ux|ui design|graphic/i],
  ["Data / AI",      /machine.?learning|ai|llm|data.?science|python|analytics|model|nlp/i],
  ["Writing",        /writing|copywriting|content|article|blog|documentation|technical.?writ/i],
  ["DevOps",         /devops|docker|kubernetes|ci\/cd|aws|gcp|azure|cloud|infra|deployment/i],
];

export function detectCategory(job: Job): string {
  const haystack = `${job.title} ${job.description}`;
  for (const [label, re] of CATEGORY_PATTERNS) {
    if (re.test(haystack)) return label;
  }
  return "Other";
}

// ── Deadline filter ───────────────────────────────────────────────────────────

function deadlineInRange(deadline: string, range: DeadlineRange): boolean {
  if (range === "any") return true;
  const due = new Date(deadline).getTime();
  const now = Date.now();
  if (range === "this-week")  return due <= now + 7  * 86_400_000;
  if (range === "this-month") return due <= now + 30 * 86_400_000;
  return true;
}

// ── Main hook — reads from the shared TanStack Query cache ────────────────────

export function useJobs(filters: JobFilters) {
  // Shares the ["arbiq","allJobs"] cache with every other useGetAllJobs() caller.
  // TanStack Query deduplicates concurrent fetches — only one gen_call fires.
  const { data: allJobs = [], isLoading, error, refetch } = useGetAllJobs();

  const budgetCeiling = useMemo(
    () => (allJobs.length ? Math.max(...allJobs.map((j) => j.budget)) : 1000),
    [allJobs],
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    allJobs.forEach((j) => set.add(detectCategory(j)));
    return Array.from(set).sort();
  }, [allJobs]);

  const filteredJobs = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const statusSet = new Set(filters.status);
    const anyStatus = statusSet.has("all");

    return allJobs
      .filter((j) => {
        if (!anyStatus && !statusSet.has(j.status)) return false;
        if (j.budget < filters.budgetMin) return false;
        if (filters.budgetMax !== Infinity && j.budget > filters.budgetMax) return false;
        if (!deadlineInRange(j.deadline, filters.deadline)) return false;
        if (q && !j.title.toLowerCase().includes(q) && !j.description.toLowerCase().includes(q))
          return false;
        return true;
      })
      .slice()
      .sort((a, b) => {
        switch (filters.sort) {
          case "newest":      return b.id - a.id;
          case "oldest":      return a.id - b.id;
          case "budget-desc": return b.budget - a.budget;
          case "budget-asc":  return a.budget - b.budget;
          case "deadline":    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
      });
  }, [allJobs, filters]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allJobs.length };
    allJobs.forEach((j) => {
      counts[j.status] = (counts[j.status] ?? 0) + 1;
    });
    return counts;
  }, [allJobs]);

  return {
    allJobs,
    filteredJobs,
    isLoading,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    refetch,
    budgetCeiling,
    categories,
    statusCounts,
  };
}
