import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Docs",
  description:
    "Arbiq documentation — how AI-enforced escrow, proposals, milestones, disputes, and on-chain ratings work on GenLayer.",
  openGraph: {
    title: "Docs — Arbiq",
    description: "How Arbiq's AI-enforced escrow, disputes, and ratings work on GenLayer.",
  },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
