"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { metaMask, injected } from "@wagmi/connectors";
import { Toaster } from "sonner";
import { ReactNode, useState } from "react";

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

const wagmiConfig = createConfig({
  chains: [genLayerTestnet],
  connectors: [injected(), metaMask()],
  transports: {
    [genLayerTestnet.id]: http(),
  },
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 10_000, retry: 2 },
        },
      })
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#12121a",
              border: "1px solid #1e1e2e",
              color: "#fff",
            },
          }}
        />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
