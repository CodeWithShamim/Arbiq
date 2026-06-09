import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Post a Job",
  description:
    "Post freelance work on Arbiq. Write a clear spec, lock your GEN budget in escrow, and let AI consensus verify delivery before payment is released.",
  openGraph: {
    title: "Post a Job — Arbiq",
    description:
      "Describe your work, lock budget in escrow, and pay only for verified delivery — enforced on-chain by GenLayer.",
  },
};

export default function NewJobLayout({ children }: { children: React.ReactNode }) {
  return children;
}
