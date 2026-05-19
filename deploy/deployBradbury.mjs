/**
 * Deploy arbiq.py to GenLayer Bradbury Testnet
 * Usage:  PRIVATE_KEY=0x... node deploy/deployBradbury.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ── Load genlayer-js from the frontend workspace (has Bradbury support) ───────
const { createClient } = await import(`${ROOT}/frontend/node_modules/genlayer-js/dist/index.js`);
const { testnetBradbury } = await import(`${ROOT}/frontend/node_modules/genlayer-js/dist/chains/index.js`);

const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY || !PRIVATE_KEY.startsWith("0x")) {
  console.error("❌  PRIVATE_KEY env var is required.");
  console.error("    Usage: PRIVATE_KEY=0x<your-key> node deploy/deployBradbury.mjs");
  process.exit(1);
}

// ── Build client with private key account ────────────────────────────────────
const client = createClient({
  chain: testnetBradbury,
  account: PRIVATE_KEY,
});

console.log("📡  Network :", testnetBradbury.name);
console.log("🔗  RPC     :", testnetBradbury.rpcUrls.default.http[0]);
console.log("");

// ── Read contract source ──────────────────────────────────────────────────────
const contractPath = path.resolve(ROOT, "contracts/arbiq.py");
const contractCode = new Uint8Array(readFileSync(contractPath));
console.log("📄  Contract:", contractPath);
console.log("");

// ── Deploy ────────────────────────────────────────────────────────────────────
console.log("🚀  Deploying contract…");

let deployTxHash;
try {
  deployTxHash = await client.deployContract({ code: contractCode, args: [] });
} catch (err) {
  console.error("❌  deployContract failed:", err.message ?? err);
  process.exit(1);
}

console.log("⏳  Tx submitted:", deployTxHash);
console.log("⏳  Waiting for consensus (this can take 1–3 minutes)…");

let receipt;
try {
  receipt = await client.waitForTransactionReceipt({
    hash: deployTxHash,
    retries: 240,   // 240 × default 1s poll = 4 min max
  });
} catch (err) {
  console.error("❌  waitForTransactionReceipt failed:", err.message ?? err);
  process.exit(1);
}

// ── Extract deployed address ──────────────────────────────────────────────────
const contractAddress =
  receipt?.data?.contract_address ??
  receipt?.txDataDecoded?.contractAddress ??
  null;

if (!contractAddress) {
  console.error("❌  Could not extract contract address from receipt.");
  console.error("    Full receipt:", JSON.stringify(receipt, null, 2));
  process.exit(1);
}

// ── Update frontend .env files ────────────────────────────────────────────────
const envFiles = [
  path.resolve(ROOT, "frontend/.env"),
  path.resolve(ROOT, "frontend/.env.local"),
];

for (const envFile of envFiles) {
  try {
    let content = readFileSync(envFile, "utf8");
    // Comment out any old address lines and add new one
    content = content.replace(
      /^(NEXT_PUBLIC_CONTRACT_ADDRESS=.*)$/gm,
      `# $1`
    );
    content += `\nNEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}\n`;
    writeFileSync(envFile, content);
    console.log(`✅  Updated ${envFile}`);
  } catch {
    console.warn(`⚠️   Could not update ${envFile} — update manually.`);
  }
}

// ── Done ──────────────────────────────────────────────────────────────────────
console.log("");
console.log("✅  CONTRACT DEPLOYED");
console.log("    Address :", contractAddress);
console.log("    Network :", testnetBradbury.name);
console.log("    Tx Hash :", deployTxHash);
console.log("");
console.log("    NEXT_PUBLIC_CONTRACT_ADDRESS=" + contractAddress);
console.log("");
console.log("    Restart the dev server to pick up the new address.");
