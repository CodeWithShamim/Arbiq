import { createClient, chains } from "genlayer-js";

export const genLayerClient = createClient({ chain: chains.testnetAsimov });

export const CONTRACT_ADDRESS = (
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "0x0000000000000000000000000000000000000000"
) as `0x${string}`;
