# Phase 1 - Shared Cutoff Query Core

## Objective

Create one auth-free query helper that can be used by the protected bot API without changing the user-authenticated web cutoff experience.

## Scope

- Add a shared query module for bot-safe cutoff lookup.
- Reuse the existing PocketBase-compatible Supabase adapter or Supabase client pattern already in the repo.
- Keep the implementation read-only.
- Keep filters minimal: percentile, year, round, and default general categories.
- Keep domain logic outside platform adapters. Discord and Reddit code should not build cutoff filters, sort rows, or know table names.

## Proposed Interface

```ts
type BotCutoffQuery = {
  percentile: number;
  year?: number;
  round?: number;
  limit?: number;
};

type BotCutoffResult = {
  query: {
    percentile: number;
    year: number;
    round: number;
    categoryGroup: "Open Category (General)";
  };
  rows: Array<{
    collegeName: string;
    courseName: string;
    category: string;
    cutoffScore: number;
    lastRank: number | null;
    collegeCode: string | null;
    homeUniversity: string | null;
  }>;
  totalMatched: number;
};
```

## Query Rules

- Validate `percentile` is `>= 0` and `<= 100`.
- Validate `year` and `round` against existing constants.
- Resolve table through `getCollectionForRound(round, year)`.
- Filter:
  - `cutoff_score >= 0`
  - `cutoff_score <= percentile`
  - `category` in the existing open/general group
- Sort by `-cutoff_score`.
- Collapse duplicate rows into unique `collegeCode + courseName` results before taking the top 5. Keep the category from the closest matching row so the reply still shows the underlying cutoff code.
- Return at most 5 unique college-course rows by default.

## DRY Boundary

- Put shared bot/domain logic under `lib/mht-cet/state-cutoffs/*` or a similarly neutral `lib` path.
- If current constants stay under `app/mht-cet/state-cutoffs`, re-export them from one shared domain module rather than copying category or round maps.
- Keep one input normalizer, one cutoff query helper, one result shape, and one URL builder.
- Do not import a Next route handler from the Reddit worker. The worker should call the protected API.
- Do not make the Discord Vercel route call the same Vercel HTTP API internally. It should call the shared helper directly.

## Files to Touch

- Add a shared helper under a bot/data or lib data-access location.
- Add focused `node:test` coverage near the helper.
- Only adjust existing state-cutoff constants if needed to expose a small reusable helper.

## Verification Gate

- Unit tests prove valid 2024 and 2025 year/round combinations resolve correctly.
- Unit tests prove invalid percentile, year, and round fail with clear typed errors.
- Unit tests prove results are sorted closest-first and capped at 5.
- Unit tests prove duplicate category rows collapse into unique college-course results.
- Existing state-cutoff UI tests still pass.
