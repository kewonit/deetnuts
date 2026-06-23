# Phase 4 - Reddit Worker on DigitalOcean

## Objective

Run a small long-lived Reddit worker on the existing DigitalOcean VPS that watches configured subreddits for cutoff commands and replies automatically.

## Runtime

- Node.js 22.
- `snoowrap` for Reddit API access.
- `pm2` or `systemd` for process supervision.
- Environment stored outside git on the VPS.

## Worker Behavior

- Poll configured subreddits every 30-90 seconds.
- Look for comments containing `--percentile`.
- Parse:
  - required `--percentile`
  - optional `--year`
  - optional `--round`
- Ignore comments from the bot's own Reddit username.
- Ignore deleted or removed comments.
- Claim the Reddit comment ID through `POST /api/bot/events/claim` before replying. If the claim already exists, skip it.
- Call `POST /api/bot/cutoffs` on Vercel with `BOT_API_TOKEN`.
- Reply with top 5 Markdown results and a DEETNUTS link.
- Mark the claimed event as `replied`, `skipped`, or `failed` after processing.
- Log one `cutoff_request` usage event through Vercel for every parsed command attempt, using the Reddit comment ID as `request_id`.
- Count `status = 'served'` only after Reddit accepts the reply. A valid no-results reply is still `served` with `result_count = 0`.
- Do not rely on `POST /api/bot/cutoffs` to count Reddit served requests; that endpoint is only the query source for the worker.

## Processed Event Storage

Use Supabase through the protected Vercel API or a minimal dedicated route. Preferred table shape:

```sql
create table if not exists public.bot_processed_events (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  external_id text not null,
  action text not null,
  status text not null default 'processing',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform, external_id)
);
```

## Reddit Safety

- Use OAuth credentials and a descriptive User-Agent.
- Respect Reddit rate-limit headers.
- Add jitter to polling intervals.
- Do not store Reddit comment bodies long term; store IDs and processing metadata only.
- Add dry-run mode that logs would-be replies without posting.
- Run only in explicit opt-in subreddits. Do not discover or reply outside `REDDIT_SUBREDDITS`.
- Escape Reddit Markdown-sensitive characters in college/course names.
- Include a short "not admission advice / verify official CAP data" footer in replies.

## Response Format

```md
MHT-CET state cutoffs near **95 percentile**, **2025 Round 1**, Open General:

1. College - Course | 94.82% | Rank 12345 | GOPENS
2. College - Course | 94.71% | Rank 12510 | GOPENH

More results: https://deetnuts.com/mht-cet/state-cutoffs?percentile=95&year=2025&round=1
```

## Verification Gate

- Dry-run worker sees commands but does not reply.
- Duplicate command comments are not processed twice after restart.
- Real reply test works in a private/test subreddit.
- Worker survives process restart and resumes polling.
- Two worker instances racing on the same comment produce at most one reply.
- Reddit command attempts appear in `bot_usage_events` with platform `reddit`, source subreddit, status, result count, and duration.
