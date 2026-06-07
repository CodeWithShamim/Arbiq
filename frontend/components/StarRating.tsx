"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface Props {
  /** Current value (0–5). For interactive use this is the controlled value. */
  value: number;
  /** When set, stars are clickable and call this with the new value. */
  onChange?: (value: number) => void;
  size?: number;
  /** Show the numeric value next to the stars. */
  showValue?: boolean;
  className?: string;
}

/** A 1–5 star widget. Read-only when `onChange` is omitted, interactive otherwise. */
export function StarRating({ value, onChange, size = 18, showValue = false, className }: Props) {
  const [hover, setHover] = useState(0);
  const interactive = typeof onChange === "function";
  const shown = hover || value;

  return (
    <div className={`inline-flex items-center gap-1 ${className ?? ""}`}>
      <div className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= shown;
          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              onClick={interactive ? () => onChange!(star) : undefined}
              onMouseEnter={interactive ? () => setHover(star) : undefined}
              onMouseLeave={interactive ? () => setHover(0) : undefined}
              className={interactive ? "transition-transform hover:scale-110" : "cursor-default"}
              style={{ lineHeight: 0 }}
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
            >
              <Star
                style={{
                  width: size,
                  height: size,
                  color: filled ? "#fbbf24" : "var(--text-muted)",
                  fill: filled ? "#fbbf24" : "transparent",
                  transition: "color 0.15s, fill 0.15s",
                }}
              />
            </button>
          );
        })}
      </div>
      {showValue && value > 0 && (
        <span className="text-xs font-semibold ml-1" style={{ color: "#fbbf24" }}>
          {value.toFixed(value % 1 === 0 ? 0 : 1)}
        </span>
      )}
    </div>
  );
}
