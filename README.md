Arbiq Freelance

## Quick Commands

```bash
# From arbiq-freelance/ root:
npm run deploy           # Deploy arbiq.py to GenLayer testnet
npm run dev              # Start Next.js dev server (port 3000)
npm install:frontend     # Install frontend deps

# From frontend/:
npm run dev
npm run build
```

## Architecture

```
contracts/arbiq.py       # Python intelligent contract (GenLayer)
frontend/                # Next.js 16 app (TypeScript, Tailwind 4, wagmi, genlayer-js)
  app/
    page.tsx             # Landing page
    jobs/page.tsx        # Browse jobs (with filter + search)
    jobs/new/page.tsx    # Post a job (payable form)
    jobs/[id]/page.tsx   # Job detail (status-driven actions)
    dashboard/page.tsx   # User dashboard (posted + working jobs)
  components/
    Navbar.tsx           # Fixed nav with wallet connect
    JobCard.tsx          # Job card + skeleton loader
    StatusTimeline.tsx   # Visual 4-step progress stepper
    ui/                  # button, badge, card, input, textarea
  hooks/
    useArbiqContract.ts  # All read & write hooks
  lib/
    genlayer/client.ts   # genLayerClient + CONTRACT_ADDRESS
    types.ts             # Job type
    utils.ts             # truncateAddress, formatBudget, etc.
```

## Development Workflow

1. Select network: `genlayer network` → choose testnet
2. Deploy contract: `npm run deploy`
3. Copy deployed address to `frontend/.env.local` as `NEXT_PUBLIC_CONTRACT_ADDRESS`
4. `npm run dev` → open http://localhost:3000
5. Connect MetaMask on GenLayer Asimov Testnet (chain ID 961)

## Contract Methods

| Method                                   | Type                    | Description                       |
| ---------------------------------------- | ----------------------- | --------------------------------- |
| `post_job(title, description, deadline)` | payable write           | Creates job, holds GEN in escrow  |
| `take_job(job_id)`                       | write                   | Freelancer accepts open job       |
| `submit_delivery(job_id, url, note)`     | write                   | Freelancer submits evidence       |
| `auto_evaluate(job_id)`                  | non-deterministic write | AI reads spec + evidence, decides |
| `release_manually(job_id)`               | write                   | Client manually approves payment  |
| `get_job(id)`                            | view                    | Single job as JSON                |
| `get_all_jobs()`                         | view                    | All jobs as JSON array            |
| `get_jobs_by_client(addr)`               | view                    | Jobs by client address            |
| `get_jobs_by_freelancer(addr)`           | view                    | Jobs by freelancer address        |

## GenLayer Technical Reference

> **SDK API reference**: https://sdk.genlayer.com/main/_static/ai/api.txt

- `@gl.public.write` — state-modifying method (deterministic)
- Non-deterministic methods use `gl.eq_principle.strict_eq()` for validator consensus
- `gl.nondet.exec_prompt(prompt, response_format="json")` — call LLM
- `gl.nondet.web.get(url)` — fetch URL content
- `gl.send(address, amount)` — transfer GEN tokens
- `gl.message.value` — GEN sent with the transaction (escrow)
- `gl.message.sender` — caller's address
