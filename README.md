# Arbiq — AI-Enforced Freelance Marketplace on GenLayer

![genvm-lint](https://img.shields.io/badge/genvm--lint-passing-brightgreen) ![GenLayer](https://img.shields.io/badge/GenLayer-Bradbury%20Testnet-blue) ![contract](https://img.shields.io/badge/contract-0x2651...9592-orange)

Arbiq is a decentralized freelance escrow platform where payment disputes are resolved autonomously by an AI judge running on the [GenLayer](https://genlayer.com) blockchain. Clients lock GEN tokens in escrow when posting a job; when a freelancer submits their delivery, the client can trigger an on-chain AI evaluation — multiple GenLayer validator nodes independently **fetch and read the evidence URL** using `gl.get_webpage()`, run an LLM prompt to score the work against the job spec, reach strict consensus via `gl.eq_principle.strict_eq`, and automatically release or withhold payment. No central arbitrator. No appeals process needed.

> **Live network:** GenLayer Bradbury Testnet (Chain ID 4221)
> **Contract address:** [`0x26517582E3B1E89F55823ba217191321992D9592`](https://explorer-bradbury.genlayer.com/address/0x26517582E3B1E89F55823ba217191321992D9592)
> **Explorer:** [explorer-bradbury.genlayer.com/address/0x26517582E3B1E89F55823ba217191321992D9592](https://explorer-bradbury.genlayer.com/address/0x26517582E3B1E89F55823ba217191321992D9592)
> **Contract source:** `contracts/arbiq.py` — an Intelligent Contract written in Python

---

## Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Directory Structure](#directory-structure)
- [Smart Contract Design](#smart-contract-design)
- [Frontend Architecture](#frontend-architecture)
- [Transaction & Consensus Flow](#transaction--consensus-flow)
- [Notification System](#notification-system)
- [On-Chain Chat](#on-chain-chat)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Contract Reference](#contract-reference)
- [Tech Stack](#tech-stack)

---

## Features

| Feature | Description |
|---|---|
| **Escrow posting** | Client sends GEN with the job post; funds are held in the contract |
| **AI evaluation** | Validators fetch the evidence URL via `gl.get_webpage()`, run an LLM scoring prompt, and reach strict consensus via `gl.eq_principle.strict_eq` |
| **Manual release** | Client can bypass AI and approve payment directly |
| **On-chain chat** | Client and freelancer can message each other; messages stored in a `TreeMap` on-chain |
| **Live notifications** | Polls chain state every 15 s, fires in-app toasts on job status transitions |
| **Favorites** | Save jobs locally with heart button; filter to saved view |
| **Real-time tx status** | Consensus phase tracker — PROPOSING → COMMITTING → REVEALING → ACCEPTED |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        User's Browser                        │
│                                                             │
│  Next.js 16 (App Router) · React 19 · Tailwind CSS v4      │
│                                                             │
│   ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│   │  Wagmi   │  │  RainbowKit  │  │   @tanstack/query    │ │
│   │  + viem  │  │  (wallet UI) │  │   (server cache)     │ │
│   └────┬─────┘  └──────┬───────┘  └──────────┬───────────┘ │
│        │               │                      │             │
└────────┼───────────────┼──────────────────────┼─────────────┘
         │               │                      │
         ▼               ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    genlayer-js v1.1.8                        │
│                                                             │
│  createClient({ chain: testnetBradbury, provider, account })│
│                                                             │
│  readContract   → gen_call(type:"read")                     │
│  writeContract  → eth_sendTransaction → consensus contract  │
│  getTransaction → poll consensus status                     │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              GenLayer Bradbury Testnet (Chain ID 4221)       │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │             Consensus Main Contract                  │   │
│  │   Msgpack-encoded calldata → validator network       │   │
│  │   PROPOSING → COMMITTING → REVEALING → ACCEPTED      │   │
│  └──────────────────────────┬───────────────────────────┘   │
│                             │                               │
│  ┌──────────────────────────▼───────────────────────────┐   │
│  │              arbiq.py (Intelligent Contract)         │   │
│  │                                                      │   │
│  │  State:                                              │   │
│  │    job_count  : u256                                 │   │
│  │    jobs       : TreeMap[u256, str]  (JSON blobs)     │   │
│  │    messages   : TreeMap[u256, str]  (JSON arrays)    │   │
│  │                                                      │   │
│  │  AI method:                                          │   │
│  │    auto_evaluate → gl.nondet.exec_prompt(prompt)     │   │
│  │                  → gl.eq_principle.strict_eq(fn)     │   │
│  │                  → emit_transfer if approved         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
arbiq-freelance/
│
├── contracts/
│   └── arbiq.py                  # Intelligent Contract (Python, GenLayer)
│
├── deploy/
│   ├── deployBradbury.mjs        # Node.js deploy script (uses frontend's genlayer-js)
│   └── deployScript.ts           # Legacy deploy script
│
├── test/
│   ├── test_arbiq.py             # pytest unit tests (mock GenLayer runtime)
│   └── mock_genlayer.py          # Mock gl.* primitives for local testing
│
├── frontend/                     # Next.js application (npm workspace)
│   │
│   ├── app/
│   │   ├── layout.tsx            # Root layout — fonts, cursor, providers
│   │   ├── globals.css           # Design system — tokens, animations, utilities
│   │   ├── page.tsx              # Landing page — hero, marquee, features, stats
│   │   ├── not-found.tsx         # Custom 404
│   │   ├── dashboard/
│   │   │   └── page.tsx          # User dashboard — posted & active jobs
│   │   └── jobs/
│   │       ├── page.tsx          # Browse jobs — search, filter, favorites
│   │       ├── new/page.tsx      # Post a job form (payable)
│   │       └── [id]/page.tsx     # Job detail — status-driven action panels
│   │
│   ├── components/
│   │   ├── Navbar.tsx            # Fixed navbar — brand, nav links, notifications, wallet
│   │   ├── Footer.tsx            # Site footer — social links, product links
│   │   ├── JobCard.tsx           # Job card — budget, status badge, NEW tag, heart
│   │   ├── JobChat.tsx           # On-chain chat panel — optimistic UI, bubbles
│   │   ├── NotificationCenter.tsx # Bell icon, dropdown, toast notifications
│   │   ├── PostJobFAB.tsx        # Floating action button — appears on scroll
│   │   ├── StatusTimeline.tsx    # Visual 4-step job progress stepper
│   │   ├── ConsensusTxStatus.tsx # Live consensus phase tracker
│   │   ├── Cursor.tsx            # Custom lerp cursor (dot + ring)
│   │   └── ui/
│   │       ├── badge.tsx         # StatusBadge component
│   │       ├── input.tsx         # Styled input
│   │       └── textarea.tsx      # Styled textarea
│   │
│   ├── hooks/
│   │   ├── useArbiqContract.ts   # All read & write contract hooks
│   │   ├── useNotifications.ts   # 15s polling, state diffing, toast dispatch
│   │   ├── useLocalFavorites.ts  # localStorage-backed job favorites
│   │   ├── useScrollReveal.ts    # IntersectionObserver scroll animations
│   │   └── useCountUp.ts         # Animated number counter
│   │
│   ├── lib/
│   │   ├── genlayer/
│   │   │   └── client.ts         # genLayerClient, CONTRACT_ADDRESS, readContract()
│   │   ├── types.ts              # Job, JobStatus TypeScript types
│   │   ├── utils.ts              # truncateAddress, formatBudget, formatDeadline
│   │   └── theme-context.tsx     # Dark / light theme context + toggle
│   │
│   ├── tailwind.config.ts        # Font families, animation tokens
│   ├── postcss.config.mjs        # Tailwind v4 PostCSS plugin
│   └── package.json              # Frontend dependencies
│
├── package.json                  # Root workspace — deploy & dev scripts
├── requirements.txt              # Python deps for contract testing
├── gltest.config.yaml            # GenLayer test network config
└── pyrightconfig.json            # Pyright config for arbiq.py
```

---

## Smart Contract Design

`contracts/arbiq.py` is a **GenLayer Intelligent Contract** — a Python class that runs inside a sandboxed EVM-compatible runtime. Unlike Solidity, it can make non-deterministic calls (LLM, HTTP) that validators reach consensus on.

### State

```python
class Arbiq(gl.Contract):
    job_count: u256                  # Auto-incrementing job ID counter
    jobs:      TreeMap[u256, str]    # job_id → JSON-encoded Job object
    messages:  TreeMap[u256, str]    # job_id → JSON-encoded message array
```

Jobs are stored as JSON strings in a `TreeMap` (GenLayer's on-chain key-value store). Each job object contains:

```json
{
  "id": 0,
  "title": "...",
  "description": "...",
  "budget": 1000000000000000000,
  "deadline": "2026-06-01",
  "client": "0xabc...",
  "freelancer": "0xdef...",
  "status": "open | active | delivered | completed | disputed",
  "evidence_url": "https://...",
  "evidence_note": "...",
  "ai_reasoning": "..."
}
```

### Job Lifecycle

```
POST JOB (payable)
     │
     ▼
  [open] ──── take_job() ────► [active]
                                  │
                            submit_delivery()
                                  │
                                  ▼
                            [delivered]
                           /            \
               auto_evaluate()      release_manually()
                     │                      │
              AI consensus               Client
            /             \               │
     approved           rejected          │
         │                  │             │
         ▼                  ▼             ▼
    [completed]         [disputed]    [completed]
   funds released     funds held    funds released
```

### AI Evaluation

`auto_evaluate` is the only **non-deterministic** method. It uses GenLayer's `gl.eq_principle.strict_eq` to ensure all validator nodes independently run the same LLM prompt and must agree on the result before the transaction is finalized:

```python
def evaluate() -> str:
    prompt = f"""You are an impartial AI judge...
    Job: {title} / {description}
    Evidence: {evidence_url}
    Note: {evidence_note}
    Respond ONLY with: {{"approved": bool, "reasoning": str}}"""
    return gl.nondet.exec_prompt(prompt)

result_str = gl.eq_principle.strict_eq(evaluate)
```

If approved, the contract calls `emit_transfer` to release the escrowed GEN to the freelancer.

---

## Frontend Architecture

### Data Flow

```
Contract (on-chain)
      │
      │  readContract() — gen_call(type:"read") via genLayerClient
      ▼
useArbiqContract.ts (React Query)
      │
      │  refetchInterval: 10–15s
      ▼
Page Components (app/jobs/[id]/page.tsx, etc.)
      │
      │  render
      ▼
UI Components (JobCard, StatusTimeline, JobChat, …)
```

### Write Transaction Flow

```
User action (e.g. "Accept Job")
      │
      ▼
useContractWrite.send()
      │
      │  createClient({ provider: walletClient, account: address })
      │  writeContract() → msgpack-encode → eth_sendTransaction
      ▼
Wallet (MetaMask / WalletConnect) signs tx
      │
      ▼
GenLayer consensus contract receives tx
      │
      │  pollStatus() — getTransaction() every 1s
      ▼
txState: pending → finalizing (PROPOSING…REVEALED) → finalized
      │
      │  on finalized: queryClient.invalidateQueries(["arbiq"])
      ▼
UI re-fetches latest state
```

### Key Design Decisions

**`account` must be a plain address string** — not an account object. genlayer-js checks `isAddress` to decide whether to route signing through the browser wallet provider. Passing an object bypasses the wallet and tries to use the RPC node as a signer, which fails.

**1-second polling over `waitForTransactionReceipt`** — The library's built-in receipt waiter has a fixed 3s sleep with no live status updates. The custom `pollStatus` loop calls `getTransaction` every 1s, surfaces `consensusStatus` on every tick (PROPOSING, COMMITTING, REVEALING), and reaches finality ~3x faster.

**Optimistic chat messages** — Messages are added to local state immediately with `optimistic: true`, shown with a spinner timestamp, and deduped against confirmed messages by matching `sender + content`. When `txState.status === "finalized"`, optimistic entries are cleared and the query is invalidated.

---

## Transaction & Consensus Flow

GenLayer transactions go through 5 phases before finalization:

| Phase | Status Code | Description |
|---|---|---|
| Submitted | `PENDING` | Tx in mempool, waiting for leader validator |
| Leader runs | `PROPOSING` | Leader validator executes contract method |
| Validators lock | `COMMITTING` | Validators hash their results |
| Validators reveal | `REVEALING` | Validators reveal and compare results |
| Finalized | `ACCEPTED` | Supermajority agreed — state committed |

The `ConsensusTxStatus` component renders each phase as a live step-by-step tracker with connecting lines and colored dots (done / active / waiting).

AI evaluation (`auto_evaluate`) takes 1–5 minutes because each validator independently calls an LLM. All other writes typically finalize in 15–45 seconds.

---

## Notification System

`hooks/useNotifications.ts` polls the chain every 15 seconds using `get_jobs_by_client` and `get_jobs_by_freelancer`, then diffs the results against a `useRef` snapshot to detect job status transitions.

### Notification Types

| Type | Color | Trigger |
|---|---|---|
| `approved` | Green | Delivered → Completed (funds released) |
| `disputed` | Red | Delivered → Disputed (AI rejected) |
| `delivered` | Blue | Active → Delivered (freelancer submitted) |
| `taken` | Amber | Open → Active (freelancer accepted) |
| `stale` | Grey | Job open > 48 hours with no taker |

Notifications persist to `localStorage` under `arbiq:notifications` (latest 100 retained). The `NotificationCenter` renders a bell icon in the navbar with an unread badge count. New notifications also fire a slide-in toast (bottom-right, 5s auto-dismiss) that navigates to the relevant job on click.

---

## On-Chain Chat

Each job has a message thread stored in `messages: TreeMap[u256, str]` — a JSON array of message objects keyed by `job_id`. Messages are only accessible to the assigned client and freelancer.

```python
{
  "sender":    "0xabc...",
  "content":   "...",         # truncated to 500 chars on-chain
  "role":      "client | freelancer",
  "timestamp": 1716000000     # unix seconds from gl.message.timestamp
}
```

`JobChat.tsx` renders a fixed 440px chat panel with:
- Bubble layout (mine = violet right, theirs = surface left)
- Date dividers and role labels (YOU / CLIENT / FREELANCER)
- Optimistic message insertion with "confirming…" spinner
- Auto-resizing textarea, Enter to send / Shift+Enter for newline
- 10-second polling to pick up the other party's messages

---

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.13+ (for contract tests)
- A funded wallet on GenLayer Bradbury Testnet

### Install

```bash
# Clone the repo
git clone https://github.com/CodeWithShamim/Arbiq.git
cd arbiq-freelance

# Install frontend dependencies
npm run install:frontend

# Install Python deps (for contract testing)
python -m venv .venv
.venv/bin/pip install -r requirements.txt
```

### Run locally

```bash
# Start the Next.js dev server
npm run dev
# → http://localhost:3000
```

### Run contract tests

```bash
npm test
# runs pytest test/test_arbiq.py -v
```

---

## Environment Variables

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x<deployed-contract-address>
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<your-walletconnect-project-id>
```

Get a free WalletConnect Project ID at [cloud.walletconnect.com](https://cloud.walletconnect.com).

---

## Deployment

The deploy script imports genlayer-js from the frontend workspace (v1.1.8) which includes the Bradbury chain definition.

```bash
PRIVATE_KEY=0x<your-funded-key> node deploy/deployBradbury.mjs
```

The script will:
1. Read and encode `contracts/arbiq.py`
2. Submit a deploy transaction to Bradbury testnet
3. Poll for consensus (up to 4 minutes)
4. Extract the deployed contract address from the receipt
5. Automatically update `frontend/.env` and `frontend/.env.local`
6. Print the new `NEXT_PUBLIC_CONTRACT_ADDRESS`

After deployment, restart the dev server to pick up the new address.

> **Never store your private key in a file.** Always pass it as an environment variable in the terminal.

---

## Contract Reference

### Write Methods

| Method | Payable | Description |
|---|---|---|
| `post_job(title, description, deadline)` | Yes | Create a job; GEN sent is held in escrow |
| `post_job_milestones(title, description, deadline, milestone_titles)` | Yes | Create a job with milestone-based payments |
| `take_job(job_id)` | No | Freelancer accepts an open job |
| `submit_delivery(job_id, evidence_url, evidence_note)` | No | Freelancer marks job as delivered |
| `submit_milestone_delivery(job_id, milestone_idx, evidence_url, evidence_note)` | No | Submit delivery for a specific milestone |
| `approve_milestone(job_id, milestone_idx)` | No | Client approves and pays out a milestone |
| `auto_evaluate(job_id)` | No | Trigger AI consensus evaluation (non-deterministic) |
| `release_manually(job_id)` | No | Client manually releases payment to freelancer |
| `resubmit_delivery(job_id, evidence_url, evidence_note)` | No | Freelancer resubmits after AI dispute (max 2 attempts) |
| `send_message(job_id, content)` | No | Append a message to the job's chat thread |

### Read Methods (View)

| Method | Returns | Description |
|---|---|---|
| `get_job(job_id)` | JSON string | Single job object |
| `get_all_jobs()` | JSON string | Array of all jobs |
| `get_jobs_by_client(address)` | JSON string | Jobs posted by address |
| `get_jobs_by_freelancer(address)` | JSON string | Jobs taken by address |
| `get_messages(job_id)` | JSON string | Chat messages for a job |
| `get_job_count()` | int | Total number of jobs ever posted |
| `get_profile(address)` | JSON string | Freelancer reputation profile |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Blockchain | GenLayer Bradbury Testnet (EVM-compatible, Chain ID 4221) |
| Intelligent Contract | Python 3 · genlayer SDK (`gl.*` primitives) |
| Contract language runtime | `py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6` |
| Frontend framework | Next.js 16 (App Router) · React 19 · TypeScript 5 |
| Styling | Tailwind CSS v4 (PostCSS) · CSS custom properties |
| Fonts | Bebas Neue (display) · Darker Grotesque (body) · JetBrains Mono (mono) |
| Blockchain client | genlayer-js v1.1.8 |
| Wallet integration | wagmi v2 · viem · RainbowKit v2 |
| Server state | TanStack Query v5 |
| Notifications | sonner (toast library) |
| UI primitives | Radix UI (Dialog, Select, Label, Tooltip) · lucide-react |
| Contract testing | pytest · mock GenLayer runtime |
| Linting / types | TypeScript strict · ESLint · Pyright |

---

## Deployed Contract

### Bradbury Testnet

| Field | Value |
|---|---|
| **Network** | GenLayer Bradbury Testnet |
| **Chain ID** | 4221 |
| **Contract Address** | [`0x26517582E3B1E89F55823ba217191321992D9592`](https://explorer-bradbury.genlayer.com/address/0x26517582E3B1E89F55823ba217191321992D9592) |
| **Explorer** | [View on Bradbury Explorer ↗](https://explorer-bradbury.genlayer.com/address/0x26517582E3B1E89F55823ba217191321992D9592) |
| **Contract Source** | [`contracts/arbiq.py`](./contracts/arbiq.py) |
| **Runtime** | `py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6` |

### Verify on Explorer

You can inspect all contract transactions, state, and AI consensus results at:

```
https://explorer-bradbury.genlayer.com/address/0x26517582E3B1E89F55823ba217191321992D9592
```

Each `auto_evaluate` transaction shows the full validator consensus trace — every validator independently runs the LLM and their votes are recorded on-chain.

---

## Links

- GitHub: [github.com/CodeWithShamim/Arbiq](https://github.com/CodeWithShamim/Arbiq)
- Twitter / X: [@CodeWithShamim](https://x.com/CodeWithShamim)
- **Contract on Explorer:** [explorer-bradbury.genlayer.com/address/0x26517582E3B1E89F55823ba217191321992D9592](https://explorer-bradbury.genlayer.com/address/0x26517582E3B1E89F55823ba217191321992D9592)
- GenLayer Docs: [docs.genlayer.com](https://docs.genlayer.com)
- GenLayer Studio: [studio.genlayer.com](https://studio.genlayer.com)
