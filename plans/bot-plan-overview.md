# DEETNUTS Discord and Reddit Bot Plan

## Goal

Build a lightweight bot system that lets students ask for general MHT-CET cutoff suggestions from Discord or Reddit using a small command surface, then receive the top 5 closest eligible cutoff rows automatically.

Canonical v1 request shape:

```text
--percentile 95 --year 2025 --round 1
```

Discord should expose the same idea as a slash command:

```text
/cutoff percentile:95 year:2025 round:1
```

## Current Decision Set

- Dataset: MHT-CET state cutoffs only for v1.
- Category default: existing Open Category general group from `CATEGORY_GROUPS["Open Category (General)"]`.
- Result rule: return records where `cutoff_score <= percentile`, sorted by highest `cutoff_score` first, limited to 5.
- Year/round source of truth: existing app constants, not duplicated bot constants.
- Hosting:
  - Vercel Hobby for Discord HTTP interactions and protected cutoff API routes.
  - Existing DigitalOcean VPS for the long-running Reddit poller.
- Reddit worker should call the protected Vercel bot API instead of holding Supabase service-role credentials on the VPS.

## Why This Hosting Split

- Discord supports HTTP Interactions endpoints, so Vercel is a good fit for slash commands.
- Vercel Hobby Cron runs only once per day, so it is not suitable for Reddit comment polling.
- Reddit has no practical incoming webhook for arbitrary subreddit comments; the worker must poll or stream comments.
- The existing DigitalOcean VPS already has spare compute and can run a small Node worker with `pm2` or `systemd`.

## Karpathy Guidelines Applied

This plan follows the requested Karpathy-style discipline from `multica-ai/andrej-karpathy-skills`:

- Think before coding: assumptions and tradeoffs are called out in each phase.
- Simplicity first: v1 avoids all-India, JoSAA, personalization, and fuzzy college/course filters unless explicitly added later.
- Surgical changes: keep bot query logic shared, but avoid broad refactors of the web cutoff UI.
- Goal-driven execution: every phase has a verification gate before moving on.

## Phase Files

1. [Phase 0 - Research and Decisions](./phase-0-research-and-decisions.md)
2. [Phase 1 - Shared Cutoff Query Core](./phase-1-shared-cutoff-query-core.md)
3. [Phase 2 - Protected Bot API on Vercel](./phase-2-protected-bot-api-vercel.md)
4. [Phase 3 - Discord HTTP Interactions](./phase-3-discord-interactions-vercel.md)
5. [Phase 4 - Reddit Worker on DigitalOcean](./phase-4-reddit-worker-digitalocean.md)
6. [Phase 5 - Observability, Tests, and Rollout](./phase-5-observability-tests-rollout.md)
7. [Version Matrix](./version-matrix.md)
8. [Architecture and DRY Audit](./architecture-dryness-audit.md)

## Sources Consulted

- Karpathy guidelines repo: https://github.com/multica-ai/andrej-karpathy-skills
- Discord Interactions docs: https://docs.discord.com/developers/interactions/overview
- Discord receiving/responding docs: https://docs.discord.com/developers/interactions/receiving-and-responding
- Vercel Cron limits: https://vercel.com/docs/cron-jobs/usage-and-pricing
- Reddit Data API policy and rate limits: https://support.reddithelp.com/hc/en-us/articles/16160319875092-Reddit-Data-API-Wiki
