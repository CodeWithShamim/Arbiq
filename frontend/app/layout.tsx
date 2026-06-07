import type { Metadata } from "next";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { Providers, WrongNetworkBanner } from "./providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorProvider } from "@/lib/error-context";
import { BootLoader } from "@/components/animations/BootLoader";
import { GameCursor } from "@/components/animations/GameCursor";
import { PageTransition } from "@/components/animations/PageTransition";
import { DataFloats } from "@/components/animations/DataFloats";
import { NetworkWidget } from "@/components/animations/NetworkWidget";
import { ScrollProgress } from "@/components/animations/ScrollProgress";
import { KonamiEaster } from "@/components/animations/KonamiEaster";
import { VersionAlert } from "@/components/VersionAlert";

export const metadata: Metadata = {
  title: "Arbiq — Trustless Freelance on GenLayer",
  description:
    "The first freelance marketplace where payment is enforced by AI consensus, not promises. Post work, get paid in GEN — no middlemen, no disputes left unresolved.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Darker+Grotesque:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <GameCursor />
        <BootLoader />
        <PageTransition />
        <DataFloats />
        <NetworkWidget />
        <ScrollProgress />
        <KonamiEaster />
        <Providers>
          <ErrorBoundary>
            <ErrorProvider>
              <VersionAlert />
              <WrongNetworkBanner />
              {children}
            </ErrorProvider>
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
