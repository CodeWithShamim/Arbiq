import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics",
  description:
    "Live marketplace analytics for Arbiq — job volume, escrow value locked, completion rates, and dispute outcomes across the GenLayer network.",
  openGraph: {
    title: "Analytics — Arbiq",
    description: "Live on-chain marketplace metrics: volume, escrow, completion, disputes.",
  },
};

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
