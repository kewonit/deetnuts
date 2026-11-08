# DEETNUTS

Admissions data for Indian engineering entrance exams: MHT-CET cutoffs and college data, JEE Main and JEE Advanced cutoffs, a college predictor, and exam countdowns.

Live at **[www.deetnuts.com](https://www.deetnuts.com)**.

## Contents

- [What it serves](#what-it-serves)
- [Architecture](#architecture)
- [Request flows](#request-flows)
- [Data ingestion](#data-ingestion)
- [Deployment](#deployment)
- [Repository layout](#repository-layout)
- [Local development](#local-development)
- [Documentation](#documentation)
- [License](#license)

## What it serves

| Area                      | Routes                                                                          | Data                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| MHT-CET state cutoffs     | `/mht-cet/state-cutoffs`, `/mht-cet/all-state-cutoffs/[year]/[round]`           | PocketBase. 2024 rounds 1-3, 2025 rounds 1-4, 2026 rounds 1-4                                 |
| MHT-CET All-India cutoffs | `/mht-cet/all-india-cutoffs`                                                    | PocketBase. 2024 rounds 1-3 via API (UI shows round 1). 2026 rounds 1-4 loaded, not yet in UI |
| MHT-CET colleges          | `/mht-cet/colleges`, `/mht-cet/colleges/[slug]`                                 | PocketBase. 2024 college master and seat matrix                                               |
| JEE cutoffs               | `/jee-main/colleges/...`, `/jee-advanced/colleges/...`, `/josaa/institutes/...` | eJAM Parquet release (JoSAA, CSAB), bundled in the image                                      |
| College predictor         | `/college-predictor`, `/api/predict/[exam_id]`                                  | eJAM predictors for JEE Main, JEE Advanced, MHT-CET                                           |
| Exam countdown            | `/exam-countdown`                                                               | Checked-in exam metadata. Study map uses TimeKeeper's Supabase project                        |
| Accounts                  | `/login`, `/account`, `/profile`                                                | PocketBase auth with Google OAuth                                                             |
| Cutoff bot                | `/api/bot/*`                                                                    | Discord interactions and a Reddit worker (`bot/`)                                             |

## Architecture

```mermaid
flowchart LR
  user["Browser"]
  bots["Discord / Reddit bot"]
  tk[("TimeKeeper Supabase<br/>study map")]
  google["Google OAuth"]

  subgraph edge["Cloudflare"]
    cf["DNS · TLS · WAF · cache"]
  end

  subgraph host["DigitalOcean droplet · Docker Compose"]
    nginx["Nginx (unprivileged)<br/>:443 only"]
    blue["web-blue<br/>Next.js standalone"]
    green["web-green<br/>Next.js standalone"]
    ejam[("eJAM Parquet<br/>baked into image")]
    pb[("PocketBase<br/>SQLite · auth · files")]
  end

  user --> cf
  bots --> cf
  cf -->|Authenticated Origin Pulls| nginx
  nginx -->|active slot| blue
  nginx -.->|standby| green
  blue --> pb
  green -.-> pb
  blue --> ejam
  pb <--> google
  user -.->|public anon key| tk
```

| Layer     | Choice                                                                        |
| --------- | ----------------------------------------------------------------------------- |
| Framework | Next.js 16.3 (App Router, standalone output, React Compiler)                  |
| UI        | React 19.2, Tailwind CSS 3.4, TypeScript 5.9                                  |
| Data/auth | PocketBase 0.40 (SQLite), JS SDK 0.28                                         |
| JEE data  | eJAM workspace (`ejam/`), Parquet verified against a pinned SHA-256 manifest |
| Edge      | Cloudflare, managed with Terraform in `infra/cloudflare`                      |
| Origin    | One DigitalOcean droplet (1 GiB), Nginx, blue/green web slots                 |
| CI/CD     | GitHub Actions, private GHCR images addressed by digest                       |

Boundaries:

- **Only Nginx publishes a port.** The cloud firewall admits 443 from Cloudflare ranges only, and Nginx rejects requests without Cloudflare's client certificate.
- **PocketBase is private.** It listens on the Compose network and on host loopback `127.0.0.1:8090` for administration over an SSH tunnel. Browsers never reach it.
- **Server-side data access.** `lib/pocketbaseClient.ts` authenticates as a service account with the `app_services` role. User-scoped writes use the signed-in user's token and collection rules.
- **Hardened containers.** Read-only root filesystems, `cap_drop: ALL`, `no-new-privileges`, and fixed memory limits.
- **Single VM.** Blue/green removes release downtime, not host failure. PocketBase is backed up daily with verified archives.

## Request flows

### Public page

```mermaid
sequenceDiagram
  autonumber
  participant B as Browser
  participant CF as Cloudflare
  participant N as Nginx
  participant W as Next.js (active slot)
  participant PB as PocketBase

  B->>CF: GET /mht-cet/colleges/[slug]
  alt Cache hit
    CF-->>B: Cached HTML or RSC payload
  else Cache miss
    CF->>N: Origin request with client certificate
    N->>W: Proxy to web-blue or web-green
    W->>W: proxy.ts applies canonical redirects and CSP
    W->>PB: Service-authenticated query on private network
    PB-->>W: Records
    W-->>N: HTML or RSC, prerender stored in .next/cache
    N-->>CF: Response
    CF-->>B: Response, cached per zone rules
  end
```

### Google sign-in

```mermaid
sequenceDiagram
  autonumber
  participant B as Browser
  participant W as Next.js
  participant PB as PocketBase
  participant G as Google

  B->>W: Submit login form (server action)
  W->>PB: listAuthMethods()
  PB-->>W: Google auth URL, state, PKCE verifier
  W-->>B: Set sealed OAuth-state cookie, redirect to Google
  B->>G: Consent
  G-->>B: Redirect to /auth/callback with code and state
  B->>W: GET /auth/callback
  W->>W: Open sealed cookie, compare state
  W->>PB: authWithOAuth2Code(code, verifier)
  PB->>G: Exchange code
  PB-->>W: User token
  W-->>B: Set HttpOnly auth cookie, redirect to original page
```

`proxy.ts` redirects `/account` and `/profile` to `/login` when the auth cookie is absent. Server code refreshes the token against PocketBase on each authenticated request.

## Data ingestion

MHT-CET 2026 cutoffs are derived from the official per-institute CAP allotment PDFs. Earlier datasets came from the original Supabase project through the one-time migration in `scripts/migrate-supabase-to-pocketbase.ts`.

```mermaid
sequenceDiagram
  autonumber
  actor Op as Operator
  participant S as scrape_mahacet_allotments.py
  participant CET as fe2026.mahacet.org
  participant I as import-mahacet-2026-cap-rounds.ts
  participant PB as PocketBase (SSH tunnel)

  Op->>S: Run one CAP round into a local archive
  S->>CET: Download allotment PDFs for every institute
  S->>S: Validate PDFs, extract candidate rows
  S->>S: Derive state and All-India cutoffs
  S-->>Op: CSVs and SHA-256 manifests, PDFs purged
  Op->>I: Import the verified archive
  I->>PB: Create or extend collections
  I->>PB: Write records with a small worker pool
```

The production batch API is disabled, so the importer writes record by record. Every data collection carries the `source_reserved_*` fields defined in `lib/pocketbase/source-record.ts`.

## Deployment

A push to `main` runs [`production.yaml`](./.github/workflows/production.yaml). The deploy job runs only when the repository variable `DO_DEPLOY_ENABLED` is `true`.

```mermaid
sequenceDiagram
  autonumber
  actor Dev
  participant GH as GitHub Actions
  participant R as GHCR (private)
  participant FW as DO firewall
  participant H as Droplet (deetnuts-deploy)
  participant CF as Cloudflare

  Dev->>GH: Push to main
  GH->>R: Build and push web and PocketBase images
  GH->>FW: Allow runner /32 on port 22
  GH->>H: ssh "deploy SHA web@digest pocketbase@digest"
  H->>H: Validate runtime env, origin certs, PocketBase secrets
  H->>R: Pull images by digest
  H->>H: Recreate PocketBase, start candidate slot, wait for health
  H->>H: Smoke test /api/health, /, /sitemap-index.xml
  H->>H: Point Nginx upstream at candidate, reload
  H->>CF: Purge www.deetnuts.com
  H->>CF: Confirm public /api/health reports the new SHA
  loop Every 15s for 60s
    H->>H: Candidate healthy and public SHA matches
  end
  H->>H: Stop previous slot, record release, prune caches
  GH->>FW: Remove runner rule (always runs)
  Note over H: Any failure restores the previous env, upstream and active slot
```

- The deploy key is bound to a forced command that accepts only `deploy`, `rollback SHA`, and `status`.
- The last three releases are kept for rollback. The stopped slot keeps its image, so rolling back one release needs no pull.
- `npm run deploy:production` re-runs the workflow on `main`. Confirm completion on the **Deploy** job, not the build.
- Host timers: daily PocketBase backup at 04:15 UTC (ZIP, SHA-256, per-table row counts, three copies kept) and an hourly cache prune when the web cache volumes exceed 6 GiB.

Host layout, secrets, bootstrap, and Cloudflare setup: [`deploy/README.md`](./deploy/README.md).

## Repository layout

```text
app/                 App Router pages, layouts, and route handlers (app/api)
components/          UI components
lib/                 Data access, auth, SEO metadata, bot logic
proxy.ts             Canonical redirects, auth gate, exam-countdown CSP
ejam/                Vendored eJAM workspace: predictors, data CLI, Parquet data
pocketbase/          PocketBase image, hooks, and migrations
scripts/             Scrapers, importers, generators, verification
bot/                 Reddit worker
deploy/              Host scripts, Nginx, systemd units, env templates
infra/cloudflare/    Terraform for the Cloudflare zone
timekeeper-compat/   Cloudflare Worker for the legacy TimeKeeper domain
e2e/                 Playwright tests
data/                Checked-in source data
docs/                Architecture notes
supabase/, legacy/   Historical schema and removed code, kept for provenance
```

## Local development

Requirements: Node.js 22+, npm, and a reachable PocketBase instance with an `app_services` service account. Python 3 is needed only for the scrapers.

```bash
git clone https://github.com/kewonit/deetnuts && cd deetnuts
npm ci
npm exec --yes --package=pnpm@11.1.3 -- pnpm --dir ejam install --frozen-lockfile
cp .env.example .env.local
npm run dev    # http://localhost:3000
```

Runtime variables, validated in `env.ts`:

| Variable                                                  | Required | Purpose                                                             |
| --------------------------------------------------------- | -------- | ------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`                                     | Yes      | Public origin                                                       |
| `POCKETBASE_INTERNAL_URL`                                 | Yes      | PocketBase URL, server only                                         |
| `POCKETBASE_SERVICE_EMAIL`, `POCKETBASE_SERVICE_PASSWORD` | Yes      | `app_services` account (password 32-72 characters)                  |
| `AUTH_STATE_SECRET`                                       | Yes      | Seals the OAuth state cookie (32+ characters)                       |
| `TIMEKEEPER_SUPABASE_URL`, `TIMEKEEPER_SUPABASE_ANON_KEY` | No       | Study map. Public key only. Without it the map shows as unavailable |

Superuser, Supabase source, and other migration credentials are not runtime inputs and are rejected by production validation. The web app reads `.env.local`. Most `scripts/` entry points read `.env`.

| Command                       | Does                                                               |
| ----------------------------- | ------------------------------------------------------------------ |
| `npm run dev`                 | Dev server (Turbopack)                                             |
| `npm run build`               | Builds eJAM CSS, verifies JEE data, then runs the production build |
| `npm run lint`                | ESLint                                                             |
| `npm run typecheck`           | `tsc --noEmit`                                                     |
| `npm run format:check`        | Prettier                                                           |
| `npm run test:e2e:production` | Playwright suites for JEE cutoffs and exam countdown               |
| `npm run verify:production`   | Checks the live site                                               |

## Documentation

- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md): data domains, collections, security model
- [deploy/README.md](./deploy/README.md): production host and operations
- [app/mht-cet/all-india-cutoffs/README.md](./app/mht-cet/all-india-cutoffs/README.md): All-India cutoffs feature
- [ejam/UPSTREAM.md](./ejam/UPSTREAM.md): eJAM import provenance
- [URLS_DOCUMENTATION.md](./URLS_DOCUMENTATION.md): public URL map

## License

[MIT](./LICENSE). The vendored `ejam/` workspace is licensed separately under AGPL-3.0-or-later; see [`ejam/LICENSE`](./ejam/LICENSE) and [`ejam/NOTICE`](./ejam/NOTICE).
