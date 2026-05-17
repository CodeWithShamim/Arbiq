import { cn } from "@/lib/utils";
import type { JobStatus } from "@/lib/types";
import { CheckCircle2, Circle } from "lucide-react";

const STEPS: { status: JobStatus; label: string }[] = [
  { status: "open", label: "Open" },
  { status: "active", label: "Active" },
  { status: "delivered", label: "Delivered" },
  { status: "completed", label: "Evaluated" },
];

const ORDER: Record<JobStatus, number> = {
  open: 0,
  active: 1,
  delivered: 2,
  completed: 3,
  disputed: 3,
};

export function StatusTimeline({ status }: { status: JobStatus }) {
  const current = ORDER[status];
  const isDisputed = status === "disputed";

  return (
    <div className="flex items-center gap-2">
      {STEPS.map((step, idx) => {
        const done = current > idx;
        const active = current === idx && !isDisputed;
        const disputedHere = isDisputed && idx === 3;

        return (
          <div key={step.status} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                  done
                    ? "bg-purple-600 text-white"
                    : active
                    ? "bg-purple-600/30 border-2 border-purple-500 text-purple-400"
                    : disputedHere
                    ? "bg-red-500/30 border-2 border-red-500 text-red-400"
                    : "bg-white/5 border border-white/10 text-gray-600"
                )}
              >
                {done ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Circle className="w-3 h-3" />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium whitespace-nowrap",
                  done
                    ? "text-purple-400"
                    : active
                    ? "text-white"
                    : disputedHere
                    ? "text-red-400"
                    : "text-gray-600"
                )}
              >
                {disputedHere ? "Disputed" : step.label}
              </span>
            </div>

            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px flex-1 min-w-[24px] mb-4",
                  done ? "bg-purple-600/60" : "bg-white/10"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
