# Phase 3 - Discord HTTP Interactions on Vercel

## Objective

Add Discord slash command support through a Vercel HTTP endpoint, avoiding an always-on Discord gateway worker.

## Routes and Scripts

- Route: `POST /api/bot/discord/interactions`
- Script: `npm run discord:register`

## Slash Command

```text
/cutoff percentile:<number> year:<integer> round:<integer>
```

Options:

- `percentile`: required number, min `0`, max `100`
- `year`: optional integer, choices from supported years, default `2025`
- `round`: optional integer, choices `1`, `2`, `3`, `4`, default `1`

## Request Handling

- Verify `X-Signature-Ed25519` and `X-Signature-Timestamp` using `discord-interactions`.
- Handle Discord `PING` with `PONG`.
- For `/cutoff`, call the shared cutoff helper directly. Do not make an HTTP request from the Vercel route back into the same Vercel app.
- Return a concise public response with top 5 results.
- Log one `cutoff_request` usage event after each command attempt with platform `discord`, request ID from the Discord interaction ID, source guild/channel when available, status, result count, and duration.
- Count `status = 'served'` only after Discord accepts the initial or follow-up response. A valid no-results reply is still `served` with `result_count = 0`.

## Response Format

Use a compact message, not a complex embed in v1:

```text
MHT-CET state cutoffs near 95 percentile, 2025 Round 1, Open General

1. College - Course | 94.82% | Rank 12345 | GOPENS
2. College - Course | 94.71% | Rank 12510 | GOPENH

More: https://deetnuts.com/mht-cet/state-cutoffs?percentile=95&year=2025&round=1
```

## Implementation Notes

- Use `discord.js` latest for command registration and REST helpers.
- Use `discord-interactions` latest for signature verification and interaction response constants.
- In the Next.js route, read `await request.text()` for signature verification before `JSON.parse`.
- If a query might exceed Discord's initial response deadline, respond with a deferred interaction and edit the original response.
- Set `allowed_mentions: { parse: [] }` on Discord responses so college names or copied text cannot ping users or roles.
- Keep Discord-specific formatting in a thin adapter that consumes the shared bot result shape.

## Verification Gate

- Discord Developer Portal accepts the endpoint URL.
- Invalid Discord signatures return `401`.
- `PING` returns the expected `PONG`.
- Slash command registration succeeds against a test Discord application.
- A test command returns top 5 rows in a Discord channel.
- Discord responses do not ping roles/users even if data contains mention-like text.
- Each Discord command attempt creates one usage event, including rejected validation attempts.
