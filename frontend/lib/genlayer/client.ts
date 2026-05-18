import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";

export { testnetBradbury };
export const BRADBURY_CHAIN_ID = testnetBradbury.id;

export const genLayerClient = createClient({ chain: testnetBradbury });

export const CONTRACT_ADDRESS = (
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ??
  "0x0000000000000000000000000000000000000000"
) as `0x${string}`;
