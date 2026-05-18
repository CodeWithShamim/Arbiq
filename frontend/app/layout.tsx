import type { Metadata } from "next";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { Providers, WrongNetworkBanner } from "./providers";
import { Cursor } from "@/components/Cursor";

export const metadata: Metadata = {
  title: "Arbiq — AI-Enforced Freelance Contracts",
  description:
    "Post jobs, earn crypto, and let AI enforce your freelance contracts on GenLayer.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Darker+Grotesque:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Cursor />
        <Providers>
          <WrongNetworkBanner />
          {children}
        </Providers>
      </body>
    </html>
  );
}
