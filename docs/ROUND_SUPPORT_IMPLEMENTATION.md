# MHT-CET State Cutoffs: Year and Round Support

## Overview

The state-cutoff module is no longer just a 2024 round-selector feature. In the current repository, year and round support are coupled:

- 2024 supports rounds 1, 2, and 3
- 2025 currently supports round 1 only

The authoritative configuration lives in `app/mht-cet/state-cutoffs/constants.ts`, with the page behavior driven from `app/mht-cet/state-cutoffs/page.tsx`.

## Coverage Matrix

| Year | Supported Rounds | Backing Table                                                                                                    |
| ---- | ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| 2024 | 1, 2, 3          | `2024_mht_cet_round_one_cutoffs_duplicate`, `2024_mht_cet_round_two_cutoffs`, `2024_mht_cet_round_three_cutoffs` |
| 2025 | 1                | `2025_mht_cet_round_one_cutoffs`                                                                                 |

## Current Behavior

### URL State

The state-cutoff page persists major filters in the URL with `nuqs`, including:

- year
- round
- percentile or rank mode
- categories, courses, statuses, and universities
- pagination, sorting, and density preferences

This keeps the page shareable and makes filter state stable across navigation.

### Year and Round Rules

Current logic is intentionally explicit:

- invalid round values fall back to round 1
- when `year === 2025`, the page resets any non-round-one selection back to `1`
- `getCollectionForRound(round, year)` is the canonical helper for table selection

### Collection Selection

The state-cutoff module uses `getCollectionForRound()` and related helpers from `constants.ts` rather than hardcoding tables in page logic. That is the primary contract to extend when a new year or round is added.

## User-Facing Implications

For 2024 users can switch across all three rounds. For 2025 the UI still exposes year selection, but round selection is constrained to the single dataset the repository currently has available.

This means documentation, exports, and analytics around the state-cutoff module should always describe year coverage and round coverage together rather than treating them as independent dimensions.

## Implementation Notes

Important implementation anchors:

- `YEAR_OPTIONS` defines the supported year list
- `ROUND_CONFIG` maps round numbers to 2024 tables
- `getCollectionForRound()` applies the year-specific override for 2025
- `getDisplayNameForRound()` centralizes round labels
- the page-level `useEffect` in `page.tsx` enforces round 1 when 2025 is selected

## Operational Guidance

If a new year is introduced, update at least the following in one pass:

1. the collection mapping in `constants.ts`
2. the year selector options
3. any export routes or server actions that assume the old year table set
4. the relevant batch-upload or import documentation

## Known Constraint

The module is architected for year-aware round selection, but the repository only contains a single 2025 round table at present. That is a data-availability constraint, not a limitation of the basic page-state model.
