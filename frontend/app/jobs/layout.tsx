import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Jobs",
  description:
    "Browse open freelance jobs on Arbiq. Pick up work, deliver it, and get paid automatically in GEN — escrow enforced by AI consensus on GenLayer.",
  openGraph: {
    title: "Browse Jobs — Arbiq",
    description:
      "Open freelance work on Arbiq. Escrow-locked budgets, automatic on-chain payouts, zero platform fees.",
  },
};

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
