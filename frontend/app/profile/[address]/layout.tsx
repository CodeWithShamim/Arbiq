import type { Metadata } from "next";

function shorten(addr: string): string {
  return /^0x[a-fA-F0-9]{6,}$/.test(addr)
    ? `${addr.slice(0, 6)}…${addr.slice(-4)}`
    : addr;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ address: string }>;
}): Promise<Metadata> {
  const { address } = await params;
  const label = shorten(address);
  const title = `Profile ${label}`;
  const description = `Reputation, completed jobs, and ratings for ${label} on Arbiq — the AI-enforced freelance marketplace on GenLayer.`;

  return {
    title,
    description,
    openGraph: { title: `${title} — Arbiq`, description },
    // Per-wallet pages: keep out of the index but allow link previews.
    robots: { index: false, follow: true },
  };
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
