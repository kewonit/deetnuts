# MHT-CET All-India Cutoffs 2024

## Overview

This module serves the 2024 MHT-CET all-India quota dataset through dedicated API handlers and a filterable client page.

Current repository state:

- the API surface supports round one, round two, and round three
- the checked-in `page.tsx` currently renders round one as the visible tab in the UI

## File Layout

```text
app/mht-cet/all-india-cutoffs/
├── page.tsx
├── data-table.tsx
├── filters.tsx
├── types.ts
├── constants.ts
├── use-all-india-cutoffs.ts
├── README.md
└── TEST_GUIDE.md

app/api/mht-cet/all-india-cutoffs/
├── _shared.ts
├── 2024-round-one/route.ts
├── 2024-round-two/route.ts
└── 2024-round-three/route.ts
```

## Data Access Pattern

The route handlers call the shared request builder in `_shared.ts`, which:

- parses pagination and sort parameters
- sanitizes free-text inputs
- builds collection-style filter strings
- queries the Supabase-backed compatibility client in `lib/pocketbaseClient.ts`

## API Surface

Endpoints:

```text
GET /api/mht-cet/all-india-cutoffs/2024-round-one
GET /api/mht-cet/all-india-cutoffs/2024-round-two
GET /api/mht-cet/all-india-cutoffs/2024-round-three
```

Supported query parameters:

- `page`
- `perPage`
- `sort`
- `search`
- `branch`
- `branches`
- `minPercentile`, `maxPercentile`
- `minRank`, `maxRank`
- `collegeName`

Returned record fields are intentionally narrow and include:

- `id`
- `sr_no`
- `rank`
- `percentile`
- `choice_code`
- `institute_code`
- `merit_exam`
- `type`
- `seat_type`
- `college_code`
- `course_name`
- `college_name`
- `created`, `updated`

## UI Behavior

The active page implementation includes:

- debounced data fetching through `use-all-india-cutoffs.ts`
- server-driven pagination and sorting
- branch and percentile/rank filters
- dynamic import of the heavy table component
- error and loading feedback in the page shell

## Important Current Limitation

The data layer and route handlers support all three rounds, but the checked-in `page.tsx` only exposes round one through the visible tab list. Validate round two or round three through the API routes until those tabs are intentionally enabled.

## Stack Notes

- framework: Next.js 16 App Router
- UI runtime: React 19
- table layer: TanStack Table
- backend access: Supabase through the PocketBase-compatible client

For test steps, see `TEST_GUIDE.md` in the same directory.
