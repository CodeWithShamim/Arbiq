import type { Metadata } from "next";

// Job content lives on-chain and is fetched client-side, so we derive a stable,
// shareable title/description from the route param rather than blocking render
// on an on-chain read at request time.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const safeId = /^\d+$/.test(id) ? id : "";
  const title = safeId ? `Job #${safeId}` : "Job";
  const description = safeId
    ? `View job #${safeId} on Arbiq — escrow status, delivery, AI evaluation, and on-chain payout, all enforced by GenLayer consensus.`
    : "View this Arbiq job — escrow status, delivery, and AI-enforced payout on GenLayer.";

  return {
    title,
    description,
    openGraph: { title: `${title} — Arbiq`, description },
    twitter: { title: `${title} — Arbiq`, description },
  };
}

export default function JobDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
