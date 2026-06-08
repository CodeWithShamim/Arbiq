<div align="center">

# Arbiq

### AI‑Enforced Freelance Escrow Marketplace on GenLayer

Post a job, lock the budget in escrow, and let an on‑chain **AI judge** decide whether the delivered work earns the payout — no central arbitrator, no manual dispute desk.

[![Network](https://img.shields.io/badge/network-GenLayer%20Bradbury-7c3aed)](https://explorer-bradbury.genlayer.com)
[![Chain ID](https://img.shields.io/badge/chain%20id-4221-38bdf8)](https://explorer-bradbury.genlayer.com)
[![Contract](https://img.shields.io/badge/contract-Python%20Intelligent%20Contract-22c55e)](contracts/arbiq.py)
[![Tests](https://img.shields.io/badge/tests-130%20passing-22c55e)](test/test_arbiq.py)
[![Frontend](https://img.shields.io/badge/frontend-Next.js%2016%20·%20React%2019-000000)](frontend)

**Live contract:** [`0x02f970fe64dbda96cc97417B3947606234b81500`](https://explorer-bradbury.genlayer.com/address/0x02f970fe64dbda96cc97417B3947606234b81500) · **v2, active since Jun 7, 2026**
<sub>previously [`0x26517582E3B1E89F55823ba217191321992D9592`](https://explorer-bradbury.genlayer.com/address/0x26517582E3B1E89F55823ba217191321992D9592) — upgraded</sub>

</div>

---

## Table of Contents

- [What is Arbiq?](#what-is-arbiq)
- [How It Works](#how-it-works)
- [Feature Overview](#feature-overview)
- [Job Lifecycle](#job-lifecycle)
- [Architecture](#architecture)
- [Repository Layout](#repository-layout)
- [Security Model](#security-model)
- [Getting Started](#getting-started)
- [Testing & Quality](#testing--quality)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Contract Reference](#contract-reference)
- [Tech Stack](#tech-stack)
- [Roadmap](#roadmap)

---

## What is Arbiq?

Traditional freelance platforms (Fiverr, Upwork) rely on a **trusted middleman** to hold funds and adjudicate disputes. Arbiq replaces that middleman with a [GenLayer](https://genlayer.com) **Intelligent Contract** — a smart contract written in Python that can call an LLM and reach deterministic consensus across validator nodes.

When a delivery is submitted, the client triggers an evaluation. Multiple validators **independently fetch the evidence URL**, run the same LLM scoring prompt against the job specification, and must agree on the result (`gl.eq_principle.strict_eq`). If the work passes, escrow is released to the freelancer automatically. If it fails, the funds stay locked and the freelancer can resubmit.

Everything — escrow, proposals, milestones, ratings, chat, and the AI verdict — lives on‑chain.

---

## How It Works

```
   CLIENT                        CONTRACT (escrow)                 FREELANCER
     │                                  │                              │
     │  post_job() + GEN value          │                              │
     ├─────────────────────────────────▶│  budget locked in escrow     │
     │                                  │◀─────────────────────────────┤ apply_to_job()
     │  accept_proposal()               │                              │
     ├─────────────────────────────────▶│  status: active              │
     │                                  │◀─────────────────────────────┤ submit_delivery(url)
     │  auto_evaluate()                 │                              │
     ├─────────────────────────────────▶│                              │
     │                          ┌───────┴────────┐                     │
     │                          │  GenLayer       │  gl.nondet.web     │
     │                          │  validators     │   gl.exec_prompt() │
     │                          │  read evidence, │   strict_eq()      │
     │                          │  score 0–10 ×5, │                    │
     │                          │  reach consensus│                    │
     │                          └───────┬────────┘                     │
     │           approved → emit_transfer(budget) ─────────────────────▶ paid
     │           rejected → status: disputed  (resubmit up to 2×)       │
     │  rate_freelancer(★)              │                              │
     └─────────────────────────────────▶│  on‑chain reputation updated │
```

---

## Feature Overview

### Marketplace core

| Feature                 | Description                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Escrow posting**      | Client sends GEN with `post_job`; the budget is locked in the contract until resolved                        |
| **Proposals & bidding** | Freelancers `apply_to_job` with a note + optional rate; the client reviews and picks one (`accept_proposal`) |
| **Milestone jobs**      | Split a budget across 2–5 milestones, each delivered and approved (and paid) independently                   |
| **On‑chain chat**       | Client ↔ freelancer messaging stored in a `TreeMap`, scoped to the two parties                               |
| **Profiles**            | Each address sets a display name, bio, and skill tags (`set_profile`)                                        |

### Payment & resolution

| Feature                 | Description                                                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **AI evaluation**       | `auto_evaluate` runs a 5‑criteria LLM rubric across validators and releases payment on approval                               |
| **Manual release**      | Client can bypass the AI and pay directly (`release_manually`)                                                                |
| **Cancel & refund**     | Client cancels an unassigned job and reclaims escrow (`cancel_job`)                                                           |
| **Deadline protection** | If an assigned freelancer never delivers past the deadline, the client reclaims escrow (`reclaim_expired`)                    |
| **Dispute resolution**  | After the freelancer exhausts resubmits, the client reclaims escrow (`reclaim_disputed`) — funds are never permanently locked |
| **Ratings & reviews**   | Client rates the freelancer 1–5★ on completion; the average is aggregated on‑chain (`rate_freelancer`)                        |
| **Reputation**          | On‑chain completion ratio + average star rating, shown across the UI                                                          |

### Experience

| Feature                    | Description                                                                  |
| -------------------------- | ---------------------------------------------------------------------------- |
| **Live consensus tracker** | PROPOSING → COMMITTING → REVEALING → ACCEPTED, surfaced during AI evaluation |
| **Notifications**          | Polls chain state and fires in‑app toasts on status transitions              |
| **Evidence preview**       | Server‑side URL/GitHub preview with SSRF protection                          |
| **Favorites & filters**    | Save jobs locally; filter by status, budget, deadline, and keyword           |
| **Light / dark theme**     | Persisted theme toggle                                                       |

---

## Job Lifecycle

```
                cancel_job                       reclaim_expired
              ┌───────────┐                    ┌───────────────┐
              ▼           │                    ▼               │
  ┌────────┐  post   ┌────┴───┐  accept   ┌────┴────┐  submit  ┌───────────┐
  │ (none) │ ──────▶ │  open  │ ────────▶ │ active  │ ───────▶ │ delivered │
  └────────┘         └────────┘ proposal  └─────────┘ delivery └─────┬─────┘
                                                                     │
                                            auto_evaluate / release  │
                                          ┌──────────────────────────┤
                                          ▼                          ▼
                                    ┌───────────┐  resubmit    ┌───────────┐
                                    │ disputed  │ ◀──────────  │ completed │ ──▶ rate_freelancer
                                    └─────┬─────┘   (≤ 2×)     └───────────┘
                          reclaim_disputed │
                                          ▼
                                    ┌───────────┐
                                    │ refunded  │
                                    └───────────┘
```

| Status      | Meaning                                                                           |
| ----------- | --------------------------------------------------------------------------------- |
| `open`      | Posted, escrow locked, accepting proposals                                        |
| `active`    | A freelancer is assigned and working                                              |
| `delivered` | Evidence submitted, awaiting client decision                                      |
| `completed` | Approved (AI or manual); freelancer paid                                          |
| `disputed`  | AI rejected the delivery; resubmit available                                      |
| `cancelled` | Client cancelled an open job, or reclaimed a missed‑deadline job; escrow refunded |
| `refunded`  | Dispute unresolved after max resubmits; escrow refunded to client                 |

---

## Architecture

```
┌──────────────────────────── Browser ────────────────────────────┐
│  Next.js 16 (App Router) · React 19 · Tailwind v4                │
│                                                                  │
│   Wagmi + viem ──┐    RainbowKit ──┐    @tanstack/react-query ──┐│
│   (tx signing)   │    (wallet UI)  │    (read cache)            ││
└──────────────────┼─────────────────┼────────────────────────────┘
                   │                 │
                   ▼                 ▼
        ┌──────────────────────────────────────┐
        │   genlayer-js  (RPC client)           │
        │   read_contract / write_contract      │
        └───────────────────┬──────────────────┘
                            │  JSON‑RPC
                            ▼
        ┌──────────────────────────────────────┐
        │   GenLayer Bradbury Testnet           │
        │   ┌────────────────────────────────┐  │
        │   │  Arbiq Intelligent Contract     │ │
        │   │  contracts/arbiq.py (Python)    │ │
        │   │  • TreeMap state                │ │
        │   │  • gl.nondet.web.render()       │ │
        │   │  • gl.exec_prompt()             │ │
        │   │  • gl.eq_principle.strict_eq()  │ │
        │   └────────────────────────────────┘  │
        │   5 validators reach consensus         │
        └──────────────────────────────────────┘

Next.js API routes (server‑side, SSRF‑guarded):
  • /api/preview-url    — evidence link / GitHub preview
  • /api/explorer-txs   — contract transaction feed
```

---

## Repository Layout

```
arbiq-freelance/
├── contracts/
│   └── arbiq.py                  # The Intelligent Contract (escrow, AI, proposals, ratings)
├── test/
│   └── test_arbiq.py             # 130 unit tests via the gltest direct runner
├── deploy/
│   ├── deployScript.ts           # Deploy helper
│   └── deployBradbury.mjs        # Bradbury testnet deploy (PRIVATE_KEY env)
├── frontend/
│   ├── app/
│   │   ├── jobs/                  # Listing, detail, post‑a‑job
│   │   ├── profile/[address]/    # Public profile + editor
│   │   ├── dashboard/ analytics/ explorer/ docs/
│   │   └── api/                  # preview-url, explorer-txs (server)
│   ├── components/               # JobCard, ProposalsPanel, RateFreelancerPanel, …
│   ├── hooks/                    # useArbiqContract (read/write hooks), useJobs, …
│   └── lib/                      # genlayer client, types, utils
├── gltest.config.yaml            # Test network config
└── package.json                  # Root scripts (deploy / test / dev)
```

---

## Security Model

Arbiq handles real escrow, so the contract and server routes are hardened against the obvious attacks:

| Surface                                   | Protection                                                                                                                                                |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AI payout abuse**                       | `auto_evaluate` is **client‑only** — a freelancer cannot force a payout on their own submission                                                           |
| **Prompt injection**                      | The evidence URL, note, and fetched page content are fenced as `<untrusted>` data; the judge is explicitly told to treat them as data, never instructions |
| **Escrow isolation**                      | Each job tracks its own `escrow_remaining`; a payout can never draw from funds escrowed for another job                                                   |
| **Locked funds**                          | Every path has an exit — cancel (open), reclaim (missed deadline), reclaim (exhausted disputes) — so escrow is never permanently stuck                    |
| **Reputation forgery**                    | `set_profile` can only edit name/bio/skills; reputation, earnings, and ratings are computed by the contract                                               |
| **SSRF** (`/api/preview-url`)             | Blocks private/loopback/link‑local/metadata IPs, re‑checks the DNS‑resolved address, and restricts to standard ports                                      |
| **Query injection** (`/api/explorer-txs`) | `page`/`limit` are clamped to bounded integers and the address is URL‑encoded                                                                             |
| **Wallet keys**                           | All writes are signed client‑side by the user's wallet; the app never holds a private key. `PRIVATE_KEY` is used only by the server‑side deploy script    |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20 and **npm**
- **Python** ≥ 3.11 (the contract toolchain targets 3.13)
- A GenLayer‑compatible wallet (e.g. MetaMask) funded with Bradbury testnet GEN

### 1. Clone and install

```bash
git clone <repo-url> arbiq-freelance
cd arbiq-freelance

# Python toolchain (contract + tests)
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Frontend
npm run install:frontend
```

### 2. Configure the frontend

Create `frontend/.env.local` with the keys below (see [Environment Variables](#environment-variables) for details):

```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0x02f970fe64dbda96cc97417B3947606234b81500
NEXT_PUBLIC_CHAIN_ID=4221
NEXT_PUBLIC_GENLAYER_RPC_URL=https://testnet-bradbury.genlayer.com/api
NEXT_PUBLIC_CHAIN_RPC_URL=https://testnet-bradbury.genlayer.com/api
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<your-walletconnect-project-id>
```

### 3. Run the dev server

```bash
npm run dev          # → http://localhost:3000
```

Connect your wallet, switch to the GenLayer Bradbury network (Chain ID `4221`), and post your first job.

---

## Testing & Quality

The contract has **130 unit tests** running against the real GenVM SDK via the `gltest` direct runner — covering escrow accounting, proposals, deadline refunds, dispute resolution, ratings, and the security guards.

```bash
npm run test     # run the full contract test suite
npm run check    # lint the contract + run the suite
npm run build    # production build of the frontend (type‑checked)
```

```
$ npm run test
130 passed in 2.0s
```

---

## Environment Variables

All frontend variables are `NEXT_PUBLIC_*` (client‑safe by design — no server secrets are exposed). Create `frontend/.env.local`:

| Variable                               | Description                                     |
| -------------------------------------- | ----------------------------------------------- |
| `NEXT_PUBLIC_CONTRACT_ADDRESS`         | Deployed Arbiq contract address                 |
| `NEXT_PUBLIC_CHAIN_ID`                 | `4221` (GenLayer Bradbury)                      |
| `NEXT_PUBLIC_GENLAYER_RPC_URL`         | GenLayer RPC endpoint                           |
| `NEXT_PUBLIC_CHAIN_RPC_URL`            | Chain RPC endpoint used by the wallet connector |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID (wallet modal)         |

For deployment only (never committed):

| Variable      | Description                                              |
| ------------- | -------------------------------------------------------- |
| `PRIVATE_KEY` | Deployer key, used solely by `deploy/deployBradbury.mjs` |

> `.env*` files are gitignored. Do not commit secrets.

---

## Deployment

```bash
# Deploy to the default network
npm run deploy

# Deploy to Bradbury testnet
npm run deploy:bradbury

# Or run the explicit Bradbury script
PRIVATE_KEY=0x<your-key> node deploy/deployBradbury.mjs
```

After deploying, update `NEXT_PUBLIC_CONTRACT_ADDRESS` in `frontend/.env.local` and rebuild.

---

## Contract Reference

> `contracts/arbiq.py` — Python Intelligent Contract. State is stored in `TreeMap` collections; jobs are JSON‑encoded per id.

### Deployments

| Version          | Address                                                                                                                                   | Status                          |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| **v2** (current) | [`0x02f970fe64dbda96cc97417B3947606234b81500`](https://explorer-bradbury.genlayer.com/address/0x02f970fe64dbda96cc97417B3947606234b81500) | ✅ **Active since Jun 7, 2026** |
| v1               | [`0x26517582E3B1E89F55823ba217191321992D9592`](https://explorer-bradbury.genlayer.com/address/0x26517582E3B1E89F55823ba217191321992D9592) | ⬆️ Superseded                   |

> GenLayer contracts are immutable once deployed, so an "upgrade" means deploying a new contract and repointing `NEXT_PUBLIC_CONTRACT_ADDRESS` at it. Jobs created on a previous deployment remain readable at its address.

### Version History

#### v2 — Marketplace & Security &nbsp;<sub>`0x83C5…D18a` · active since Jun 7, 2026</sub>

- **Proposals & bidding** — freelancers apply, the client picks (`apply_to_job`, `accept_proposal`)
- **Cancel & refunds** — `cancel_job` for open jobs; escrow returned
- **Deadline protection** — `reclaim_expired` when an assigned freelancer ghosts past the deadline
- **Dispute resolution** — `reclaim_disputed` after resubmits are exhausted (no permanently‑locked funds)
- **Profiles** — `set_profile` (display name, bio, skills)
- **Ratings & reviews** — `rate_freelancer` (1–5★), aggregated on‑chain
- **Pagination** — `get_jobs_page` (newest‑first, clamped) replaces unbounded reads
- **Security hardening** — client‑only `auto_evaluate`, prompt‑injection fencing, per‑job escrow isolation, anti‑reputation‑forgery

#### v1 — Core Escrow &nbsp;<sub>`0x2651…D9592`</sub>

- On‑chain job posting with GEN escrow
- AI consensus evaluation (`auto_evaluate`) + manual release
- Milestone jobs (split escrow, per‑milestone approval)
- Resubmit‑on‑dispute (up to 2×)
- On‑chain client ↔ freelancer chat
- Freelancer reputation score

### Writes

| Method                                                                            | Caller            | Description                                                  |
| --------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------ |
| `post_job(title, description, deadline)` _(payable)_                              | anyone            | Create a job; the sent GEN is escrowed                       |
| `post_job_milestones(title, description, deadline, milestone_titles)` _(payable)_ | anyone            | Create a milestone job (2–5 milestones); budget split evenly |
| `apply_to_job(job_id, note, bid)`                                                 | freelancer        | Submit a proposal (note + optional bid)                      |
| `accept_proposal(job_id, freelancer)`                                             | client            | Assign a freelancer from the proposals                       |
| `take_job(job_id)`                                                                | freelancer        | Direct self‑assignment (no‑proposal fallback)                |
| `cancel_job(job_id)`                                                              | client            | Cancel an open job; refund escrow                            |
| `submit_delivery(job_id, evidence_url, evidence_note)`                            | freelancer        | Submit work for an active job                                |
| `submit_milestone_delivery(job_id, idx, url, note)`                               | freelancer        | Submit a milestone delivery                                  |
| `approve_milestone(job_id, idx)`                                                  | client            | Approve & pay a milestone                                    |
| `auto_evaluate(job_id)`                                                           | **client**        | Trigger AI consensus evaluation                              |
| `release_manually(job_id)`                                                        | client            | Approve & pay without the AI                                 |
| `resubmit_delivery(job_id, url, note)`                                            | freelancer        | Resubmit after a dispute (max 2×)                            |
| `reclaim_expired(job_id)`                                                         | client            | Reclaim escrow on a missed deadline                          |
| `reclaim_disputed(job_id)`                                                        | client            | Reclaim escrow after resubmits are exhausted                 |
| `rate_freelancer(job_id, stars, review)`                                          | client            | Rate a completed job (1–5★)                                  |
| `set_profile(display_name, bio, skills)`                                          | self              | Update your public profile                                   |
| `send_message(job_id, content)`                                                   | client/freelancer | Post an on‑chain message                                     |

### Views

| Method                               | Returns                                                |
| ------------------------------------ | ------------------------------------------------------ |
| `get_job(job_id)`                    | A single job (JSON)                                    |
| `get_all_jobs()`                     | All jobs (JSON array)                                  |
| `get_jobs_page(offset, limit)`       | Paginated jobs, newest‑first (`limit` clamped to ≤ 50) |
| `get_jobs_by_client(client)`         | Jobs posted by an address                              |
| `get_jobs_by_freelancer(freelancer)` | Jobs worked by an address                              |
| `get_proposals(job_id)`              | Proposals for a job                                    |
| `get_messages(job_id)`               | Chat messages for a job                                |
| `get_profile(address)`               | Reputation, ratings, name/bio/skills                   |
| `get_job_count()`                    | Total jobs ever posted                                 |

### AI evaluation rubric

`auto_evaluate` scores the submission 0–10 on five criteria — **Relevance, Completeness, Quality, Meets Spec, Professional** — and approves when the average is ≥ 6. Validators run the same prompt over the same fetched evidence and must reach strict consensus before any payout executes.

---

## Tech Stack

| Layer                | Technologies                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Smart contract**   | Python · GenLayer Intelligent Contracts · GenVM (`gl.nondet.web.render`, `gl.nondet.exec_prompt`, `gl.eq_principle.strict_eq`) |
| **Contract testing** | `gltest` direct runner · pytest (130 tests)                                                                                    |
| **Frontend**         | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4                                                              |
| **Web3**             | wagmi · viem · RainbowKit · genlayer-js                                                                                        |
| **Data & UI**        | @tanstack/react-query · Framer Motion · Recharts · Three.js · lucide-react · sonner                                            |
| **Network**          | GenLayer Bradbury Testnet (Chain ID 4221)                                                                                      |

---

## Roadmap

See the in‑app [Roadmap](frontend/app/docs/page.tsx) for the full, living list. Highlights:

- ✅ **Shipped** — escrow, AI evaluation, milestones, proposals & bidding, cancel/refund, deadline protection, dispute resolution, profiles, ratings, on‑chain chat, security hardening
- 🚧 **In progress** — proposal/profile/rating UI polish, on‑chain job categories & skill search, contract‑level rate limiting, off‑chain notifications
- 🔭 **Planned** — mainnet deployment, embeddable job widgets, encrypted messaging, multi‑currency escrow, cross‑chain posting

---

<div align="center">

Built on [GenLayer](https://genlayer.com) — the Intelligent Blockchain.

</div>
