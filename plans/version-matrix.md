# Version Matrix

## Package Versions Checked

Latest npm versions checked from the workspace on 2026-06-20:

| Package                 | Latest Version | Planned Use                                                   |
| ----------------------- | -------------: | ------------------------------------------------------------- |
| `discord.js`            |      `14.26.4` | Slash command registration and Discord REST helpers           |
| `discord-interactions`  |        `4.4.0` | Discord HTTP signature verification and interaction constants |
| `snoowrap`              |       `1.23.0` | Reddit OAuth API client for the VPS worker                    |
| `@supabase/supabase-js` |      `2.108.2` | Server-side Supabase access                                   |
| `zod`                   |        `4.4.3` | Bot API input validation                                      |
| `tsx`                   |       `4.22.4` | Development runner for TypeScript scripts/workers             |
| `dotenv`                |       `17.4.2` | VPS worker environment loading                                |
| `tweetnacl`             |        `1.0.3` | Fallback Discord signature verification if needed             |

## Existing Repo Versions

The repo currently uses:

| Package                 | Current Repo Version |
| ----------------------- | -------------------: |
| `next`                  |            `^16.1.4` |
| `react`                 |            `^19.2.3` |
| `@supabase/supabase-js` |            `^2.50.3` |
| `zod`                   |            `^3.23.8` |
| `tsx`                   |            `^4.21.0` |
| `dotenv`                |            `^16.4.7` |

## Upgrade Guidance

- Use latest versions for new bot dependencies.
- Upgrade shared dependencies only when the phase needs them:
  - `zod` v4 is useful for the new bot API, but upgrading the whole app from zod v3 to v4 can have broader type/API impact.
  - `@supabase/supabase-js` can be bumped independently if existing type checks pass.
  - `dotenv` and `tsx` bumps are low-risk for scripts but should still run script smoke tests.
- Avoid dependency churn outside bot-related needs.

## Docs Checked Through Context7 MCP

- `discord-interactions`: request signature verification and PING handling.
- `discord.js`: slash command registration and number/integer command options.
- `snoowrap`: OAuth credentials and Reddit comment reply operations.

## External Platform Facts Checked

- Vercel Hobby Cron supports only once-per-day schedules, so Reddit polling should not run on Vercel Hobby.
- Discord Interactions can be received over HTTP outgoing webhooks, which fits Vercel serverless routes.
- Reddit API clients must authenticate with OAuth, use a descriptive User-Agent, and monitor rate-limit headers.
