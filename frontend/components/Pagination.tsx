"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;

  const pages = buildPageList(page, totalPages);

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <NavBtn
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        label="Previous"
      >
        <ChevronLeft className="w-4 h-4" />
      </NavBtn>

      {pages.map((p, i) =>
        p === "…" ? (
          <span
            key={`ellipsis-${i}`}
            className="w-8 text-center text-sm select-none"
            style={{ color: "var(--text-muted)" }}
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            className="w-8 h-8 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: p === page ? "rgba(124,58,237,0.18)" : "transparent",
              border: p === page ? "1px solid rgba(124,58,237,0.40)" : "1px solid transparent",
              color: p === page ? "#a78bfa" : "var(--text-muted)",
            }}
          >
            {p}
          </button>
        )
      )}

      <NavBtn
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        label="Next"
      >
        <ChevronRight className="w-4 h-4" />
      </NavBtn>
    </div>
  );
}

function NavBtn({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      style={{
        background: "var(--surface-raised)",
        border: "1px solid var(--border-subtle)",
        color: "var(--text-muted)",
      }}
    >
      {children}
    </button>
  );
}

function buildPageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "…")[] = [1];

  if (current > 3) pages.push("…");

  const start = Math.max(2, current - 1);
  const end   = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("…");

  pages.push(total);
  return pages;
}
