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

// In-memory read cache — avoids duplicate RPC calls for the same method+args
// within a short window (e.g. multiple components mounting at the same time).
const readCache = new Map<string, { result: unknown; ts: number }>();
const READ_CACHE_TTL = 4_000; // ms

export async function readContract(
  method: string,
  args: CalldataEncodable[] = [],
): Promise<unknown> {
  const key = method + JSON.stringify(args);
  const cached = readCache.get(key);
  if (cached && Date.now() - cached.ts < READ_CACHE_TTL) {
    return cached.result;
  }
  const result = await genLayerClient.readContract({
    address: CONTRACT_ADDRESS,
    functionName: method,
    args,
  });
  readCache.set(key, { result, ts: Date.now() });
  return result;
}

// Call after a write so the next read for affected methods bypasses the cache.
export function invalidateReadCache(...methods: string[]) {
  if (methods.length === 0) {
    readCache.clear();
  } else {
    for (const [key] of readCache) {
      if (methods.some((m) => key.startsWith(m))) readCache.delete(key);
    }
  }
}
