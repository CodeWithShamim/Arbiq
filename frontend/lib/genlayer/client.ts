import { createClient } from "genlayer-js";
import type { GenLayerChain } from "genlayer-js/types";

export const BRADBURY_CHAIN_ID = 4221;

// Bradbury is not yet exported by genlayer-js — defined manually.
export const testnetBradbury: GenLayerChain = {
  id: BRADBURY_CHAIN_ID,
  name: "GenLayer Bradbury Testnet",
  isStudio: false,
  nativeCurrency: { name: "GEN Token", symbol: "GEN", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc-bradbury.genlayer.com"] },
  },
  blockExplorers: {
    default: {
      name: "GenLayer Explorer",
      url: "https://explorer-bradbury.genlayer.com",
    },
  },
  testnet: true,
  consensusMainContract: null,
  consensusDataContract: null,
  stakingContract: null,
  defaultNumberOfInitialValidators: 5,
  defaultConsensusMaxRotations: 3,
};

export const genLayerClient = createClient({ chain: testnetBradbury });

export const CONTRACT_ADDRESS = (
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ??
  "0x0000000000000000000000000000000000000000"
) as `0x${string}`;
