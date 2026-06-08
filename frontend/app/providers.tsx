"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, useAccount, useSwitchChain, useChainId } from "wagmi";
import {
  RainbowKitProvider,
  getDefaultConfig,
  darkTheme,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import { Toaster } from "sonner";
import { ReactNode, useState, useEffect } from "react";
import { ThemeProvider, useTheme } from "@/lib/theme-context";

/* ── GenLayer Bradbury Testnet ──────────────────────────────────────────── */
// Chain ID 4221 · RPC https://rpc-bradbury.genlayer.com
export const BRADBURY_CHAIN_ID = 4221;

const bradburyTestnet = {
  id: BRADBURY_CHAIN_ID,
  name: "GenLayer Bradbury Testnet",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc-bradbury.genlayer.com"] },
    public:  { http: ["https://rpc-bradbury.genlayer.com"] },
  },
  blockExplorers: {
    default: {
      name: "GenLayer Explorer",
      url: "https://explorer-bradbury.genlayer.com",
    },
  },
  testnet: true,
} as const;

/* ── RainbowKit + wagmi config — Bradbury only ──────────────────────────── */
const wagmiConfig = getDefaultConfig({
  appName: "Arbiq — AI Freelance Marketplace",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "arbiq_dev_placeholder",
  chains: [bradburyTestnet],
  ssr: true,
});

/* ── Auto-switch: silently switches wallet to Bradbury on connect ───────── */
function NetworkEnforcer() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    if (isConnected && chainId !== BRADBURY_CHAIN_ID) {
      switchChain({ chainId: BRADBURY_CHAIN_ID });
    }
  }, [isConnected, chainId, switchChain]);

  return null;
}

/* ── Wrong-network banner ───────────────────────────────────────────────── */
export function WrongNetworkBanner() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected || chainId === BRADBURY_CHAIN_ID) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 60,
        left: 0,
        right: 0,
        zIndex: 100,
        background: "linear-gradient(90deg, #b91c1c, #ef4444)",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: "10px 16px",
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      <span>⚠ Wrong network — Arbiq requires GenLayer Bradbury Testnet</span>
      <button
        onClick={() => switchChain({ chainId: BRADBURY_CHAIN_ID })}
        disabled={isPending}
        style={{
          background: "rgba(255,255,255,0.2)",
          border: "1px solid rgba(255,255,255,0.4)",
          color: "white",
          borderRadius: 8,
          padding: "4px 14px",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          opacity: isPending ? 0.6 : 1,
        }}
      >
        {isPending ? "Switching…" : "Switch Network"}
      </button>
    </div>
  );
}

/* ── RainbowKit wrapper ─────────────────────────────────────────────────── */
function RainbowWrapper({ children }: { children: ReactNode }) {
  const { theme } = useTheme();

  const rkTheme =
    theme === "light"
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
    <RainbowKitProvider theme={rkTheme} initialChain={BRADBURY_CHAIN_ID}>
      <NetworkEnforcer />
      {children}
    </RainbowKitProvider>
  );
}

/* ── Root Providers ─────────────────────────────────────────────────────── */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 2,
            // Bradbury rate-limits gen_call — don't refire reads on every tab
            // focus / reconnect, which caused bursts of simultaneous gen_calls.
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
          },
        },
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

function ToasterWithTheme() {
  const { theme } = useTheme();
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style:
          theme === "light"
            ? {
                background: "#ffffff",
                border: "1px solid rgba(109,40,217,0.15)",
                color: "#1a0a3a",
                boxShadow: "0 8px 32px rgba(109,40,217,0.12)",
              }
            : {
                background: "#0e0e18",
                border: "1px solid rgba(255,255,255,0.10)",
                color: "#f0f0ff",
              },
      }}
    />
  );
}
