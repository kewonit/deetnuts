# Architecture

## Overview

DEETNUTS is a Next.js App Router application backed by self-hosted PocketBase and a set of ingestion utilities for public admissions datasets. The repository serves two related purposes:

- a production web application for browsing and comparing data
- an operational workspace for importing, validating, and migrating datasets

The live runtime uses PocketBase directly. Supabase remains only as the read-only source for the explicit migration and as a temporary rollback copy after cutover.

## System Diagram

```text
                                   +----------------------+
                                   |  CSV / JSON sources  |
                                   |  scripts/ + data/    |
                                   +-----------+----------+
                                               |
                                               v
                                     +--------------------+
                                     |  Ingestion Scripts |
                                     |  scripts/*.ts      |
                                     +---------+----------+
                                               |
                                               v
                                     +--------------------+
                                     | PocketBase SDK     |
                                     | batch ingestion    |
                                     +---------+----------+
                                               |
                                               v
+-----------+       +----------------------+       +----------------------+
| Browser / | ----> | Cloudflare DNS, TLS, | ----> | Unprivileged Nginx   |
| Search    |       | CDN, WAF, redirects  |       | on DigitalOcean      |
+-----------+       +----------------------+       +-----------+----------+
                                                              |
                                                              v
                                                    +----------------------+
                                                    | Active blue/green    |
                                                    | Next.js container    |
                                                    +----------+-----------+
                                                               |
                                  +----------------------------+------------------+
                                  v                                               v
                        +----------------------+                       +----------------------+
                        | Shared Lib Layer     |                       | Private PocketBase   |
                        | lib/*                |                       | data, auth, files    |
                        +----------------------+                       +----------------------+
```

## Runtime Stack

| Layer              | Current Choice          | Notes                                                 |
| ------------------ | ----------------------- | ----------------------------------------------------- |
| Framework          | Next.js 16.2.12         | App Router, standalone output                         |
| UI runtime         | React 19.2.8            | React Compiler enabled                                |
| Language           | TypeScript              | Used across app and scripts                           |
| Styling            | Tailwind CSS            | Shared UI primitives plus project-specific components |
| Auth               | PocketBase              | Signed, HttpOnly host-only application cookie         |
| Primary data store | PocketBase SQLite       | Private volume on the single production VM            |
| Edge               | Cloudflare              | DNS, strict TLS, caching, WAF and canonical redirects |
| Origin             | DigitalOcean + Nginx    | Single Droplet with blue/green web containers         |
| Deployment model   | Docker standalone build | Private digest-pinned Node 22 Alpine images           |

## Major Application Areas

### App Router Surface

The `app/` directory is organized by data domain and product surface.

- `app/mht-cet/`: state cutoffs, college detail pages, seat matrix views, and all-India cutoff pages
- `app/auth/`, `app/account/`, `app/profile/`, `app/signup/`, `app/login/`: authenticated user flows
- `app/api/`: route handlers for MHT-CET cutoffs, college detail access, and other server endpoints

### Shared Libraries

The `lib/` directory contains the operational core of the application.

- `lib/auth.ts` and `lib/pocketbase/*`: authenticated user helpers for server-side routes and pages
- `lib/metadata.ts`: shared metadata generation helpers for SEO and social cards
- `lib/college-data.ts`: cached helpers for MHT-CET college and seat data
- `lib/pocketbaseClient.ts`: private, service-authenticated PocketBase adapter

## Data Domains

### MHT-CET State Cutoffs

Current tables referenced by code:

- `2024_mht_cet_round_one_cutoffs_duplicate`
- `2024_mht_cet_round_two_cutoffs`
- `2024_mht_cet_round_three_cutoffs`
- `2025_mht_cet_round_one_cutoffs`
- `2025_mht_cet_round_two_cutoffs`
- `2025_mht_cet_round_three_cutoffs`
- `2025_mht_cet_round_four_cutoffs`
- `2026_mht_cet_round_one_cutoffs`

The state-cutoff UI is year-aware. It exposes rounds 1-3 for 2024, rounds 1-4 for 2025, and the currently available Round 1 dataset for 2026. Candidate-profile filtering maps candidature, home-university, category, ladies, and supported special-reservation eligibility to the source seat pools before querying cutoff rows.

### MHT-CET College and Seat Data

Primary tables:

- `2024_mht_cet_colleges`
- `2024_mht_cet_colleges_seat_matrix`

The application uses the full `2024_mht_cet_colleges_seat_matrix` table name for seat-matrix access.

### MHT-CET All-India Cutoffs

Primary tables:

- `2024_all_india_rounds_one`
- `2024_all_india_rounds_two`
- `2024_all_india_rounds_three`

The API surface supports all three rounds. The checked-in `app/mht-cet/all-india-cutoffs/page.tsx` currently renders one visible round tab. The other rounds are available through the API handlers.

## Auth and Data Access Boundaries

### Auth

The live app uses PocketBase auth.

- `lib/auth.ts` exposes cached user and auth-status helpers.
- `lib/pocketbase/auth.ts` validates and refreshes PocketBase tokens and manages signed OAuth state.

### Data Access

Runtime reads and writes use a service-authenticated PocketBase adapter on the private Docker network. User-owned profile updates use the authenticated user's PocketBase token and collection rules. Browsers never connect to PocketBase directly.

### Collection Security

Imported data collections allow only the dedicated `app_services` backend role. The users collection allows each user to view only their own record and update only approved profile fields. Users cannot change email, verification, source IDs, or migration audit fields. Private avatars use an authenticated same-user proxy with MIME, size, redirect, and host checks. PocketBase has no published port.

## Compatibility Layer

`lib/pocketbaseClient.ts` defines the runtime boundary. It authenticates a dedicated backend service, validates its role, retries once after token expiry, and exposes the narrow collection operations used by the application.

## Deployment Model

### Application Deployment

- `next.config.mjs` enables standalone output, deployment IDs, scoped caching and production headers.
- `Dockerfile` builds a standalone Next.js server with a BuildKit-mounted Server Actions key and runs it as a non-root user.
- `docker-compose.yml` defines blue and green web slots, an unprivileged Nginx origin, bounded resources, read-only filesystems and a disabled Reddit-worker profile.
- Only the active web slot and Nginx restart after a host reboot. The inactive slot remains available only during a deployment or rollback window.
- GHCR images are private, addressed by digest, scanned and attested before the restricted host deployment command accepts them.

### Availability Boundary

Blue/green switching removes ordinary web release downtime. It does not make the single VM highly available. PocketBase data is stored in a named volume with scheduled verified backups. Recovery still requires restoring or reprovisioning the single VM.

## Request Flows

### Public Data Page

```text
Route request
  -> App Router page or API handler
    -> lib helper or direct collection query
      -> private PocketBase service adapter
        -> typed or normalized response
          -> rendered page / JSON payload
```

### Authenticated Page

```text
Route request
  -> cookies()
    -> authenticated PocketBase user client
      -> auth.getUser()
        -> protected query or redirect/error path
```

### Batch Ingestion

```text
CSV file
  -> scripts/*.ts parser
    -> compatibility wrapper batch builder
      -> PocketBase inserts / upserts / deletes
        -> operational logs and validation output
```

## Known Maintenance Hotspots

- Some npm aliases in `package.json` still point to files that are no longer present in `scripts/`.
- Supabase credentials are migration-source inputs only and are rejected by runtime environment validation.
- The all-India cutoff UI and the all-India API surface are not perfectly aligned at the moment.
- One older seat-matrix helper still uses a shortened table name.

These do not block the current application runtime, but they are the places most likely to cause confusion during maintenance.
