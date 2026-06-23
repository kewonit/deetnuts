# Phase 5 - Observability, Tests, and Rollout

## Objective

Ship safely with enough telemetry to catch duplicate replies, bad parsing, invalid requests, and upstream API failures.

## Test Coverage

- Parser tests:
  - flag order variations
  - decimals
  - missing percentile
  - invalid year
  - invalid round
  - extra surrounding Reddit prose
  - multiple command snippets in one comment
- Query tests:
  - valid year/round mapping
  - 2025 round 4 accepted
  - top 5 cap
  - closest eligible cutoff sorting
  - duplicate category rows collapse into unique college-course results
  - empty result behavior
- Discord tests:
  - PING response
  - invalid signature rejection
  - command option extraction
  - response formatting
  - mention suppression
- Reddit worker tests:
  - self-comment skip
  - duplicate processed-event skip
  - race-safe claim conflict
  - dry-run mode
  - Markdown escaping
  - API failure handling
  - opt-in subreddit allowlist
- Usage logging tests:
  - successful Discord request logs one served event
  - successful Reddit request logs one served event
  - Reddit query API call plus Reddit reply still logs only one `cutoff_request`
  - valid no-results command logs served with `result_count = 0`
  - invalid command logs rejected, not served
  - API failure logs failed with an error code
  - no path writes duplicate usage rows for one command attempt

## Observability

- Add structured logs for:
  - platform
  - external event ID
  - parsed percentile/year/round
  - source guild or subreddit
  - outcome: replied, skipped, invalid, duplicate, failed
- Add persistent usage logs in `bot_usage_events` for:
  - `request_id`
  - `external_id`
  - `platform`
  - `source`
  - `event_name`
  - `status`
  - `percentile`
  - `year`
  - `round`
  - `result_count`
  - `duration_ms`
  - `error_code`
- Do not log secrets.
- Do not log full Reddit comment bodies in production.
- Count served requests from `bot_usage_events` where `event_name = 'cutoff_request'` and `status = 'served'`.
- Do not count `cutoff_query` or `worker_heartbeat` as served requests.
- Keep `event_name` and `status` values constrained to shared constants.
- Add a basic daily count query and optional admin-only script, e.g. `npm run bot:usage`, before adding any external metrics service.
- Add a worker heartbeat log at startup and after each polling cycle.
- Add retention guidance: keep raw usage events for 90 days by default, then either delete or aggregate daily counts.

## Count Queries

Daily served requests by platform:

```sql
select
  platform,
  date_trunc('day', created_at) as day,
  count(*) as served
from public.bot_usage_events
where event_name = 'cutoff_request'
  and status = 'served'
group by platform, day
order by day desc, platform;
```

Recent failures:

```sql
select created_at, platform, source, status, error_code
from public.bot_usage_events
where status in ('failed', 'rejected')
order by created_at desc
limit 100;
```

Request volume by source:

```sql
select platform, source, count(*) as served
from public.bot_usage_events
where event_name = 'cutoff_request'
  and status = 'served'
  and created_at >= now() - interval '7 days'
group by platform, source
order by served desc;
```

## Rollout Steps

1. Deploy Vercel bot API and Discord endpoint to preview.
2. Register Discord command against a test guild only.
3. Run Discord smoke test.
4. Deploy Vercel production routes.
5. Configure Discord production Interaction Endpoint URL.
6. Start Reddit worker on VPS in dry-run mode.
7. Confirm dry-run detections for 24 hours or a representative test window.
8. Enable Reddit replies in a test subreddit.
9. Enable Reddit replies for target subreddits.
10. Keep Reddit worker in single-instance mode unless the claim endpoint has passed race tests.

## Rollback

- Discord: remove or disable the Interaction Endpoint URL in the Discord Developer Portal.
- Reddit: stop the VPS process with `pm2 stop` or `systemctl stop`.
- API: rotate `BOT_API_TOKEN` if needed.

## Verification Gate

- Discord command works in production.
- Reddit worker runs for at least one restart cycle without duplicate replies.
- Logs show successful and skipped events clearly.
- Served-request counts are queryable by platform and day.
- Rollback steps have been tested once in a non-production or dry-run setting.
