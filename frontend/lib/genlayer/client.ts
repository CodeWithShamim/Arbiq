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

// ── Result cache ─────────────────────────────────────────────────────────────
const readCache = new Map<string, { result: unknown; ts: number }>();
const READ_CACHE_TTL = 8_000; // ms — longer TTL reduces RPC calls

// ── In-flight dedup ───────────────────────────────────────────────────────────
// Multiple components calling readContract with the same key at the same moment
// share one single in-flight promise instead of each firing their own gen_call.
const inFlight = new Map<string, Promise<unknown>>();

// ── Concurrency limiter ───────────────────────────────────────────────────────
// Bradbury rate-limits gen_call. Allow at most 2 simultaneous RPC calls.
const MAX_CONCURRENT = 2;
let active = 0;
const queue: Array<() => void> = [];

function acquireSlot(): Promise<void> {
  if (active < MAX_CONCURRENT) {
    active++;
    return Promise.resolve();
  }
  return new Promise((resolve) => queue.push(resolve));
}

function releaseSlot() {
  const next = queue.shift();
  if (next) {
    next();
  } else {
    active--;
  }
}

// ── Exponential backoff retry ─────────────────────────────────────────────────
async function fetchWithRetry(
  method: string,
  args: CalldataEncodable[],
  attempt = 0,
): Promise<unknown> {
  await acquireSlot();
  try {
    const result = await genLayerClient.readContract({
      address: CONTRACT_ADDRESS,
      functionName: method,
      args,
    });
    return result;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("rate limit") && attempt < 4) {
      const delay = 600 * Math.pow(2, attempt); // 600 ms, 1.2 s, 2.4 s, 4.8 s
      await new Promise((r) => setTimeout(r, delay));
      releaseSlot();
      return fetchWithRetry(method, args, attempt + 1);
    }
    throw err;
  } finally {
    // Only release on success or non-retryable error (retry path releases above)
    if (active > 0 || queue.length === 0) releaseSlot();
  }
}

export async function readContract(
  method: string,
  args: CalldataEncodable[] = [],
): Promise<unknown> {
  const key = method + JSON.stringify(args);

  // 1. Return cached result if fresh
  const cached = readCache.get(key);
  if (cached && Date.now() - cached.ts < READ_CACHE_TTL) {
    return cached.result;
  }

  // 2. Coalesce concurrent calls — return the same in-flight promise
  const existing = inFlight.get(key);
  if (existing) return existing;

  // 3. Fire the real RPC call (with concurrency + retry)
  const promise = fetchWithRetry(method, args).then((result) => {
    readCache.set(key, { result, ts: Date.now() });
    inFlight.delete(key);
    return result;
  }).catch((err) => {
    inFlight.delete(key);
    throw err;
  });

  inFlight.set(key, promise);
  return promise;
}

export function invalidateReadCache(...methods: string[]) {
  if (methods.length === 0) {
    readCache.clear();
  } else {
    for (const [key] of readCache) {
      if (methods.some((m) => key.startsWith(m))) readCache.delete(key);
    }
  }
}
