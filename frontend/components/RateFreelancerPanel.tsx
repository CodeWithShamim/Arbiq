"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Star } from "lucide-react";
import { StarRating } from "@/components/StarRating";
import { Textarea } from "@/components/ui/textarea";
import { TxHudOverlay } from "@/components/TxHudOverlay";
import { useRateFreelancer } from "@/hooks/useArbiqContract";
import type { Job } from "@/lib/types";

interface Props {
  job: Job;
  isClient: boolean;
  onRated?: () => void;
}

/**
 * Shown on a completed job. The client can leave a 1–5★ rating + review for the
 * freelancer (once). After rating — or for anyone else — the submitted rating is
 * displayed read-only.
 */
export function RateFreelancerPanel({ job, isClient, onRated }: Props) {
  const { rateFreelancer, txState, isLoading } = useRateFreelancer();
  const [stars, setStars] = useState(0);
  const [review, setReview] = useState("");

  useEffect(() => {
    if (txState.status === "error" && txState.error) toast.error(txState.error);
    if (txState.status === "finalized") {
      toast.success("Rating submitted — thanks!");
      onRated?.();
    }
  }, [txState.status, txState.error, onRated]);

  // Already rated → read-only display.
  if (job.rated) {
    return (
      <div
        className="p-6 rounded-2xl space-y-2"
        style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}
      >
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-label)" }}>
          Client Rating
        </p>
        <div className="flex items-center gap-2">
          <StarRating value={job.rating ?? 0} showValue size={20} />
        </div>
        {job.review && (
          <p className="text-sm leading-relaxed pt-1" style={{ color: "var(--text-secondary)" }}>
            “{job.review}”
          </p>
        )}
      </div>
    );
  }

  // Only the client can rate, and only if not yet rated.
  if (!isClient) return null;

  const submit = () => {
    if (stars < 1) {
      toast.error("Pick a star rating first");
      return;
    }
    rateFreelancer(job.id, stars, review.trim());
  };

  return (
    <div
      className="p-6 rounded-2xl space-y-4 relative overflow-hidden"
      style={{ background: "var(--surface-card)", border: "1px solid rgba(251,191,36,0.22)" }}
    >
      <div className="absolute left-0 top-0 bottom-0 rounded-l-2xl" style={{ width: 3, background: "#fbbf24", opacity: 0.7 }} />
      <div>
        <h2 className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: "#fbbf24" }}>
          <Star className="w-3.5 h-3.5" /> Rate the Freelancer
        </h2>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Your rating builds the freelancer&apos;s on-chain reputation. One rating per job.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <StarRating value={stars} onChange={setStars} size={28} />
        {stars > 0 && (
          <span className="text-sm font-semibold" style={{ color: "#fbbf24" }}>
            {["", "Poor", "Fair", "Good", "Great", "Excellent"][stars]}
          </span>
        )}
      </div>

      <Textarea
        rows={3}
        placeholder="Optional: how was working with this freelancer?"
        value={review}
        onChange={(e) => setReview(e.target.value)}
        disabled={isLoading}
      />

      <button
        onClick={submit}
        disabled={isLoading}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white"
      >
        {isLoading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
        ) : (
          <><Star className="w-4 h-4" /> Submit Rating</>
        )}
      </button>

      <TxHudOverlay
        status={txState.status}
        consensusStatus={txState.consensusStatus}
        txHash={txState.txHash}
        error={txState.error}
        operation="rate_freelancer"
      />
    </div>
  );
}
