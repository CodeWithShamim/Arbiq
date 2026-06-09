import type { Metadata, Viewport } from "next";
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
import { CookieConsent } from "@/components/CookieConsent";

import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "freelance", "escrow", "GenLayer", "blockchain", "AI arbitration",
    "smart contract", "Web3", "crypto payments", "GEN", "trustless",
  ],
  authors: [{ name: SITE.name }],
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.svg",
  },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: SITE.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    creator: SITE.twitter,
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
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
              <CookieConsent />
            </ErrorProvider>
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
