# Phase 2 - Protected Bot API on Vercel

## Objective

Expose a small server-side API for Discord and the Reddit VPS worker to query cutoff results without duplicating database credentials or query behavior.

## Route

```text
POST /api/bot/cutoffs
```

Supporting idempotency routes for the Reddit worker:

```text
POST /api/bot/events/claim
PATCH /api/bot/events/:id
POST /api/bot/logs
```

## Request Body

```json
{
  "percentile": 95,
  "year": 2025,
  "round": 1
}
```

## Response Body

```json
{
  "success": true,
  "data": {
    "query": {
      "percentile": 95,
      "year": 2025,
      "round": 1,
      "categoryGroup": "Open Category (General)"
    },
    "rows": []
  }
}
```

## Security

- Require an `Authorization: Bearer <BOT_API_TOKEN>` header.
- Keep `BOT_API_TOKEN` only in Vercel and the VPS environment.
- Keep Supabase service-role credentials only on Vercel.
- Return `401` for missing or invalid bot token.
- Do not add Reddit VPS environment variables to `env.ts`; validate those inside the VPS worker so Vercel builds do not depend on Reddit credentials.

## Error Behavior

- `400`: invalid percentile, year, round, or malformed JSON.
- `401`: missing/invalid bot token.
- `404`: supported request shape but no matching cutoff rows.
- `500`: unexpected query failure.

## Implementation Notes

- Use `zod` for request validation.
- Use `NextResponse.json`.
- Keep this route server-only and uncached.
- Include a source URL in successful responses so bots can link to the matching DEETNUTS web filters.
- Add a Supabase migration for `bot_processed_events` with RLS enabled and no public policies. Access should happen through service-role-backed Vercel routes only.
- Add a Supabase migration for `bot_usage_events` with RLS enabled and no public policies. This is the canonical served-request counter.
- Implement `events/claim` as an insert-first operation with a unique `(platform, external_id)` constraint. If insert conflicts, the worker skips the event.
- Implement `logs` through one shared `logBotUsageEvent` helper; routes and workers should not write raw metric rows directly.
- Add a simple allowlist check for configured Discord guild IDs and Reddit subreddit names before doing database work.
- Do not log `cutoff_request` from `POST /api/bot/cutoffs` for Reddit calls. The platform adapter that actually delivers the user-visible response owns the served/rejected/failed request log.
- If API-level telemetry is needed later, use a separate event name such as `cutoff_query`, and exclude it from served request counts.

## Usage Event Storage

Use a narrow append-only table for counts and basic debugging:

```sql
create table if not exists public.bot_usage_events (
  id uuid primary key default gen_random_uuid(),
  request_id text not null,
  external_id text,
  platform text not null,
  source text,
  event_name text not null,
  status text not null,
  percentile numeric,
  year int,
  round int,
  result_count int,
  duration_ms int,
  error_code text,
  created_at timestamptz not null default now()
);

alter table public.bot_usage_events
  add constraint bot_usage_events_event_name_check
  check (event_name in ('cutoff_request', 'cutoff_query', 'worker_heartbeat'));

alter table public.bot_usage_events
  add constraint bot_usage_events_status_check
  check (status in ('served', 'rejected', 'failed', 'duplicate', 'skipped', 'heartbeat'));

create index if not exists idx_bot_usage_events_created_at
  on public.bot_usage_events (created_at desc);

create index if not exists idx_bot_usage_events_platform_status_created_at
  on public.bot_usage_events (platform, status, created_at desc);

create unique index if not exists idx_bot_usage_events_request_once
  on public.bot_usage_events (event_name, platform, request_id)
  where event_name = 'cutoff_request';
```

Counting served requests should use:

```sql
select platform, date_trunc('day', created_at) as day, count(*) as served
from public.bot_usage_events
where event_name = 'cutoff_request' and status = 'served'
group by platform, day
order by day desc, platform;
```

## Verification Gate

- Route rejects missing bot token.
- Route rejects invalid percentile/year/round.
- Route returns deterministic top 5 rows for a mocked query helper.
- No route response leaks internal table names, service-role details, or raw stack traces.
- Processed-event claim is race-safe under duplicate requests.
- Platform command attempts create exactly one `bot_usage_events` row for `event_name = 'cutoff_request'`.
- Shared backend query calls do not create `cutoff_request` served rows.
- Failed validation/query paths create one row with `status = 'rejected'` or `status = 'failed'` at the platform boundary.
