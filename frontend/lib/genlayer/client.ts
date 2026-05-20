import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import type { CalldataEncodable } from "genlayer-js/types";

export { testnetBradbury, createClient };
export const BRADBURY_CHAIN_ID = testnetBradbury.id;

export const genLayerClient = createClient({ chain: testnetBradbury });

export const CONTRACT_ADDRESS = (
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ??
  "0x0000000000000000000000000000000000000000"
) as `0x${string}`;

// ── Read queue ──────────────────────────────────────────────────────────────
// The Bradbury testnet rate-limits gen_call per IP. Running multiple reads
// concurrently (polling hooks + chat) reliably triggers 429s. This queue
// serialises all readContract calls so only one gen_call is in-flight at a time.

let readQueue: Promise<unknown> = Promise.resolve();

function isRateLimit(err: unknown): boolean {
  const msg = String(
    (err as Record<string, unknown>)?.message ??
    (err as Record<string, unknown>)?.details ??
    err
  );
  return /rate.?limit|429|too many/i.test(msg);
}

async function callWithBackoff(
  method: string,
  args: CalldataEncodable[],
  attempt = 0,
): Promise<unknown> {
  try {
    return await genLayerClient.readContract({
      address: CONTRACT_ADDRESS,
      functionName: method,
      args,
    });
  } catch (err) {
    if (isRateLimit(err) && attempt < 4) {
      // Exponential backoff: 2s, 4s, 8s, 16s
      await new Promise((r) => setTimeout(r, 2_000 * 2 ** attempt));
      return callWithBackoff(method, args, attempt + 1);
    }
    throw err;
  }
}

export function readContract(
  method: string,
  args: CalldataEncodable[] = [],
): Promise<unknown> {
  // Chain onto the queue so reads run one at a time
  readQueue = readQueue.then(() => Promise.resolve());
  const result = readQueue.then(() => callWithBackoff(method, args));
  // Keep queue moving even if this call throws
  readQueue = result.catch(() => undefined);
  return result;
}
