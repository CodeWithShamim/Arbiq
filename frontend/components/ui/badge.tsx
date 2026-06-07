import { cn } from "@/lib/utils";
import type { JobStatus } from "@/lib/types";

const statusConfig: Record<JobStatus, { label: string; dot: string; style: React.CSSProperties }> = {
  open: {
    label: "Open",
    dot: "#38bdf8",
    style: { background: "rgba(56,189,248,0.10)", border: "1px solid rgba(56,189,248,0.25)", color: "#7dd3fc" },
  },
  active: {
    label: "In Progress",
    dot: "#f59e0b",
    style: { background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.25)", color: "#fcd34d" },
  },
  delivered: {
    label: "Delivered",
    dot: "#fb923c",
    style: { background: "rgba(251,146,60,0.10)", border: "1px solid rgba(251,146,60,0.25)", color: "#fdba74" },
  },
  completed: {
    label: "Completed",
    dot: "#22c55e",
    style: { background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.25)", color: "#86efac" },
  },
  disputed: {
    label: "Disputed",
    dot: "#ef4444",
    style: { background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" },
  },
  cancelled: {
    label: "Cancelled",
    dot: "#94a3b8",
    style: { background: "rgba(148,163,184,0.10)", border: "1px solid rgba(148,163,184,0.25)", color: "#cbd5e1" },
  },
  refunded: {
    label: "Refunded",
    dot: "#a78bfa",
    style: { background: "rgba(167,139,250,0.10)", border: "1px solid rgba(167,139,250,0.25)", color: "#c4b5fd" },
  },
};

export function StatusBadge({ status }: { status: JobStatus }) {
  const cfg = statusConfig[status] ?? statusConfig.open;
  return (
    <span
      className="pill flex-shrink-0"
      style={cfg.style}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: cfg.dot, boxShadow: `0 0 6px ${cfg.dot}` }}
      />
      {cfg.label}
    </span>
  );
}

export function Badge({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={cn("pill", className)}
      style={{
        background: "var(--surface-raised)",
        border: "1px solid var(--border-mid)",
        color: "var(--text-secondary)",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
