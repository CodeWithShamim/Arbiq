import { cn } from "@/lib/utils";
import type { JobStatus } from "@/lib/types";

const statusConfig: Record<
  JobStatus,
  { label: string; className: string }
> = {
  open: {
    label: "Open",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  active: {
    label: "Active",
    className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  },
  delivered: {
    label: "Delivered",
    className: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  },
  completed: {
    label: "✅ Completed",
    className: "bg-green-500/15 text-green-400 border-green-500/30",
  },
  disputed: {
    label: "⚠️ Disputed",
    className: "bg-red-500/15 text-red-400 border-red-500/30",
  },
};

export function StatusBadge({ status }: { status: JobStatus }) {
  const config = statusConfig[status] ?? statusConfig.open;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-white/10 bg-white/5 text-gray-300",
        className
      )}
    >
      {children}
    </span>
  );
}
