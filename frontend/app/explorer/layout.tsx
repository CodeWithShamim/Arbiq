import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explorer",
  description:
    "Explore Arbiq activity on the GenLayer Bradbury Testnet — live transactions, job events, and AI consensus verdicts.",
  openGraph: {
    title: "Explorer — Arbiq",
    description: "Live on-chain transactions, job events, and AI consensus verdicts on GenLayer.",
  },
};

export default function ExplorerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
