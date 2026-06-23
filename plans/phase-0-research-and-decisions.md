# Phase 0 - Research and Decisions

## Objective

Lock the v1 behavior and integration constraints before implementation begins.

## Decisions

- Keep v1 to MHT-CET state cutoffs.
- Use existing `app/mht-cet/state-cutoffs/constants.ts` for supported years and rounds.
- Treat current code as authoritative where docs disagree. The checked-in round support docs are stale for 2025; current constants support 2025 rounds 1-4.
- Use Vercel for request/response workloads and DigitalOcean for long-running Reddit polling.
- Use latest compatible package versions listed in [Version Matrix](./version-matrix.md).

## Implementation Notes

- Confirm the existing state cutoff API sanitizer is fixed before relying on it. It currently clamps API route rounds to 1-3, while the constants allow 2025 round 4.
- Do not reuse the existing `getCutoffRecords` server action directly for the bot, because it enforces web-user authentication.
- Do not put Supabase service-role credentials on the VPS. The Reddit worker should use `BOT_API_TOKEN` against Vercel.
- Keep all command output short enough for Reddit and Discord without pagination in v1.

## Deliverables

- Final command contract:
  - Reddit comment: `--percentile <number> [--year <number>] [--round <number>]`
  - Discord slash command: `/cutoff percentile:<number> year:<number> round:<number>`
- Final default behavior:
  - `year = 2025`
  - `round = 1`
  - `limit = 5`
  - Open/general categories only

## Verification Gate

- A developer can state exactly what a v1 request means without making product decisions.
- No implementation depends on stale docs or duplicated year/round mappings.
- Hosting approach is clear for both Vercel Hobby and the existing DigitalOcean VPS.
