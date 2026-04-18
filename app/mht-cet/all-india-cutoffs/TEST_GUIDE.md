# MHT-CET All-India Cutoffs Test Guide

## Goal

Validate two things separately:

1. the current user-facing page implementation
2. all three round-specific API handlers

This distinction matters because the current checked-in page exposes only round one in the visible tab list, while the API layer still supports rounds one, two, and three.

## Quick Start

1. Start the development server.

   ```bash
   npm run dev
   ```

2. Open the page.

   ```text
   http://localhost:3000/mht-cet/all-india-cutoffs
   ```

3. Hit the API endpoints directly.

   ```text
   http://localhost:3000/api/mht-cet/all-india-cutoffs/2024-round-one
   http://localhost:3000/api/mht-cet/all-india-cutoffs/2024-round-two
   http://localhost:3000/api/mht-cet/all-india-cutoffs/2024-round-three
   ```

## Page-Level Checks

- [ ] page loads without runtime errors
- [ ] round-one data appears in the table
- [ ] loading states render during fetches
- [ ] pagination updates the dataset correctly
- [ ] search and branch filters update results
- [ ] percentile and rank range filters work
- [ ] table sorting updates the request and rendered order
- [ ] mobile layout remains usable

## API-Level Checks

- [ ] round-one endpoint returns records and pagination
- [ ] round-two endpoint returns records and pagination
- [ ] round-three endpoint returns records and pagination
- [ ] `search` filters results
- [ ] `branch` and `branches` filters narrow records correctly
- [ ] percentile and rank bounds are respected
- [ ] invalid inputs fail gracefully without crashing the route

## Useful API Queries

```bash
curl "http://localhost:3000/api/mht-cet/all-india-cutoffs/2024-round-one?page=1&perPage=10"
curl "http://localhost:3000/api/mht-cet/all-india-cutoffs/2024-round-two?page=1&perPage=10"
curl "http://localhost:3000/api/mht-cet/all-india-cutoffs/2024-round-three?page=1&perPage=10"
curl "http://localhost:3000/api/mht-cet/all-india-cutoffs/2024-round-one?search=computer"
curl "http://localhost:3000/api/mht-cet/all-india-cutoffs/2024-round-one?branch=Computer%20Science"
curl "http://localhost:3000/api/mht-cet/all-india-cutoffs/2024-round-one?minPercentile=90&maxPercentile=95"
curl "http://localhost:3000/api/mht-cet/all-india-cutoffs/2024-round-one?sort=rank"
```

## Known Current Limitation

Do not use the presence or absence of round-two and round-three tabs in `page.tsx` as the sole signal that those datasets are available. The API handlers are the authoritative check for those rounds in the current repository state.

## Common Failure Modes

### API returns empty data

- verify the corresponding Supabase tables exist and contain data
- confirm the environment variables used by the compatibility client are loaded

### Filters appear to do nothing

- inspect the request URL in the browser network panel
- confirm the expected query parameters are present
- test the equivalent API call directly to isolate UI issues from backend issues

### Slow or inconsistent fetches

- confirm that aborted requests are expected during active typing
- inspect the browser network panel to ensure only the latest request completes

## Success Criteria

- page-level filtering and pagination behave correctly for the active route
- all three API handlers return valid payloads
- no uncaught console errors appear during normal use
- mobile and desktop layouts remain functional
