# Architecture

## Overview

DEETNUTS is a Next.js App Router application backed by Supabase and a set of ingestion utilities for public admissions datasets. The repository serves two related purposes:

- a production web application for browsing and comparing data
- an operational workspace for importing, validating, and migrating datasets

The codebase still carries compatibility layers that preserve PocketBase-like interfaces for older modules and scripts, but the live runtime is centered on Supabase.

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
                                     | PocketBase-Shaped  |
                                     | Compatibility API  |
                                     | scripts/supabase-  |
                                     | pocketbase-compat  |
                                     +---------+----------+
                                               |
                                               v
+-----------+       +----------------------+    +----------------------+
| Browser / | ----> | Next.js App Router   | -> | Supabase Postgres    |
| Search    |       | pages + API routes   |    | and Supabase Auth    |
+-----------+       +----------+-----------+    +----------------------+
                               |
                               v
                     +----------------------+
                     | Shared Lib Layer     |
                     | lib/*                |
                     +----------------------+
```

## Runtime Stack

| Layer              | Current Choice          | Notes                                                 |
| ------------------ | ----------------------- | ----------------------------------------------------- |
| Framework          | Next.js 16.2.9          | App Router, standalone output                         |
| UI runtime         | React 19.2.3            | React Compiler enabled                                |
| Language           | TypeScript              | Used across app and scripts                           |
| Styling            | Tailwind CSS            | Shared UI primitives plus project-specific components |
| Auth               | Supabase Auth           | Cookie-based server auth helpers                      |
| Primary data store | Supabase Postgres       | Live application backend                              |
| Deployment model   | Docker standalone build | Node 22 Alpine builder/runner image                   |

## Major Application Areas

### App Router Surface

The `app/` directory is organized by data domain and product surface.

- `app/josaa/`: JoSAA landing pages, institute detail pages, comparison flows, trends, and search
- `app/mht-cet/`: state cutoffs, college detail pages, seat matrix views, and all-India cutoff pages
- `app/nirf/`: ranking views backed by Supabase tables
- `app/auth/`, `app/account/`, `app/profile/`, `app/signup/`, `app/login/`: authenticated user flows
- `app/api/`: route handlers for predictions, all-India cutoffs, college detail access, and other server endpoints

### Shared Libraries

The `lib/` directory contains the operational core of the application.

- `lib/auth.ts` and `lib/supabaseAuth.ts`: authenticated user helpers for server-side routes and pages
- `lib/metadata.ts`: shared metadata generation helpers for SEO and social cards
- `lib/data-fetching.ts`: generic fetch utilities, retry helpers, and cache presets
- `lib/performance.ts`: lightweight performance instrumentation helpers
- `lib/josaa-client.ts`: typed JoSAA access layer built on the compatibility client
- `lib/college-data.ts`: cached helpers for MHT-CET college and seat data
- `lib/pocketbaseClient.ts`: PocketBase-like interface backed by Supabase for legacy consumers

## Data Domains

### JoSAA

Primary tables:

- `josaa_institutes`
- `josaa_branches`
- `josaa_cutoffs`
- `josaa_institute_aliases`

Working coverage in the repository is 2018-2024. The JoSAA module reads through `lib/josaa-client.ts`, which still exposes PocketBase-shaped collection operations for historical compatibility.

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

Most current API routes use the full `2024_mht_cet_colleges_seat_matrix` table name. One older helper in `lib/college-data.ts` still queries `2024_seat_matrix`, which is worth confirming in environments where no compatibility view exists.

### MHT-CET All-India Cutoffs

Primary tables:

- `2024_all_india_rounds_one`
- `2024_all_india_rounds_two`
- `2024_all_india_rounds_three`

The API surface supports all three rounds. The checked-in `app/mht-cet/all-india-cutoffs/page.tsx` currently renders a single visible round tab, while the API handlers and alternate `page-optimized.tsx` retain broader round support.

### Predictions

The predictions module is dataset-backed rather than model-backed at runtime.

- Source file: `scripts/predictions_2026_complete.csv`
- API route: `app/api/predictions/route.ts`
- Coverage: predicted 2026 cutoffs compared against a 2025 baseline

The repository does not contain training code or online inference services for this feature.

## Auth and Data Access Boundaries

### Auth

The live app uses Supabase Auth.

- `lib/auth.ts` exposes cached user and auth-status helpers.
- `lib/supabaseAuth.ts` provides stricter authenticated access helpers for server operations.

### Data Access

There are two active access patterns in the repository:

1. Direct Supabase usage for modules that already migrated fully.
2. PocketBase-like wrappers for older modules that still rely on collection semantics, filter strings, or batch-like workflows.

This split is intentional for now, but it is the primary architectural compromise still visible in the codebase.

## Compatibility Layer

Two files define the compatibility boundary:

- `lib/pocketbaseClient.ts`: used by application code that still expects a PocketBase collection client
- `scripts/supabase-pocketbase-compat.ts`: used by ingestion scripts that still expect PocketBase batch APIs and auth semantics

These wrappers translate familiar collection operations such as `getList`, `getFullList`, `create`, `upsert`, and filter expressions into Supabase queries.

## Deployment Model

### Application Deployment

- `next.config.mjs` enables standalone output and production headers.
- `Dockerfile` builds a standalone Next.js server and runs it with a non-root user.
- `docker-compose.yml` starts the frontend container and a PocketBase container.

### Operational Caveat

The compose file still reflects migration-era infrastructure. The core application runtime is Supabase-first, but the repository continues to carry a PocketBase service definition for compatibility and legacy workflows.

## Request Flows

### Public Data Page

```text
Route request
  -> App Router page or API handler
    -> lib helper or direct collection query
      -> Supabase-backed data source
        -> typed or normalized response
          -> rendered page / JSON payload
```

### Authenticated Page

```text
Route request
  -> cookies()
    -> Supabase server client
      -> auth.getUser()
        -> protected query or redirect/error path
```

### Batch Ingestion

```text
CSV file
  -> scripts/*.ts parser
    -> compatibility wrapper batch builder
      -> Supabase inserts / upserts / deletes
        -> operational logs and validation output
```

## Known Maintenance Hotspots

- Some npm aliases in `package.json` still point to files that are no longer present in `scripts/`.
- Several CLI scripts still validate legacy PocketBase-style auth variable names even though the actual database work is executed through Supabase-backed wrappers.
- The all-India cutoff UI and the all-India API surface are not perfectly aligned at the moment.
- One older seat-matrix helper still uses a shortened table name.

These do not block the current application runtime, but they are the places most likely to cause confusion during maintenance.
