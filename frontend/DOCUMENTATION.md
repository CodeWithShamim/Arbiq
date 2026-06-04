# Arbiq Frontend — Technical Documentation

> **Stack:** Next.js 16 · React 19 · TypeScript 5 · Tailwind CSS v4 · wagmi v2 · genlayer-js v1.1.8
> **Network:** GenLayer Bradbury Testnet (Chain ID 4221)

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [App Entry Points](#2-app-entry-points)
3. [Provider Tree](#3-provider-tree)
4. [Design System](#4-design-system)
5. [Pages](#5-pages)
6. [Components](#6-components)
7. [Hooks](#7-hooks)
8. [Library / Utilities](#8-library--utilities)
9. [Data Flow](#9-data-flow)
10. [Contract Interaction Layer](#10-contract-interaction-layer)
11. [State Management](#11-state-management)
12. [Theming](#12-theming)
13. [Testing & Quality Checks](#13-testing--quality-checks)
14. [Adding a New Feature — Checklist](#14-adding-a-new-feature--checklist)
15. [Environment Variables](#15-environment-variables)

---

## 1. Project Structure

```
frontend/
├── app/                        # Next.js App Router pages
│   ├── layout.tsx              # Root HTML shell + fonts + global providers
│   ├── globals.css             # Entire design system (tokens, animations, utilities)
│   ├── providers.tsx           # wagmi / RainbowKit / React Query / Theme setup
│   ├── not-found.tsx           # Custom 404 page
│   ├── page.tsx                # / — Landing page
│   ├── dashboard/
│   │   └── page.tsx            # /dashboard — User's posted & active jobs
│   └── jobs/
│       ├── page.tsx            # /jobs — Browse & search all jobs
│       ├── new/
│       │   └── page.tsx        # /jobs/new — Post a new job (payable form)
│       └── [id]/
│           └── page.tsx        # /jobs/[id] — Job detail + actions
│
├── components/
│   ├── Navbar.tsx              # Fixed top nav — brand, links, notifications, wallet
│   ├── Footer.tsx              # Site footer — links, socials
│   ├── JobCard.tsx             # Job listing card + skeleton loader
│   ├── JobChat.tsx             # On-chain chat panel (client ↔ freelancer)
│   ├── NotificationCenter.tsx  # Bell icon + dropdown + slide-in toast
│   ├── PostJobFAB.tsx          # Floating "Post a Job" button (appears on scroll)
│   ├── StatusTimeline.tsx      # 4-step job progress stepper
│   ├── ConsensusTxStatus.tsx   # Live consensus phase tracker
│   ├── Cursor.tsx              # Custom lerp cursor (dot + lagging ring)
│   └── ui/
│       ├── badge.tsx           # StatusBadge — colored pill for job.status
│       ├── input.tsx           # Styled <input> wrapper
│       └── textarea.tsx        # Styled <textarea> wrapper
│
├── hooks/
│   ├── useArbiqContract.ts     # All read & write blockchain hooks
│   ├── useNotifications.ts     # 15s polling + state diff + notification queue
│   ├── useLocalFavorites.ts    # localStorage-backed job favorites
│   ├── useScrollReveal.ts      # IntersectionObserver scroll-in animations
│   └── useCountUp.ts           # Animated number counter (easeOutExpo)
│
├── lib/
│   ├── genlayer/
│   │   └── client.ts           # genLayerClient singleton + readContract() helper
│   ├── types.ts                # Shared TypeScript types (Job, JobStatus)
│   ├── utils.ts                # Pure utility functions
│   └── theme-context.tsx       # Dark/light theme React context
│
├── tailwind.config.ts          # Font family tokens + animation keyframe extensions
├── postcss.config.mjs          # Tailwind v4 PostCSS plugin config
└── tsconfig.json               # TypeScript project config (strict, path aliases)
```

---

## 2. App Entry Points

### `app/layout.tsx`

The root layout wraps every page. Responsibilities:

- Loads three Google Fonts via `<link>` tags in `<head>`:
  - **Bebas Neue** — display/headline font
  - **Darker Grotesque** — body text
  - **JetBrains Mono** — addresses, numbers, timestamps
- Renders `<Cursor />` outside `<Providers>` so the cursor is never unmounted during navigation
- Renders `<WrongNetworkBanner />` which floats under the navbar when the connected wallet is on the wrong chain

```tsx
// Simplified render tree
<html data-theme="dark">
  <head>
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&..." />
  </head>
  <body>
    <Cursor />                    {/* global cursor — always mounted */}
    <Providers>
      <WrongNetworkBanner />      {/* conditional banner */}
      {children}                  {/* page content */}
    </Providers>
  </body>
</html>
```

### `app/globals.css`

Single source of truth for the entire design system. Contains:

- **Brand tokens** — `--violet-900` through `--violet-300`
- **Theme tokens** — all `--bg-*`, `--border-*`, `--text-*`, `--surface-*` CSS variables
- **Dark theme** on `:root` (default) — overridden by `[data-theme="light"]`
- **Keyframe animations** — `fadeUp`, `brandPulse`, `orbFloat`, `marquee`, `orbit1/2/3`, `dotPulse`, etc.
- **Utility classes** — `.btn-primary`, `.input-field`, `.card-lift`, `.pill`, `.shimmer`, `.reveal/.revealed`, `.orbit-dot`, `.consensus-*`, `.marquee-track`, `.dot-grid`
- **Custom cursor styles** — `#cursor-dot` (8px, `mix-blend-mode: difference`) and `#cursor-ring` (36px, transparent)

---

## 3. Provider Tree

```
app/providers.tsx
│
└── ThemeProvider                    (lib/theme-context.tsx)
    │  Reads localStorage("arbiq-theme") on mount
    │  Sets data-theme on <html>
    │
    └── WagmiProvider
        │  config: getDefaultConfig({ chains: [bradburyTestnet] })
        │  ssr: true — avoids hydration mismatch
        │
        └── QueryClientProvider
            │  staleTime: 10_000ms · retry: 2
            │
            └── RainbowKitProvider
                │  Theme synced to arbiq dark/light via useTheme()
                │  initialChain: 4221 (Bradbury)
                │
                ├── NetworkEnforcer          (invisible component)
                │   Calls switchChain() automatically when wallet
                │   is connected to a chain other than Bradbury
                │
                ├── ToasterWithTheme         (sonner Toaster)
                │   Styled to match current theme
                │
                └── {children}              (page content)
```

**Why this order matters:**
- `ThemeProvider` must be outermost so RainbowKit can read the current theme when it mounts
- `WagmiProvider` must wrap `QueryClientProvider` because wagmi hooks use React Query internally
- `RainbowKitProvider` must be inside wagmi

---

## 4. Design System

### CSS Variables (tokens)

All color, surface, and border values are CSS custom properties. Never hard-code colors in components — always reference a token.

| Category | Variables | Example |
|---|---|---|
| Backgrounds | `--bg-primary`, `--bg-surface`, `--bg-elevated`, `--bg-hover` | `background: var(--bg-primary)` |
| Borders | `--border-subtle`, `--border-mid`, `--border-strong`, `--border-divider` | `border: 1px solid var(--border-mid)` |
| Text | `--text-primary`, `--text-secondary`, `--text-muted`, `--text-label`, `--text-label-dim` | `color: var(--text-muted)` |
| Surfaces | `--surface-card`, `--surface-raised`, `--surface-subtle` | `background: var(--surface-card)` |
| Brand | `--violet-300` through `--violet-900` | `color: var(--violet-400)` |
| Semantic | `--color-success`, `--color-danger`, `--color-warning`, `--color-info` | glow and badge colors |
| Nav | `--nav-bg`, `--nav-border` | navbar backdrop |

### Typography

| Font | CSS family | Use |
|---|---|---|
| Bebas Neue | `font-display` / `"Bebas Neue"` | Page headings (`<h1>` hero, section titles) |
| Darker Grotesque | `font-body` / `font-sans` | All body text, labels, buttons |
| JetBrains Mono | `font-mono` | Wallet addresses, GEN amounts, timestamps, tx hashes |

### Animation Classes

| Class | Effect |
|---|---|
| `.anim-fade-up` | Fade in + slide up 28px (0.55s spring) |
| `.anim-scale-in` | Scale from 94% to 100% (0.35s spring) |
| `.anim-orb-float` | Slow 12s floating translate loop |
| `.anim-pulse-ring` | Expanding ring glow (used on active step) |
| `.anim-marquee` | Horizontal infinite scroll (28s) |
| `.reveal` + `.revealed` | Scroll-triggered: starts hidden, `revealed` class animates in |
| `.shimmer` | Gradient sweep skeleton loader |
| `.card-lift` | Hover: translateY(-4px) + shadow |

### Dot Grid

Apply `.dot-grid` on a container to get the purple radial dot pattern background:

```tsx
<div className="dot-grid absolute inset-0 pointer-events-none" />
```

### Orbs

Floating blurred color blobs for hero sections:

```tsx
<div className="orb orb-violet absolute w-96 h-96 -top-20 -right-20 opacity-20 anim-orb-float" />
<div className="orb orb-indigo absolute w-72 h-72 bottom-0 left-0 opacity-15 anim-orb-float" />
```

Available: `.orb-violet`, `.orb-indigo`, `.orb-pink`

---

## 5. Pages

### `app/page.tsx` — Landing Page (`/`)

**Sections (top to bottom):**

1. **Hero** — dot grid + floating orbs + Bebas Neue headline `"FREELANCE JUSTICE."` (whitespace-nowrap, single line) + two CTA buttons
2. **Marquee** — infinite scrolling tech tag strip (16 items = 8 unique × 2 for seamless loop, `translateX(-50%)` rollback)
3. **Features** — 6 cards in 3-col grid, all `.reveal` classed, animated in by `useScrollReveal`
4. **AI Verdict Panel** — mock example verdict card showing what AI evaluation looks like
5. **How It Works** — 5-step timeline with staggered reveal
6. **Live Stats** — `useCountUp` animated numbers, triggered by `useScrollReveal` intersection

**Key patterns:**
- Uses `useScrollReveal<HTMLDivElement>()` for features and timeline sections
- `LiveStats` component reads job count from chain via `useGetJobCount()`
- `useCountUp(target, 900, trigger)` — trigger = whether the section is visible

---

### `app/dashboard/page.tsx` — Dashboard (`/dashboard`)

Shows jobs the connected wallet has posted and jobs they are working on.

```
useAccount()                  → address
useGetMyJobs(address)         → { postedJobs, activeJobs }
```

`useGetMyJobs` is a derived hook — it calls `useGetAllJobs()` and filters locally by `client` and `freelancer` address. No separate contract call.

**Layout:**
- Header with Bebas Neue "DASHBOARD" + dot grid
- 4 stat cards: Total Posted, Active, Completed, Earned
- Two `JobCard` grids: "Posted by You" and "Working On"
- `<PostJobFAB />` and `<Footer />`

---

### `app/jobs/page.tsx` — Browse Jobs (`/jobs`)

**Features:**
- Search by title or description (client-side filter on `allJobs`)
- Sort by: Newest / Budget High-Low / Budget Low-High / Deadline
- Status filter tabs: All / Open / Active / Delivered / Completed
- Saved filter: shows only favorited jobs (from `useLocalFavorites`)
- Result count display: `"SHOWING N JOBS"`
- Empty state varies: "no saved jobs" vs "no results" vs "no jobs on chain yet"

**Important:** The search `<input>` uses fully inline styles with `boxSizing: 'border-box'` and `flex: '1 1 0'` on its wrapper — not the `.input-field` CSS class, which sets `width: 100%` and breaks the flex layout when sibling buttons are present.

---

### `app/jobs/new/page.tsx` — Post a Job (`/jobs/new`)

Form fields:
- **Title** — min 3 chars (validated on contract)
- **Description** — min 20 chars (validated on contract)
- **Deadline** — date input, required
- **Budget** — GEN amount in ETH units, converted via `parseEther()`

On submit: calls `usePostJob().postJob(params)` which sends a payable `eth_sendTransaction`. The `<ConsensusTxStatus />` component shows live phase progress. On finalization, the user is redirected to the new job's detail page.

---

### `app/jobs/[id]/page.tsx` — Job Detail (`/jobs/[id]`)

The most complex page. Uses `use(params)` (React 19 async params unwrap) to get `id`.

**Status-driven action panels:**

| Job Status | Who sees what |
|---|---|
| `open` | Client: "Awaiting Freelancer" message. Others: "Accept & Start Working" button |
| `active` | Freelancer: delivery submission form. Client: waiting message |
| `delivered` | Client: AI Evaluate button + Manual Approve button. Freelancer: waiting message |
| `completed` | Green panel with AI reasoning |
| `disputed` | Red panel with AI reasoning + disabled "Appeal" button |

**Chat section** — Appears at the bottom for both client and freelancer once a freelancer has accepted (`job.freelancer` is non-empty):

```tsx
{job.freelancer && (isClient || isFreelancer) && (
  <JobChat
    jobId={jobId}
    address={address!}
    clientAddress={job.client}
    freelancerAddress={job.freelancer}
  />
)}
```

**Helper components** defined inline in this file:
- `MetaItem` — renders a label/value pair with optional copy button
- `ShareButton` — copies URL or uses `navigator.share()`
- `Section` — card wrapper with title and optional accent color border
- `ActionButton` — primary gradient button with loading state

---

### `app/not-found.tsx` — 404 Page

- Bebas Neue "404" with gradient text (`-webkit-background-clip: text`)
- Dot grid background + violet orb
- Two CTAs: "Back to Home" and "Browse Jobs"

---

## 6. Components

### `Navbar.tsx`

Fixed at `top: 0, z-index: 50`. Height: 60px. Backdrop blur via `backdropFilter: "blur(24px) saturate(200%)"`.

**Sections (left to right):**
1. **Brand** — pulsing violet dot (`brandPulse` animation) + Bebas Neue "ARBIQ"
2. **Center nav links** — Home / Browse / Dashboard; active link gets violet tint + border background
3. **Right side:**
   - "Post" shortcut link (hidden on mobile)
   - `<NotificationCenter />` — bell with unread badge
   - Theme toggle button (Sun/Moon icon)
   - `<ConnectButton.Custom>` — three states: disconnected / wrong chain / connected

---

### `JobCard.tsx`

Props: `{ job: Job }`

**Internal logic:**
- `useDeadlineInfo(deadline)` — returns `{ label, urgent, color }` based on days remaining. Overdue = red, ≤2d = amber, ≤7d = orange
- `isNewJob(createdAt)` — returns `true` if `ageHours < 48`
- `useLocalFavorites()` — reads localStorage favorites, provides `toggle(id)`

**Visual states:**
- Hover: `card-lift` class (translateY -4px) + violet radial glow overlay
- NEW badge: violet pill in top-left alongside StatusBadge
- Heart button: hidden until hover (`opacity-0 group-hover:opacity-100`), filled red when favorited
- Deadline pill: urgent = colored background + AlertTriangle icon

**`JobCardSkeleton`** — exported alongside, renders shimmer placeholders at fixed 196px height. Used in loading states on browse and dashboard pages.

---

### `JobChat.tsx`

Props: `{ jobId: number, address: string, clientAddress: string, freelancerAddress: string }`

Fixed 440px height flex column: header → scrollable messages → input form.

**Optimistic UI:**
```
User sends message
      │
      ├── Appends to optimisticMsgs[] with { optimistic: true, timestamp: now }
      ├── Shows bubble immediately with Loader2 spinner + "confirming…" text
      │
      └── sendMessage(jobId, content) called
            │
            └── txState.status === "finalized"
                  │
                  ├── setOptimisticMsgs([])
                  ├── reset()
                  └── queryClient.invalidateQueries(["arbiq", "messages", jobId])
```

Dedup logic prevents duplicate display: `optimisticMsgs` filtered to exclude any message where `sender + content` already exists in confirmed `messages`.

**Message grouping rules:**
- Date divider shown when date changes between messages (`shouldShowDateDivider`)
- Role label (YOU / CLIENT / FREELANCER) shown when sender changes or date divider appears

**Textarea behavior:** `useEffect` on `input` value resizes height to `Math.min(scrollHeight, 120)px`. Enter submits, Shift+Enter inserts newline.

---

### `NotificationCenter.tsx`

Exports two components:

#### `NotificationCenter`
Renders the bell button in the Navbar. Manages dropdown open/close with outside-click detection (`mousedown` listener on `document`).

**Bell badge:** `position: absolute`, top-right of bell button. Shows unread count. Capped at `"99+"`.

**Dropdown panel:** `position: absolute`, `top: calc(100% + 10px)`, `right: 0`. 360px wide, max 400px scrollable. Sorted newest-first. Each item is a `NotificationItem` button that calls `markAllRead()` then navigates.

#### `NotificationToast`
Slide-in toast anchored `fixed bottom-right`. Uses CSS `transform: translateY(calc(100% + 24px))` → `translateY(0)` transition triggered by a 30ms `setTimeout` after mount (forces reflow before animation). Auto-dismisses after 5s.

---

### `ConsensusTxStatus.tsx`

Props: `{ status, txHash, error?, finalizingLabel? }`

Renders nothing when `status === "idle"`.

**Phase animation:** While `status === "finalizing"`, an internal `animPhase` counter advances through phases 0→5 via `setTimeout` delays `[800, 1800, 3200, 5000]` ms. This produces a visual progress animation independent of actual chain phase, since the chain doesn't report sub-phases in real time.

**Phase visual states:**
- **Done** — green checkmark dot + green label
- **Active** — colored border + pulsing dot + animated trailing dots (`phase-dots::after`)
- **Waiting** — grey dot, 50% opacity label

**Explorer link:** `https://explorer-bradbury.genlayer.com/tx/{txHash}` — opens in new tab.

---

### `StatusTimeline.tsx`

Props: `{ status: JobStatus }`

Maps status to step index via `ORDER` record:
```ts
const ORDER: Record<JobStatus, number> = {
  open: 0, active: 1, delivered: 2, completed: 3, disputed: 3,
};
```

Both `completed` and `disputed` land on step index 3 ("Evaluated"), but `disputed` renders a red "!" icon and red label instead of a checkmark.

Connector lines between steps are filled with a violet gradient when the step is `done` (using CSS `width` transition).

---

### `Cursor.tsx`

Renders two `<div>` elements (`#cursor-dot`, `#cursor-ring`) positioned `fixed` via inline styles. Styled in `globals.css`.

**How lerp works:**
- `mousemove` → snaps `#cursor-dot` to exact cursor position instantly
- `requestAnimationFrame` loop → each frame: `rx += (mx - rx) * 0.12` — the ring moves 12% of the remaining distance per frame, creating natural lag

The ring has `mix-blend-mode: difference` which makes it invert colors under the cursor — visible on both dark and light backgrounds. Both elements are hidden on touch devices via `@media (hover: none) { display: none }` in CSS.

---

### `PostJobFAB.tsx`

Floating action button fixed at `bottom: 6, right: 6, z-index: 40`.

Visible after `window.scrollY > 200`. Uses CSS `opacity` + `transform` transition:
- Hidden: `opacity: 0, transform: translateY(12px) scale(0.95), pointerEvents: none`
- Visible: `opacity: 1, transform: translateY(0) scale(1), pointerEvents: auto`

Added to Browse Jobs (`/jobs`) and Dashboard (`/dashboard`) pages.

---

### `Footer.tsx`

Three-column layout at `mt-16` from page content above. Columns:
1. **Brand** — ARBIQ name + tagline + social links (GitHub + X/Twitter)
2. **Product** — Browse Jobs, Post a Job, Dashboard
3. **GenLayer** — Explorer, Docs, Studio

---

### `ui/badge.tsx` — `StatusBadge`

Maps `JobStatus` to a pill with color, background and border:

| Status | Color | Background |
|---|---|---|
| `open` | `#38bdf8` (sky blue) | `rgba(56,189,248,0.10)` |
| `active` | `#f59e0b` (amber) | `rgba(245,158,11,0.10)` |
| `delivered` | `#fb923c` (orange) | `rgba(251,146,60,0.10)` |
| `completed` | `#22c55e` (green) | `rgba(34,197,94,0.10)` |
| `disputed` | `#ef4444` (red) | `rgba(239,68,68,0.10)` |

---

## 7. Hooks

### `useArbiqContract.ts`

Central contract interaction module. All reads go through React Query; all writes go through a shared `useContractWrite` factory.

#### Read hooks

| Hook | Query key | Contract method | Refetch interval |
|---|---|---|---|
| `useGetAllJobs()` | `["arbiq", "allJobs"]` | `get_all_jobs` | 15s |
| `useGetJob(id)` | `["arbiq", "job", id]` | `get_job` | 10s |
| `useGetMyJobs(address)` | — (derived from `useGetAllJobs`) | filters client-side | same as allJobs |
| `useGetJobCount()` | `["arbiq", "jobCount"]` | `get_job_count` | 30s |
| `useGetMessages(jobId)` | `["arbiq", "messages", jobId]` | `get_messages` | 10s |

#### Write hooks

All write hooks share the same `useContractWrite()` factory which:
1. Creates a per-call `writeClient` with `{ provider: walletClient, account: address }` — uses wagmi's EIP-1193 wallet provider
2. Calls `writeClient.writeContract()` — msgpack-encodes args, sends `eth_sendTransaction`
3. Polls `getTransaction()` at 1-second intervals via `pollStatus()`
4. Updates `txState` on every poll tick

| Hook | Function | Contract method | Retries |
|---|---|---|---|
| `usePostJob()` | `postJob(params)` | `post_job` (payable) | 90s |
| `useTakeJob()` | `takeJob(jobId)` | `take_job` | 90s |
| `useSubmitDelivery()` | `submitDelivery(jobId, url, note)` | `submit_delivery` | 90s |
| `useAutoEvaluate()` | `autoEvaluate(jobId)` | `auto_evaluate` | 300s |
| `useRelease()` | `release(jobId)` | `release_manually` | 90s |
| `useSendMessage()` | `sendMessage(jobId, content)` | `send_message` | 90s |

`useAutoEvaluate` uses 300s retries because AI evaluation requires multiple validator nodes to run an LLM independently and reach consensus — typically 1–5 minutes.

#### `TxState` shape

```ts
interface TxState {
  txHash: TransactionHash | null;
  status: "idle" | "pending" | "finalizing" | "finalized" | "error";
  consensusStatus: string | null;  // "PROPOSING", "COMMITTING", "REVEALING", "ACCEPTED"
  returnValue: unknown | null;     // leader receipt result (e.g. job_id from post_job)
  error: string | null;
}
```

---

### `useNotifications.ts`

Polls the chain every 15 seconds using `get_jobs_by_client(address)` + `get_jobs_by_freelancer(address)`. Merges and deduplicates results by `job.id`, then diffs against a `useRef` snapshot.

**Initialization guard:** The first poll populates `prevJobsRef` without firing any notifications. This prevents a flood of stale notifications on page load.

**Transition detection (`detectTransition`):**

| Role | Prev status → Next status | Notification type |
|---|---|---|
| Client | `open` → `active` | `taken` |
| Client | `active` → `delivered` | `delivered` |
| Client | `delivered` → `completed` | `approved` |
| Client | `delivered` → `disputed` | `disputed` |
| Freelancer | `delivered` → `completed` | `approved` |
| Freelancer | `delivered` → `disputed` | `disputed` |

**Stale job detection:** Fires a `stale` notification for open jobs where `client === address` and `created_at` is more than 48 hours ago. Uses `staleNotifiedRef` to only fire once per job per session.

**Persistence:** Notifications stored in `localStorage` under `arbiq:notifications`. Limited to latest 100 entries. Loaded on mount via `useEffect`.

**Exports:** `{ notifications, unreadCount, newToast, markAllRead, dismissToast }`

---

### `useLocalFavorites.ts`

Manages a `Set<number>` of favorited job IDs persisted to `localStorage` under `arbiq:favorites`.

Hydrated in `useEffect` (not during render) to avoid SSR mismatch. `toggle(id)` creates a new `Set` (immutable pattern), persists, and updates state.

```ts
const { isFavorite, toggle, favorites } = useLocalFavorites();
isFavorite(job.id);   // → boolean
toggle(job.id);       // → adds or removes
```

---

### `useScrollReveal.ts`

Returns a `ref` to attach to a container element. Watches all `.reveal` children with `IntersectionObserver` (`threshold: 0.12`, `rootMargin: "0px 0px -40px 0px"`).

When an element enters the viewport, adds `.revealed` class after a staggered delay: `idx * staggerMs` (default 80ms). The CSS transition on `.reveal` → `.revealed` handles the animation.

```tsx
const sectionRef = useScrollReveal<HTMLDivElement>(80);

<div ref={sectionRef}>
  <div className="reveal">Card 1</div>  {/* animates at 0ms */}
  <div className="reveal">Card 2</div>  {/* animates at 80ms */}
  <div className="reveal">Card 3</div>  {/* animates at 160ms */}
</div>
```

---

### `useCountUp.ts`

Animates from `0` to `target` over `duration` ms using `requestAnimationFrame` and an easeOutExpo curve.

```ts
const count = useCountUp(target, 900, isVisible);
```

- `target` — the final number
- `duration` — animation length in ms (default 900)
- `trigger` — boolean; animation only starts when `true` (pair with `useScrollReveal` intersection)

Used in `LiveStats` on the landing page to animate job counts when the section scrolls into view.

---

## 8. Library / Utilities

### `lib/genlayer/client.ts`

Single module that owns the read-only genlayer-js client. Everything else imports from here.

```ts
export const genLayerClient = createClient({ chain: testnetBradbury });
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

// Shared read helper — used by useArbiqContract and useNotifications
export async function readContract(method: string, args: CalldataEncodable[] = []): Promise<unknown> {
  return genLayerClient.readContract({ address: CONTRACT_ADDRESS, functionName: method, args });
}
```

`readContract` is exported so both `useArbiqContract.ts` and `useNotifications.ts` share the same implementation without duplication.

---

### `lib/types.ts`

```ts
export type JobStatus = "open" | "active" | "delivered" | "completed" | "disputed";

export interface Job {
  id: number;
  title: string;
  description: string;
  budget: number;          // wei (1e18 = 1 GEN)
  deadline: string;        // ISO date string "YYYY-MM-DD"
  client: string;          // 0x address (lowercase hex from chain)
  freelancer: string;      // 0x address or "" if no freelancer yet
  status: JobStatus;
  evidence_url: string;
  evidence_note: string;
  ai_reasoning: string;
  created_at: string;
  updated_at: string;
}
```

---

### `lib/utils.ts`

| Function | Signature | Description |
|---|---|---|
| `cn` | `(...inputs: ClassValue[]) => string` | `clsx` + `twMerge` — safe className composition |
| `truncateAddress` | `(address, chars = 4) => string` | `"0xABCD...1234"` format |
| `formatBudget` | `(wei: number) => string` | Converts wei to GEN: `"1.5 GEN"` |
| `formatDeadline` | `(dateStr: string) => string` | Locale-formatted date: `"Jun 1, 2026"` |
| `isDeadlinePast` | `(dateStr: string) => boolean` | `true` if deadline < now |

---

### `lib/theme-context.tsx`

Context + provider for dark/light theme. `data-theme` attribute is set directly on `document.documentElement` so CSS `[data-theme="light"]` selectors work without a class.

Persisted to `localStorage` under `arbiq-theme`. Falls back to `prefers-color-scheme` system preference on first visit.

```tsx
const { theme, toggle } = useTheme();
// theme: "dark" | "light"
// toggle(): flips theme, saves to localStorage, updates data-theme attribute
```

---

## 9. Data Flow

### Reading data

```
Component mounts
      │
      ▼
useGetAllJobs() / useGetJob(id) / useGetMessages(jobId)
      │
      │  React Query checks cache
      │  Cache miss / stale → readContract(method, args)
      │
      ▼
genLayerClient.readContract()
      │
      │  gen_call(type:"read") → RPC node
      │  msgpack response decoded
      │
      ▼
raw data (string / number / array)
      │
      │  parseJobsJson() / parseJobJson() / JSON.parse()
      │
      ▼
typed Job[] | Job | ChatMessage[] returned to component
      │
      │  React Query caches, refetches at interval
      ▼
Component re-renders with fresh data
```

### Writing data

```
User triggers action (button click / form submit)
      │
      ▼
Hook's write function called (e.g. postJob, takeJob)
      │
      ▼
useContractWrite.send({ functionName, args, value?, retries? })
      │
      ├── txState → "pending"
      │
      ▼
createClient({ provider: walletClient, account: address })
      │
      │  account is a plain string → isAddress=true
      │  → signing routed through browser wallet (not RPC node)
      │
      ▼
writeClient.writeContract({ address, functionName, args, value })
      │
      │  msgpack-encodes payload
      │  → eth_sendTransaction to consensus contract
      │  → wallet signs & broadcasts
      │  → returns GenLayer txId (not EVM tx hash)
      │
      ├── txState.txHash = txId
      │
      ▼
pollStatus(txHash, retries) — runs asynchronously
      │
      │  getTransaction({ hash }) every 1 second
      │
      ├── txState.consensusStatus updated each tick
      │   ("PROPOSING", "COMMITTING", "REVEALING", ...)
      │
      └── isDecidedState(status) === true
            │
            ├── txState → "finalized"
            ├── extract returnValue from leader_receipt
            └── queryClient.invalidateQueries(["arbiq"])
                  └── triggers refetch of all cached contract data
```

---

## 10. Contract Interaction Layer

### Why `account` must be a plain string

genlayer-js checks `typeof account === "string" && isAddress(account)` to set an internal `isAddress` flag. When `isAddress=true`, transaction signing is delegated to the `provider` (the wagmi wallet client). When `isAddress=false` (object passed), the library tries to use the RPC node as a signer — which has no keys and returns `"node has no signer accounts"`.

```ts
// Correct
createClient({ chain: testnetBradbury, provider: walletClient, account: address })
//   ↑ address is "0xabc..." string — routes signing through MetaMask/wallet

// Wrong — breaks signing
createClient({ chain: testnetBradbury, account: { address, ... } })
//   ↑ account is an object — isAddress=false — tries to sign at RPC node
```

### Why polling at 1s instead of `waitForTransactionReceipt`

The built-in `client.waitForTransactionReceipt` sleeps 3 seconds between polls with no way to observe intermediate states. The custom `pollStatus` loop:
- Polls every 1 second → finality detected ~3x faster on average
- Calls `setTxState` with `consensusStatus` on every tick → UI shows live phase (PROPOSING, COMMITTING, etc.)
- Handles 404 errors gracefully (the tx may not be indexed immediately after submission)

### Understanding the returned `txHash`

The value returned by `writeContract()` is **not** a standard EVM transaction hash. It is a GenLayer-specific transaction ID (a `bytes32` identifier derived from the consensus contract's `CreatedTransaction` event log). It is used for polling `getTransaction()` and for the explorer link — but it cannot be looked up on a standard EVM block explorer.

---

## 11. State Management

| Layer | Tool | Scope |
|---|---|---|
| Server/chain state | TanStack Query | Cached contract reads, auto-refetch |
| Wallet state | wagmi | Connected address, chain, wallet client |
| Transaction state | local `useState` in `useContractWrite` | Per-hook tx lifecycle |
| Theme | React Context (`ThemeContext`) | Global, persisted to localStorage |
| Notifications | local `useState` + `localStorage` | Global, persisted |
| Favorites | local `useState` + `localStorage` | Global, persisted |
| Optimistic messages | local `useState` in `JobChat` | Per-component, ephemeral |
| Form inputs | local `useState` per page | Per-page, ephemeral |

No global state library (Redux, Zustand) is used. Chain data + wallet state cover the shared concerns; everything else is local.

---

## 12. Theming

The theme system uses a `data-theme` attribute on `<html>` combined with CSS custom properties. Both themes define the same variable names — components always reference variables, never raw colors.

```
User clicks theme toggle
      │
      ▼
useTheme().toggle()
      │
      ├── Flips "dark" ↔ "light"
      ├── document.documentElement.setAttribute("data-theme", next)
      │     → CSS [data-theme="light"] selectors activate
      └── localStorage.setItem("arbiq-theme", next)
            → Persists across sessions
```

RainbowKit's theme (`darkTheme` / `lightTheme`) is swapped synchronously in `RainbowWrapper` by reading `useTheme()`. Both use `accentColor: "#7c3aed"` to keep the violet brand across wallet modals.

---

## 13. Testing & Quality Checks

All contract quality checks are run from the repo root (not from `frontend/`).

### One command

```bash
npm run check
```

Runs in sequence:

1. **`genvm-lint lint contracts/arbiq.py`** — fast AST safety checks (~0.1s, fails early)
2. **`gltest test/test_arbiq.py -v`** — 105 unit tests with the real GenVM SDK (~2s)

### Test infrastructure

Tests use **gltest direct mode** — the official `gltest` pytest plugin that loads the real `genlayer-py-std` SDK from a local GitHub release cache (`~/.cache/gltest-direct`). No testnet connection needed.

```
test/
├── test_arbiq.py      # 105 tests across 13 test classes
└── mock_genlayer.py   # Compatibility shim (no longer active)
```

#### Test fixtures

| Fixture | Provided by | Purpose |
|---|---|---|
| `direct_vm` | `gltest.direct` | `VMContext` — set sender, value, mock LLM/web |
| `direct_deploy` | `gltest.direct` | Deploy contract from path, returns proxy instance |

#### Mocking non-deterministic calls

```python
# Mock any LLM prompt (regex pattern)
direct_vm.mock_llm(".*", json.dumps({
    "approved": True,
    "reasoning": "Work looks good.",
    "scores": {"relevance": 8, "completeness": 8, "quality": 8,
               "meets_spec": 8, "professional": 8},
    "confidence": "high",
}))

# Mock web URL fetch (regex pattern)
direct_vm.mock_web(".*github.*", {"method": "GET", "status": 200, "body": "# Done"})

# Clear between phases when a test needs different responses
direct_vm.clear_mocks()
```

#### Setting message context

```python
direct_vm.sender = _addr(_CLIENT_BYTES)   # Address object
direct_vm.value  = 1000                   # payable amount (GEN tokens)
```

#### Test class breakdown

| Class | Count | Covers |
|---|---|---|
| `TestPostJob` | 11 | Validation, field defaults, whitespace stripping |
| `TestPostJobMilestones` | 9 | Budget split, remainder, min/max milestone guards |
| `TestTakeJob` | 6 | Happy path, self-take, double-take, nonexistent |
| `TestSubmitDelivery` | 7 | Happy path, auth, open-job guard, blank URL |
| `TestSubmitMilestoneDelivery` | 9 | Happy path, index bounds, non-milestone job |
| `TestApproveMilestone` | 9 | Payment per milestone, completion, double-approve guard |
| `TestAutoEvaluate` | 15 | Score avg logic, AI field persistence, edge cases |
| `TestReleaseManually` | 6 | Auth, reasoning field, profile update |
| `TestResubmitDelivery` | 6 | Field clearing, max-2 cap |
| `TestMessaging` | 8 | Accumulation, 500-char truncation, open-job guard |
| `TestGetProfile` | 5 | Defaults, reputation score formula |
| `TestViewMethods` | 9 | All view helpers, case-insensitive filter |
| `TestFullLifecycle` | 6 | End-to-end paths: AI, manual, dispute→resubmit, milestones |

#### AI score approval logic

The contract recomputes approval from 5 scores (ignoring the `"approved"` field):

```
avg = sum(scores.values()) / 5
approved = avg >= 6.0
```

Tested boundaries: avg 4.6 → `disputed`, avg 6.0 → `completed`, avg 8.0 → `completed`.

### Running individual steps

```bash
# Lint only (fast, no SDK)
npm run lint

# Tests only
npm test
```

---

## 14. Adding a New Feature — Checklist

### New contract method (read)

1. Add Python method to `contracts/arbiq.py`
2. Run `npm run check` — lint + full test suite must pass
3. Deploy updated contract, update `NEXT_PUBLIC_CONTRACT_ADDRESS`
4. In `useArbiqContract.ts`: add `useQuery` hook calling `readContract("method_name", [args])`
5. Add parser function if response needs transformation
6. Use the hook in your page/component

### New contract method (write)

1. Add Python method to `contracts/arbiq.py` (with `@gl.public.write`)
2. Add tests for the new method in `test/test_arbiq.py`
3. Run `npm run check` — must pass before deploying
4. Deploy and update address
5. In `useArbiqContract.ts`: add hook that calls `useContractWrite().send({ functionName, args })`
6. Render `<ConsensusTxStatus status={txState.status} txHash={txState.txHash} />` next to the action button

### New page

1. Create `app/<route>/page.tsx`
2. Add `"use client"` if it needs hooks
3. Include `<Navbar />` and `<Footer />` at top and bottom
4. Add dot grid + Bebas Neue header section to match design system
5. Add route to `navLinks` in `Navbar.tsx` if it should appear in the nav

### New notification type

1. Add type to `NotificationType` union in `useNotifications.ts`
2. Add color to `TYPE_DOT` record in `NotificationCenter.tsx`
3. Add message template to `buildNotification()` `messages` map
4. Wire the detection condition into `detectTransition()` or a new detector function

---

## 15. Environment Variables

Create `frontend/.env.local` (never commit this file):

```env
# Required — deployed arbiq.py contract address on Bradbury testnet
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...

# Required — WalletConnect Cloud project ID
# Get one free at https://cloud.walletconnect.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
```

Both variables are prefixed `NEXT_PUBLIC_` so they are embedded into the client bundle at build time. They are read at runtime from `process.env.NEXT_PUBLIC_*`.

If `NEXT_PUBLIC_CONTRACT_ADDRESS` is missing, `client.ts` falls back to `"0x000...000"` — all contract calls will return empty data, which is handled gracefully by the parse functions.

If `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is missing, it falls back to `"arbiq_dev_placeholder"` — WalletConnect connections will fail in production but MetaMask (injected) still works locally.
