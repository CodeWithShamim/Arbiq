// Maps raw contract/RPC error strings to user-friendly messages.
// Patterns are tested in order — first match wins.

interface ErrorMapping {
  pattern: RegExp;
  message: string;
}

const CONTRACT_ERRORS: ErrorMapping[] = [
  // ── Job lifecycle ─────────────────────────────────────────────────────────
  { pattern: /Job \d+ does not exist/i,                       message: "This job doesn't exist on-chain." },
  { pattern: /Job is not open/i,                              message: "This job has already been taken." },
  { pattern: /Job is not active/i,                            message: "This job isn't active — it may have been completed or disputed." },
  { pattern: /Job has not been delivered yet/i,               message: "The freelancer hasn't submitted delivery yet." },

  // ── Access control ────────────────────────────────────────────────────────
  { pattern: /Client cannot take their own job/i,             message: "You posted this job — you can't work on it." },
  { pattern: /Only the assigned freelancer can submit/i,      message: "Only the hired freelancer can submit delivery." },
  { pattern: /Only the client can manually release/i,         message: "Only the client who posted this job can release payment." },
  { pattern: /Only client or freelancer can message/i,        message: "Only the client and freelancer on this job can message." },
  { pattern: /Cannot message before a freelancer takes/i,     message: "Messaging opens once a freelancer accepts the job." },

  // ── Validation ────────────────────────────────────────────────────────────
  { pattern: /Title must be at least 3 characters/i,          message: "Job title is too short — write at least 3 characters." },
  { pattern: /Description must be at least 20 characters/i,   message: "Job description is too short — write at least 20 characters." },
  { pattern: /Deadline is required/i,                         message: "Please set a deadline for this job." },
  { pattern: /Must send GEN to escrow/i,                      message: "Add a GEN budget before posting — it goes into escrow." },
  { pattern: /Evidence URL is required/i,                     message: "Please include a link to your work as evidence." },

  // ── AI evaluation ─────────────────────────────────────────────────────────
  { pattern: /AI returned invalid JSON/i,                     message: "The AI evaluator returned an unexpected response. Try again." },
  { pattern: /AI response missing required fields/i,          message: "The AI evaluation was incomplete. Try running it again." },

  // ── Wallet / network ──────────────────────────────────────────────────────
  { pattern: /Wallet not connected/i,                         message: "Connect your wallet to continue." },
  { pattern: /user rejected/i,                                message: "Transaction cancelled." },
  { pattern: /User rejected/i,                                message: "Transaction cancelled." },
  { pattern: /rejected by user/i,                             message: "Transaction cancelled." },
  { pattern: /insufficient funds/i,                           message: "Insufficient GEN balance to cover this transaction." },
  { pattern: /rate limit exceeded/i,                          message: "Too many requests — please wait a moment and try again." },
  { pattern: /Timed out after \d+s/i,                         message: "Consensus is taking longer than expected. Check the explorer for status." },
  { pattern: /network|fetch|Failed to fetch|ECONNREFUSED/i,   message: "Network error — check your connection and try again." },
];

const FALLBACK = "Something went wrong. Please try again.";

/**
 * Extracts the deepest human-readable string from any error shape
 * thrown by genlayer-js, viem, or the contract VM.
 */
export function extractRawMessage(err: unknown): string {
  if (!err) return FALLBACK;

  // viem / genlayer errors nest the VM message in various places
  const e = err as Record<string, unknown>;

  // genlayer-js UserError bubbles as: error.cause?.message or error.details
  const candidates = [
    e.details,
    e.shortMessage,
    (e.cause as Record<string, unknown> | undefined)?.message,
    (e.cause as Record<string, unknown> | undefined)?.details,
    e.message,
  ].filter(Boolean) as string[];

  // The actual UserError string is usually inside a quoted block
  for (const raw of candidates) {
    const m = String(raw).match(/UserError[^:]*:\s*(.+?)(?:\n|$)/);
    if (m) return m[1].trim();
  }

  return candidates[0] ? String(candidates[0]) : FALLBACK;
}

/**
 * Returns a user-friendly message for any contract/wallet error.
 * Always logs the raw error to the console for debugging.
 */
export function friendlyError(err: unknown): string {
  console.error("[Arbiq error]", err);

  const raw = extractRawMessage(err);

  for (const { pattern, message } of CONTRACT_ERRORS) {
    if (pattern.test(raw)) return message;
  }

  // Trim noisy viem prefixes before falling back
  const cleaned = raw
    .replace(/^(ContractFunctionExecutionError|ContractFunctionRevertedError|Error):\s*/i, "")
    .replace(/\n.*/s, "") // first line only
    .trim();

  return cleaned || FALLBACK;
}
