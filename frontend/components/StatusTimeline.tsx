import type { JobStatus } from "@/lib/types";
import { Check } from "lucide-react";

const STEPS = [
  { label: "Open", short: "Open" },
  { label: "Active", short: "Active" },
  { label: "Delivered", short: "Delivered" },
  { label: "Evaluated", short: "Done" },
];

const ORDER: Record<JobStatus, number> = {
  open: 0, active: 1, delivered: 2, completed: 3, disputed: 3,
};

export function StatusTimeline({ status }: { status: JobStatus }) {
  const current = ORDER[status];
  const isDisputed = status === "disputed";

  return (
    <div className="flex items-center w-full">
      {STEPS.map((step, idx) => {
        const done = current > idx;
        const active = current === idx && !isDisputed;
        const disputedHere = isDisputed && idx === 3;
        const isLast = idx === STEPS.length - 1;

        return (
          <div key={step.label} className="flex items-center flex-1 last:flex-none">
            {/* Node */}
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500"
                style={
                  done
                    ? { background: "linear-gradient(135deg,#7c3aed,#a78bfa)", boxShadow: "0 0 16px rgba(124,58,237,0.5)" }
                    : active
                    ? { background: "rgba(124,58,237,0.2)", border: "2px solid #7c3aed", boxShadow: "0 0 0 0 rgba(124,58,237,0.4)" }
                    : disputedHere
                    ? { background: "rgba(239,68,68,0.15)", border: "2px solid #ef4444" }
                    : { background: "var(--surface-raised)", border: "1px solid var(--border-mid)" }
                }
              >
                {done ? (
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                ) : disputedHere ? (
                  <span className="text-red-400 text-xs font-bold">!</span>
                ) : (
                  <span
                    className="text-xs font-bold"
                    style={{ color: active ? "#a78bfa" : "var(--text-muted)" }}
                  >
                    {idx + 1}
                  </span>
                )}
              </div>
              <span
                className="text-[10px] font-semibold whitespace-nowrap"
                style={{
                  color: done
                    ? "#a78bfa"
                    : active
                    ? "var(--text-primary)"
                    : disputedHere
                    ? "#fca5a5"
                    : "var(--text-muted)",
                }}
              >
                {disputedHere ? "Disputed" : step.short}
              </span>
            </div>

            {/* Connector */}
            {!isLast && (
              <div
                className="flex-1 h-[2px] mx-2 mb-5 rounded-full overflow-hidden"
                style={{ background: "var(--border-mid)" }}
              >
                <div
                  className="h-full rounded-full progress-fill"
                  style={{
                    background: "linear-gradient(90deg,#7c3aed,#a78bfa)",
                    width: done ? "100%" : "0%",
                    transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
