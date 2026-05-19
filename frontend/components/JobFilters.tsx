"use client";

import { useEffect, useRef, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Clock,
  CalendarDays,
} from "lucide-react";
import type { JobFilters, SortKey, DeadlineRange } from "@/hooks/useJobs";
import type { JobStatus } from "@/lib/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: { value: JobStatus | "all"; label: string; dot: string }[] = [
  { value: "all",       label: "All",       dot: "#a78bfa" },
  { value: "open",      label: "Open",      dot: "#38bdf8" },
  { value: "active",    label: "Active",    dot: "#f59e0b" },
  { value: "delivered", label: "Delivered", dot: "#fb923c" },
  { value: "completed", label: "Completed", dot: "#22c55e" },
  { value: "disputed",  label: "Disputed",  dot: "#ef4444" },
];

const DEADLINE_OPTIONS: { value: DeadlineRange; label: string }[] = [
  { value: "any",       label: "Any deadline" },
  { value: "this-week", label: "This week"    },
  { value: "this-month",label: "This month"   },
];

const SORT_OPTIONS: { key: SortKey; label: string; icon: React.ReactNode }[] = [
  { key: "newest",      label: "Newest first",       icon: <Clock className="w-3.5 h-3.5" /> },
  { key: "oldest",      label: "Oldest first",       icon: <Clock className="w-3.5 h-3.5 opacity-50" /> },
  { key: "budget-desc", label: "Budget: High → Low", icon: <TrendingDown className="w-3.5 h-3.5" /> },
  { key: "budget-asc",  label: "Budget: Low → High", icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { key: "deadline",    label: "Deadline soonest",   icon: <CalendarDays className="w-3.5 h-3.5" /> },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatGEN(wei: number): string {
  if (wei === 0) return "0";
  const gen = wei / 1e18;
  if (gen >= 1000) return `${(gen / 1000).toFixed(1)}k`;
  if (gen >= 1) return gen.toFixed(2).replace(/\.?0+$/, "");
  return gen.toExponential(2);
}

export function activeFilterCount(f: JobFilters, budgetCeiling: number): number {
  let n = 0;
  if (!f.status.includes("all")) n++;
  if (f.budgetMin > 0 || f.budgetMax < budgetCeiling) n++;
  if (f.deadline !== "any") n++;
  if (f.search.trim()) n++;
  return n;
}

// ── Dual-range slider ─────────────────────────────────────────────────────────

interface RangeSliderProps {
  min: number;
  max: number;
  low: number;
  high: number;
  onChange: (low: number, high: number) => void;
}

function RangeSlider({ min, max, low, high, onChange }: RangeSliderProps) {
  const range = max - min || 1;
  const leftPct  = ((low  - min) / range) * 100;
  const rightPct = ((high - min) / range) * 100;

  return (
    <div className="px-1">
      <div className="relative h-1.5 rounded-full mb-4" style={{ background: "var(--border-mid)" }}>
        <div
          className="absolute h-full rounded-full"
          style={{
            left: `${leftPct}%`,
            right: `${100 - rightPct}%`,
            background: "linear-gradient(90deg,#7c3aed,#a78bfa)",
          }}
        />
      </div>
      <div className="relative" style={{ height: 0 }}>
        <input
          type="range" min={min} max={max} value={low}
          onChange={(e) => onChange(Math.min(Number(e.target.value), high), high)}
          className="range-thumb absolute w-full"
          style={{ top: -28, zIndex: low > max - (max - min) * 0.1 ? 5 : 3 }}
        />
        <input
          type="range" min={min} max={max} value={high}
          onChange={(e) => onChange(low, Math.max(Number(e.target.value), low))}
          className="range-thumb absolute w-full"
          style={{ top: -28, zIndex: 4 }}
        />
      </div>
      <div className="flex justify-between mt-2 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
        <span>{formatGEN(low)} GEN</span>
        <span>{high >= max ? "∞" : formatGEN(high) + " GEN"}</span>
      </div>
    </div>
  );
}

// ── Collapsible section ───────────────────────────────────────────────────────

function Section({ title, children, defaultOpen = true }: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: "1px solid var(--border-divider)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-3 text-xs font-bold tracking-widest transition-colors"
        style={{ color: "var(--text-secondary)", letterSpacing: "0.08em" }}
      >
        {title}
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

// ── Shared filter panel (used by both sidebar and bottom sheet) ───────────────

interface FilterPanelProps {
  filters: JobFilters;
  onChange: (patch: Partial<JobFilters>) => void;
  onClear: () => void;
  budgetCeiling: number;
  statusCounts: Record<string, number>;
}

function FilterPanel({ filters, onChange, onClear, budgetCeiling, statusCounts }: FilterPanelProps) {
  const ceiling = budgetCeiling || 1000;
  const activeCount = activeFilterCount(filters, ceiling);

  function toggleStatus(val: JobStatus | "all") {
    if (val === "all") { onChange({ status: ["all"] }); return; }
    const curr = filters.status.filter((s) => s !== "all");
    const next = curr.includes(val) ? curr.filter((s) => s !== val) : [...curr, val];
    onChange({ status: next.length ? next : ["all"] });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--text-primary)" }}>
          <SlidersHorizontal className="w-4 h-4" style={{ color: "#7c3aed" }} />
          Filters
          {activeCount > 0 && (
            <span
              className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
              style={{ background: "#7c3aed", color: "white" }}
            >
              {activeCount}
            </span>
          )}
        </span>
        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="text-xs font-semibold transition-colors"
            style={{ color: "#f87171" }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Status */}
      <Section title="STATUS">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_CONFIG.map(({ value, label, dot }) => {
            const active = filters.status.includes(value);
            const count  = statusCounts[value] ?? 0;
            return (
              <button
                key={value}
                onClick={() => toggleStatus(value)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                style={
                  active
                    ? { background: `${dot}22`, border: `1px solid ${dot}55`, color: dot }
                    : { background: "var(--surface-raised)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }
                }
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dot }} />
                {label}
                {count > 0 && (
                  <span
                    className="text-[10px] px-1 rounded"
                    style={{
                      background: active ? `${dot}33` : "var(--surface-card)",
                      color:      active ? dot        : "var(--text-muted)",
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Budget */}
      <Section title="BUDGET (GEN)">
        <RangeSlider
          min={0}
          max={ceiling}
          low={filters.budgetMin}
          high={filters.budgetMax === Infinity ? ceiling : filters.budgetMax}
          onChange={(lo, hi) =>
            onChange({ budgetMin: lo, budgetMax: hi >= ceiling ? Infinity : hi })
          }
        />
      </Section>

      {/* Deadline */}
      <Section title="DEADLINE" defaultOpen={false}>
        <div className="flex flex-col gap-1.5">
          {DEADLINE_OPTIONS.map(({ value, label }) => {
            const active = filters.deadline === value;
            return (
              <button
                key={value}
                onClick={() => onChange({ deadline: value })}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all"
                style={
                  active
                    ? { background: "rgba(124,58,237,0.18)", border: "1px solid rgba(124,58,237,0.4)", color: "#c4b5fd" }
                    : { background: "var(--surface-raised)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }
                }
              >
                <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                {label}
              </button>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

// ── JobFilterSidebar — sticky left panel (desktop only) ───────────────────────

export function JobFilterSidebar(props: FilterPanelProps) {
  return (
    <aside
      className="hidden lg:block w-56 flex-shrink-0"
    >
      <div
        className="rounded-2xl p-4 sticky top-[76px]"
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border-subtle)",
          maxHeight: "calc(100vh - 100px)",
          overflowY: "auto",
        }}
      >
        <FilterPanel {...props} />
      </div>
    </aside>
  );
}

// ── JobFilterBar — search + sort + mobile sheet trigger ───────────────────────

interface JobFilterBarProps extends FilterPanelProps {
  totalCount: number;
  filteredCount: number;
}

export function JobFilterBar({
  filters,
  onChange,
  onClear,
  budgetCeiling,
  statusCounts,
  totalCount,
  filteredCount,
}: JobFilterBarProps) {
  const [rawSearch, setRawSearch] = useState(filters.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    debounceRef.current && clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onChange({ search: rawSearch }), 300);
    return () => { debounceRef.current && clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawSearch]);

  // Sync external clear
  useEffect(() => {
    if (!filters.search) setRawSearch("");
  }, [filters.search]);

  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetRef   = useRef<HTMLDivElement>(null);
  const sortRef    = useRef<HTMLDivElement>(null);
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    if (!sheetOpen) return;
    const handle = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) setSheetOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [sheetOpen]);

  useEffect(() => {
    if (!sortOpen) return;
    const handle = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [sortOpen]);

  const ceiling     = budgetCeiling || 1000;
  const activeCount = activeFilterCount(filters, ceiling);
  const currentSort = SORT_OPTIONS.find((s) => s.key === filters.sort) ?? SORT_OPTIONS[0];

  return (
    <>
      {/* Top bar */}
      <div className="flex items-center gap-2 mb-3 w-full">
        {/* Search */}
        <div className="relative" style={{ flex: "1 1 0", minWidth: 0 }}>
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: "#5a5a7a" }}
          />
          <input
            type="text"
            placeholder="Search jobs…"
            value={rawSearch}
            onChange={(e) => setRawSearch(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              minWidth: 0,
              height: "44px",
              paddingLeft: "2.5rem",
              paddingRight: rawSearch ? "2.25rem" : "1rem",
              background: "var(--input-bg)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
              borderRadius: "12px",
              fontSize: "0.9375rem",
              fontFamily: '"Darker Grotesque", system-ui, sans-serif',
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#7c3aed";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border-subtle)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          {rawSearch && (
            <button
              onClick={() => { setRawSearch(""); onChange({ search: "" }); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center rounded"
              style={{ color: "var(--text-muted)" }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Mobile: filter sheet trigger */}
        <button
          onClick={() => setSheetOpen(true)}
          className="lg:hidden flex items-center gap-2 px-3.5 h-11 rounded-xl text-sm font-semibold flex-shrink-0 transition-all"
          style={{
            background: activeCount > 0 ? "rgba(124,58,237,0.15)" : "var(--surface-raised)",
            border: `1px solid ${activeCount > 0 ? "rgba(124,58,237,0.4)" : "var(--border-subtle)"}`,
            color: activeCount > 0 ? "#c4b5fd" : "var(--text-secondary)",
          }}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
          {activeCount > 0 && (
            <span
              className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
              style={{ background: "#7c3aed", color: "white" }}
            >
              {activeCount}
            </span>
          )}
        </button>

        {/* Sort dropdown */}
        <div className="relative flex-shrink-0" ref={sortRef}>
          <button
            onClick={() => setSortOpen((v) => !v)}
            className="flex items-center gap-2 px-3.5 h-11 rounded-xl text-sm font-semibold transition-all whitespace-nowrap"
            style={{
              background: sortOpen ? "rgba(124,58,237,0.15)" : "var(--surface-raised)",
              border: `1px solid ${sortOpen ? "rgba(124,58,237,0.35)" : "var(--border-subtle)"}`,
              color: sortOpen ? "#c4b5fd" : "var(--text-secondary)",
            }}
          >
            <ArrowUpDown className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hidden sm:inline">{currentSort.label}</span>
            <span className="sm:hidden">Sort</span>
          </button>
          {sortOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden z-30 anim-scale-in"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-mid)",
                boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
              }}
            >
              {SORT_OPTIONS.map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => { onChange({ sort: key }); setSortOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors"
                  style={{
                    color:      filters.sort === key ? "#a78bfa" : "var(--text-secondary)",
                    background: filters.sort === key ? "rgba(124,58,237,0.1)" : "transparent",
                    fontWeight: filters.sort === key ? 600 : 400,
                  }}
                >
                  {icon}{label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop: clear all inline */}
        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="hidden lg:flex items-center gap-1.5 px-3 h-11 rounded-xl text-xs font-bold flex-shrink-0 transition-all"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.22)",
              color: "#f87171",
            }}
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Result line */}
      <div className="flex items-center justify-between mb-5 min-h-[18px]">
        <p className="text-xs font-semibold" style={{ color: "var(--text-muted)", letterSpacing: "0.06em" }}>
          {filteredCount > 0
            ? `SHOWING ${filteredCount} OF ${totalCount} JOB${totalCount !== 1 ? "S" : ""}`
            : totalCount > 0
            ? "NO JOBS MATCH YOUR FILTERS"
            : ""}
        </p>
        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="lg:hidden flex items-center gap-1 text-xs font-bold"
            style={{ color: "#f87171" }}
          >
            <X className="w-3 h-3" />
            Clear filters
          </button>
        )}
      </div>

      {/* Mobile bottom sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={() => setSheetOpen(false)}
          />
          <div
            ref={sheetRef}
            className="absolute bottom-0 left-0 right-0 rounded-t-3xl overflow-hidden"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-mid)",
              maxHeight: "85dvh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              className="px-5 pt-4 pb-3 flex-shrink-0"
              style={{ borderBottom: "1px solid var(--border-divider)" }}
            >
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "var(--border-mid)" }} />
              <div className="flex items-center justify-between">
                <span className="font-bold" style={{ color: "var(--text-primary)" }}>
                  Filters
                  {activeCount > 0 && (
                    <span
                      className="ml-2 px-1.5 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: "#7c3aed", color: "white" }}
                    >
                      {activeCount}
                    </span>
                  )}
                </span>
                <button onClick={() => setSheetOpen(false)} style={{ color: "var(--text-muted)" }}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-2">
              <FilterPanel
                filters={filters}
                onChange={onChange}
                onClear={onClear}
                budgetCeiling={ceiling}
                statusCounts={statusCounts}
              />
            </div>
            <div
              className="px-5 py-4 flex gap-3 flex-shrink-0"
              style={{ borderTop: "1px solid var(--border-divider)" }}
            >
              {activeCount > 0 && (
                <button
                  onClick={onClear}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.22)",
                    color: "#f87171",
                  }}
                >
                  Clear all
                </button>
              )}
              <button
                onClick={() => setSheetOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white btn-primary"
              >
                Show {filteredCount} job{filteredCount !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
