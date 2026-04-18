# JoSAA Module

## Overview

The JoSAA surface is the largest structured dataset in the repository. It powers public exploration of institute, branch, and cutoff data across IITs, NITs, IIITs, and GFTIs.

Repository coverage currently assumes:

- cutoff years from 2018 through 2024
- four primary data tables: institutes, branches, cutoffs, and aliases
- public, SEO-oriented route coverage under `app/josaa/`

## Module Layout

The JoSAA implementation is split across three layers.

### Routes and Pages

The `app/josaa/` tree contains:

- the landing page
- institute directory pages
- institute detail and branch detail pages
- search, comparison, and trend views
- supporting loading, error, and sitemap handlers

### Data Access

The main access layer lives in:

- `lib/josaa-client.ts`
- `lib/josaa-static-params.ts`
- `lib/types/josaa.ts`

`lib/josaa-client.ts` is the authoritative JoSAA access layer for application code. It still consumes a PocketBase-shaped client contract, but that contract is now backed by Supabase through `lib/pocketbaseClient.ts`.

### Presentation

Feature-specific UI lives primarily in `components/josaa/` and shared primitives in `components/ui/`.

## Data Model

The JoSAA module works with these tables:

| Table                     | Purpose                                                             |
| ------------------------- | ------------------------------------------------------------------- |
| `josaa_institutes`        | Institute master data, slugs, type, state, and ranking metadata     |
| `josaa_branches`          | Branch and program metadata                                         |
| `josaa_cutoffs`           | Year, round, category, gender, quota, and opening/closing rank data |
| `josaa_institute_aliases` | Search aliases and alternate institute naming                       |

The application expects JoSAA records to be queryable with collection-style filters such as `field='value'` and `field ~ "term"`. Those expressions are translated to Supabase queries by the compatibility client.

## Data Flow

Typical request path:

```text
JoSAA page request
   -> app/josaa/* route
      -> lib/josaa-client.ts
         -> lib/pocketbaseClient.ts
            -> Supabase tables
```

Important implementation details:

- `getAllInstitutes()` builds institute-to-branch relationships from cutoff samples and currently uses 2024 data to infer the latest branch offering map.
- `enrichCutoffsWithDetails()` resolves institute and branch details in batches rather than relying on relational expansion from the compatibility layer.
- filters are sanitized before being sent through the legacy collection-query syntax

## Ingestion Workflow

The repository includes checked-in JoSAA source data under `data/josaa/`. The operational import path is:

```bash
npx tsx scripts/import-josaa-data.ts
```

Recommended prerequisites before import:

- the Supabase migration applied through `supabase/migrations/20260304_pocketbase_to_supabase.sql`
- application and script environment variables populated
- JoSAA source JSON files present in the expected `data/josaa/` locations

The historical npm alias `npm run import-josaa` should be treated carefully: as committed, `package.json` points to a file name that is not present in `scripts/`. Use the direct `npx tsx` command above unless the alias has been corrected locally.

## SEO and Performance Notes

The JoSAA module is one of the most SEO-sensitive parts of the application. Current implementation patterns include:

- metadata and structured-data helpers from `lib/metadata.ts` and JSON-LD components
- sitemap support in the JoSAA route tree
- loading and error boundaries for major JoSAA pages
- cache-aware data fetching and static-params helpers for directory-style routes

## Operational Notes

- the runtime backend is Supabase, not PocketBase
- PocketBase terminology still appears in some helper names because the compatibility interface has not been fully renamed
- if a JoSAA read path fails unexpectedly, inspect the compatibility client before assuming the page layer is at fault

## Maintenance Priorities

If you extend the JoSAA module, the highest-value cleanup areas are:

1. reducing dependence on PocketBase-style filters in application code
2. replacing compatibility-layer assumptions with direct typed Supabase queries
3. keeping 2024-specific branch inference logic explicit and documented when newer JoSAA datasets are added
