# Architecture and DRY Audit

## Verdict

The overall direction is correct: Vercel for HTTP Discord interactions and protected cutoff APIs, DigitalOcean for the Reddit poller, and Supabase as the single data source.

The main thing to tighten is the code boundary. The implementation should be built as a small domain core with thin platform adapters. If Discord, Reddit, and API routes each parse inputs, build filters, format links, or sort rows separately, the codebase will get sloppy quickly.

## First-Principles Shape

The system has four jobs:

1. Understand a request: normalize `percentile`, `year`, and `round`.
2. Query data: map year/round to one cutoff table and fetch general/open rows.
3. Present results: turn rows into a short top-5 answer and a DEETNUTS URL.
4. Deliver safely: Discord verifies signed HTTP interactions; Reddit polls, claims, replies, and avoids duplicates.

Only job 4 should be platform-specific.

## DRY Boundaries

Keep one shared domain layer:

- one input schema/normalizer
- one year/round resolver
- one general category source
- one cutoff query helper
- one dedupe/top-5 algorithm
- one DEETNUTS URL builder
- one platform-neutral result shape
- one usage logging helper

Keep platform adapters thin:

- Discord adapter: signature verification, slash option extraction, Discord response envelope.
- Reddit adapter: polling, comment parsing, idempotency claim, Reddit Markdown reply.
- Vercel API adapter: token verification, JSON request/response.

Do not do these:

- Do not copy `CATEGORY_GROUPS`, `ROUNDS_BY_YEAR`, or table names into bot files.
- Do not make Discord and Reddit each implement their own top-5 logic.
- Do not call Vercel HTTP routes from other Vercel routes.
- Do not let the Reddit VPS hold Supabase service-role credentials.
- Do not make all bot env vars globally required in `env.ts`.

## What We Missed

1. **Result dedupe.** Raw cutoff rows can repeat the same college/course across open-category variants. Bot replies should return top 5 unique college-course results, not five near-duplicate rows.

2. **Category semantics.** "General cutoffs" is not a perfect student profile. The bot should say Open General and still display the exact category code used, with a short official-data disclaimer.

3. **Race-safe Reddit idempotency.** Checking "was this processed?" before replying is not enough. The worker must claim the event with a unique insert before replying.

4. **Shared formatting.** We need one platform-neutral result shape and platform-specific renderers. Otherwise Discord and Reddit formatting will drift.

5. **Shared URL building.** The DEETNUTS link should come from one helper so query params stay consistent with the web app.

6. **Environment isolation.** Reddit credentials belong to the VPS worker, not Vercel `env.ts`. Discord/Vercel env should be validated only where used.

7. **Allowlists.** The bot should only respond in configured Discord guilds and configured Reddit subreddits.

8. **Abuse control.** V1 can be simple, but it still needs cheap limits: capped query size, no arbitrary filters, no unbounded comments, and optional per-user/channel cooldowns if usage spikes.

9. **Markdown and mention safety.** Reddit Markdown must be escaped. Discord replies need `allowed_mentions: { parse: [] }`.

10. **Raw body handling.** Discord signature verification needs the raw request body, so the Next route must read `request.text()` before parsing JSON.

11. **Processed-event schema.** The table needs status and metadata fields, not just a comment ID, so failed and skipped events are debuggable.

12. **Worker build boundary.** The Reddit worker needs a separate build/run story, ideally `tsconfig.bot.json` plus `dist/bot`, so it does not become tangled with the Next app.

13. **Existing route mismatch.** The current state-cutoff API route still clamps rounds to 1-3 even though constants support 2025 round 4. Fix that before reusing any route behavior.

14. **Docs mismatch.** Existing round-support docs are stale for 2025. Update them or explicitly avoid depending on them.

15. **Test fixtures.** Bot query tests should use fixtures/mocks first, not live Supabase data, so CI does not depend on production data availability.

16. **Reddit moderation reality.** Some subreddits may remove or rate-limit bot replies. Roll out in an opt-in/test subreddit before broader use.

17. **Served-request counting.** Console logs alone are not enough. Add a structured `bot_usage_events` table and one shared logging helper so we can count served requests by platform, subreddit/guild, status, year, round, and day.

18. **Metrics overcount risk.** The protected cutoff API is shared by Discord and Reddit, so it must not count every backend query as a served user request. Count `cutoff_request` only at platform boundaries after a Discord response is accepted or a Reddit reply succeeds.

19. **Served semantics.** Define `served` precisely. For v1, `served` means the bot delivered a user-visible answer, including a valid no-results answer with `result_count = 0`. Invalid commands are `rejected`; delivery/query errors are `failed`; duplicates are `duplicate` or `skipped`.

20. **Telemetry retention.** Usage events can grow forever. Add a retention policy or scheduled cleanup before volume becomes annoying.

21. **Metric schema drift.** Statuses and event names need enums or narrow constants. Otherwise each adapter will invent variants like `success`, `ok`, `answered`, and the counts become mush.

22. **Privacy boundary.** Logs should store platform IDs needed for debugging, but not Reddit comment bodies, Discord message text, or user handles in v1.

## Correctness Check

The core cutoff rule is correct for the stated v1: if a user has percentile `P`, show rows with cutoff percentile `<= P`, sorted descending so the closest matches appear first.

The bot should not claim admission certainty. The safest wording is "cutoffs near your percentile" and "verify official CAP data."

## Implementation Guardrail

Before implementing any phase, create the shared domain module first. Every platform route or worker should consume that module rather than reimplementing small pieces locally. That is the single highest-leverage move for keeping this clean.

Usage logging should follow the same rule: platform adapters emit one normalized event through a shared helper, and no adapter invents its own metric names.

Served-request counting should happen at the delivery boundary, not the database-query boundary.
