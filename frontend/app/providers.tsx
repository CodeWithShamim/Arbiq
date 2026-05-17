"use client";

import "@rainbow-me/rainbowkit/styles.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import {
  RainbowKitProvider,
  getDefaultConfig,
  darkTheme,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import { Toaster } from "sonner";
import { ReactNode, useState } from "react";
import { ThemeProvider, useTheme } from "@/lib/theme-context";

/* ── GenLayer Asimov Testnet chain definition ──────────────────────────── */
const genLayerTestnet = {
  id: 961,
  name: "GenLayer Asimov Testnet",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.genlayer.com"] },
  },
  blockExplorers: {
    default: { name: "GenLayer Explorer", url: "https://explorer.genlayer.com" },
  },
} as const;

/* ── RainbowKit + wagmi config ─────────────────────────────────────────── */
const wagmiConfig = getDefaultConfig({
  appName: "Arbiq — AI Freelance Marketplace",
  projectId: "arbiq_dev_placeholder",   // replace with real WalletConnect project ID
  chains: [genLayerTestnet],
  ssr: true,
});

/* ── Inner provider that reads theme context ───────────────────────────── */
function RainbowWrapper({ children }: { children: ReactNode }) {
  const { theme } = useTheme();

  const rkTheme = theme === "light"
    ? lightTheme({
        accentColor: "#7c3aed",
        accentColorForeground: "white",
        borderRadius: "large",
        fontStack: "system",
      })
    : darkTheme({
        accentColor: "#7c3aed",
        accentColorForeground: "white",
        borderRadius: "large",
        fontStack: "system",
        overlayBlur: "small",
      });

  return (
    <RainbowKitProvider theme={rkTheme}>
      {children}
    </RainbowKitProvider>
  );
}

/* ── Root Providers ────────────────────────────────────────────────────── */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: { queries: { staleTime: 10_000, retry: 2 } },
    })
  );

  return (
    <ThemeProvider>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowWrapper>
            {children}
            <ToasterWithTheme />
          </RainbowWrapper>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}

/* Toaster that reacts to theme */
function ToasterWithTheme() {
  const { theme } = useTheme();
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: theme === "light"
          ? { background: "#ffffff", border: "1px solid rgba(109,40,217,0.15)", color: "#1a0a3a", boxShadow: "0 8px 32px rgba(109,40,217,0.12)" }
          : { background: "#0e0e18", border: "1px solid rgba(255,255,255,0.10)", color: "#f0f0ff" },
      }}
    />
  );
}
