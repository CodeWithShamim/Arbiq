"use client";

import { useGetProfile } from "@/hooks/useArbiqContract";

interface Props {
  address: string;
  showDetails?: boolean;
}

export function ReputationBadge({ address, showDetails = false }: Props) {
  const { data: profile } = useGetProfile(address);
  if (!profile) return null;

  const score = profile.reputation_score;
  const color = score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const label = score >= 80 ? "Trusted" : score >= 50 ? "Mixed" : "Risk";
  const ratingCount = profile.rating_count ?? 0;
  const avgRating = profile.avg_rating ?? 0;
  const tip = `${profile.jobs_completed} completed · ${profile.jobs_disputed} disputed`;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span
        className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full cursor-default"
        style={{
          background: `${color}18`,
          border: `1px solid ${color}35`,
          color,
        }}
        title={tip}
      >
        ★ {score}% · {label}
      </span>
      {ratingCount > 0 && (
        <span
          className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full cursor-default"
          style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)", color: "#fbbf24" }}
          title={`${ratingCount} client rating${ratingCount !== 1 ? "s" : ""}`}
        >
          ⭐ {avgRating.toFixed(1)} ({ratingCount})
        </span>
      )}
      {showDetails && (
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
          {tip}
        </span>
      )}
    </div>
  );
}
