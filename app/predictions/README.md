# JEE Main 2026 Predictions

## Overview

The predictions module is a CSV-backed explorer for the `predictions_2026_complete.csv` dataset. It provides filtering, sorting, summary statistics, and pagination for a precomputed set of 2026 rank predictions compared against a 2025 baseline.

Important scope note:

- the repository contains the dataset viewer and API layer
- the repository does not contain model training or online inference code

## Current Implementation

Relevant files:

```text
app/predictions/
├── page.tsx
├── layout.tsx
├── types.ts
├── usePredictions.ts
├── filters.tsx
├── data-table.tsx
└── README.md

app/api/predictions/
└── route.ts
```

Runtime behavior:

- the client page manages filter state, pagination, and sort state
- the API route reads `scripts/predictions_2026_complete.csv`
- filtering and pagination happen server-side in the route handler
- summary statistics are calculated from the filtered record set

## Dataset Contract

Primary columns used by the module:

| Column                  | Meaning                                     |
| ----------------------- | ------------------------------------------- |
| `seat_id`               | unique row identifier                       |
| `institute`             | institute name                              |
| `branch`                | branch or program name                      |
| `seat_type`             | category code                               |
| `quota`                 | quota code                                  |
| `predicted_cutoff_2026` | predicted 2026 closing rank                 |
| `change_from_2025`      | absolute change against the 2025 baseline   |
| `pct_change_from_2025`  | percentage change against the 2025 baseline |

The API filters out rows with missing, zero, or invalid predicted cutoff values.

## API Contract

Endpoint:

```text
GET /api/predictions
```

Supported query parameters:

- `page`
- `perPage`
- `institute`
- `branch`
- `seatType`
- `quota`
- `search`
- `minCutoff`, `maxCutoff`
- `minChange`, `maxChange`
- `sortBy`, `sortOrder`

Behavior to remember:

- the default sort is `change_from_2025` ascending
- for `change_from_2025` and `pct_change_from_2025`, sorting is based on absolute value in the API route so the smallest movement from the baseline appears first

## UI Behavior

The page currently supports:

- free-text search across institute, branch, and seat ID
- controlled filters with explicit apply and clear actions
- sortable tabular output
- summary cards for average predicted cutoff, average absolute change, and average percentage change
- configurable pagination sizes

## Metadata and Search Presentation

`app/predictions/layout.tsx` supplies the route metadata and FAQ JSON-LD. The user-facing copy on the page and metadata currently brands the feature as an AI-powered predictor, but the implementation in this repository is a dataset-backed viewer for precomputed outputs.

## Operational Notes

- `scripts/predictions_2026_complete.csv` must exist in the repository or deployment artifact for the route to succeed
- the current implementation reads and parses the CSV at request time
- if this dataset grows materially, moving it into a table-backed source would be the next obvious operational improvement
