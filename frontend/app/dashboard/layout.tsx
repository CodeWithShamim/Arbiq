import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Your Arbiq dashboard — track jobs you've posted, work you're delivering, escrow balances, and payouts.",
  // Wallet-specific view: no public SEO value.
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
