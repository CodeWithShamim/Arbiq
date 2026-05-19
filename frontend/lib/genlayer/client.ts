import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import type { CalldataEncodable } from "genlayer-js/types";

export { testnetBradbury, createClient };
export const BRADBURY_CHAIN_ID = testnetBradbury.id;

// Read-only client — used for readContract calls (no wallet needed)
export const genLayerClient = createClient({ chain: testnetBradbury });

export const CONTRACT_ADDRESS = (
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ??
  "0x0000000000000000000000000000000000000000"
) as `0x${string}`;

export async function readContract(
  method: string,
  args: CalldataEncodable[] = [],
): Promise<unknown> {
  return genLayerClient.readContract({
    address: CONTRACT_ADDRESS,
    functionName: method,
    args,
  });
}
