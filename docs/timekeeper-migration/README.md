# TimeKeeper migration

TimeKeeper is implemented as native routes in Deetnuts at `/exam-countdown`. The imported production source is `Version-3`, commit `8cb737981c61f06e7b0baca248f7e237c763abd4`, confirmed in the authenticated Cloudflare deployment. The integration contains 58 exams, 13 categories and 74 indexable pages. The old application continues to serve its current URLs until the rollout evidence passes.

`manifest.json` records every valid page, historical alias, observed Search Console landing path, removed page and known missing page. `preflight.json` records captured facts and outstanding gates. Missing evidence stays missing; successful local tests do not establish production capacity, ownership, stability or indexing.

## Configuration and retained services

The existing study backend remains `https://ivmobluuegkikmbwbfhe.supabase.co`. Supply `TIMEKEEPER_SUPABASE_URL` and `TIMEKEEPER_SUPABASE_ANON_KEY` in the existing root-owned runtime `web.env`. Only its public anon/publishable key is permitted. The feature loads these values through a non-cacheable runtime endpoint; build images contain neither backend credentials nor private transfer data. Do not execute the source repository's Supabase schema: it contains destructive operations and is unnecessary for this migration.

Apply the additive PocketBase ticket migration and backend service hooks through the existing PocketBase deployment. Its collection has no public API permissions. Tickets contain only saved countdowns, theme and avatar seed, use random 256-bit bearer tokens stored as hashes, expire after 15 minutes, and erase their payload on successful redemption. Concurrent redemption has one winner. The old browser's original storage is retained; JSON export/import is available for recovery. Auth sessions, cookies and location are not transferred.

The integration uses Deetnuts' existing consent and analytics components. Retain the old GA property `G-Q2J1V5S9K5` and its historical reports. New traffic uses the existing Deetnuts property `G-PF9S037SJQ`.

Fonts, icons, manifest and service worker are local to the feature. The worker caches only its own fonts and favicon; it never caches HTML, API responses or transfer tickets. CSS and theme preferences are scoped to TimeKeeper. Only feature pages receive the map/avatar/backend CSP. Preview hostnames receive `X-Robots-Tag: noindex, nofollow`; production canonicals and sitemap URLs use `https://www.deetnuts.com`. The production Cloudflare cache rule `TimeKeeper service worker updates` matches only `www.deetnuts.com/exam-countdown/sw.js`, bypasses edge caching and respects the origin browser TTL. It prevents the zone-wide four-hour browser TTL from extending service-worker updates; keep this scoped exception during deployment and recovery.

## Verification

Run from the repository root:

```sh
npm run verify:timekeeper-manifest
npm run test:timekeeper
POCKETBASE_TEST_BINARY=/absolute/path/to/verified/pocketbase npm run test:timekeeper-tickets
npm run lint
npm run typecheck
npm audit --audit-level=high
EJAM_DATA_ROOT=ejam/data npm run build
```

The PocketBase tests create and delete only their own temporary database. CI downloads the same official version as the candidate container and verifies its checksum before running them. The candidate pins PocketBase 0.40.5: its official Go security patch resolves the two high-severity findings that blocked the 0.40.0 image. Verify the retained production backup with the patched image and additive ticket migration before updating the live backend. CI also runs the feature browser tests alongside the existing JEE checks at 320, 390, 768, 1024 and 1440 pixels. Map and transfer requests in browser tests are fixtures; tests do not create study sessions on the live backend.

Local verification on 2026-10-09 passed the production build, all 74 routes and 38 assets, 147 browser checks, 22 migration unit tests, four real PocketBase integration tests and 13 JEE unit tests. Three existing JEE mobile-only assertions are skipped at wider viewports. Lint and typecheck passed, and a single read-only `get_active_study_sessions` call returned 200 from the retained Supabase backend. These checks do not establish live deployment capacity or complete any observation period; production rollout gates remain closed.

Against an isolated running candidate:

```sh
PLAYWRIGHT_BASE_URL=https://candidate.example npm run test:e2e:production
TIMEKEEPER_VERIFY_ORIGIN=https://candidate.example \
TIMEKEEPER_VERIFY_PREVIEW=true \
EXPECTED_DEPLOYMENT_SHA=FULL_RELEASE_SHA npm run verify:timekeeper
```

Use a real production hostname for the final indexability report; omit `TIMEKEEPER_VERIFY_PREVIEW` there. The host's internal deployment smoke check explicitly supplies `Host: www.deetnuts.com` and checks all manifest pages, canonical URLs, static content, structured data, missing pages, sitemap membership, assets, cacheability, one feature CSP and the public study-map configuration before switching slots. A preview pass must not substitute for a production indexability pass.

Capacity uses `scripts/timekeeper-capacity.mjs`, separate from the existing 10-RPS smoke test. Copy `capacity.example.json` into the private recovery directory and fill it with hostname-specific measured peaks, latency baselines, exact release SHA, matching production CPU/RAM limits and evidence of isolation. Daily totals and unknown measurements are rejected. Run only against the isolated candidate:

```sh
npm run test:timekeeper-capacity -- \
  --config=/absolute/private/path/capacity-input.json \
  --report=/absolute/private/path/capacity-report.json
```

Both warm and cache-miss phases offer at least twice the observed combined peak for at least five minutes. The runner exercises the feature, existing public pages and uncached configuration/health reads. It checks completed request rate, generator delay, errors, p95/p99 latency against measured baselines, and cache-miss evidence. A random query or `no-cache` request header alone is insufficient evidence that a CDN missed. `origin-only` requires a documented isolated origin that bypasses CDN cache; `observed-edge-misses` requires response headers proving misses. This test does not establish Supabase capacity; that unchanged backend still needs a read-only connection check and monitoring during rollout. Keep live production hostnames out of this test.

## Prepare recovery and deploy

1. Preserve the full Timekeeper Git bundle, source checkout, pinned deployment, hosting configuration and Search Console reports. Recovery files are in the ignored `.migration-recovery/timekeeper` directory; retain a separate durable copy before cutover. The confirmed source and lockfile produced a complete recovery build with all 74 mapped pages and their referenced assets. Its archived output is retained privately alongside representative immutable-deployment HTML/assets; it is not a byte-identical Cloudflare export. Verify the retained artifact or pinned source fallback on an isolated host before binding the old hostname.
2. Record the actual Deetnuts live SHA and immutable image digests, active slot, runtime/configuration backups and existing rollback manifests. Do not infer the live release from the current Git branch. At initial inspection, `/api/health` identified `76f0efbb09f9f1e0ca7e5c140d62fda2c662cdee`, while local `main` was newer.
3. Capture old-host DNS, active certificates, TLS mode, Workers routes, redirects/page rules and both Search Console ownership/indexing/sitemap reports. Inspect every Pages project connected to the source repository, including `exam-timekeeper`, before disconnecting integrations.
4. Build and verify the exact candidate images in CI, then use the existing Deetnuts host's inactive slot. The user explicitly ruled out creating another Droplet. Both slots share the production machine, so checks on that slot do not establish isolated capacity; do not run the aggressive capacity test there or mark its gate passed. Preserve the capacity requirement before permanent redirects. Supply the dedicated public study-map configuration and additive PocketBase migration; retain the old app and study backend.
5. Deploy using Deetnuts' existing blue/green workflow. Its ten-minute health observation is an initial release check, not the migration's 24-hour observation. Record when the new production routes became available and monitor both applications for a full clean 24 hours.
6. Test recovery to a retained release that contains the new, indexable routes. Pin its SHA in `/opt/deetnuts/state/timekeeper-rollback-sha`, owned by root with mode `0600`. That manifest is excluded from normal pruning. Record the web image digest and a fresh route verification report for the rollback release.

## Old-origin compatibility service

`timekeeper-compat/worker.mjs` is maintained from this repository. Its default phase is `serve`; `wrangler.jsonc` intentionally has no production routes. It fetches legacy documents/assets from the pinned immutable Pages deployment, never from the old public hostname, which would cause a loop after binding.

The unbound Cloudflare preview verified all 74 preserved source pages and nine referenced assets through the immutable deployment. Preview responses are unindexed and use `no-store`. Direct terminal requests to that deployment receive Cloudflare 403/1010 responses; the actual Worker-to-Pages preview passed without bypassing protection. Re-run this fallback verification before adding a full-host route. If it fails, provision a verified retained static artifact before proceeding.

Once the native API is live, attach only these helper routes first, leaving existing documents untouched:

```text
timekeeper.edbn.me/migrate-to-deetnuts*
timekeeper.edbn.me/timekeeper-migration.js*
```

Verify old-origin storage recovery in a normal authenticated browser profile, private transfer expiry/replay behavior, JSON recovery and unchanged original storage. Then add the full-host route only after the source fallback and every rollout gate pass. Route configuration must affect only TimeKeeper. Keep the CNAME, DNS, certificates and TLS active; do not delete the old Pages project or pinned artifact used for recovery/assets.

## Canary, permanent redirects and recovery

Copy `evidence.example.json` into private recovery storage and populate reports from actual checks. The cutover guard does not modify infrastructure:

```sh
node scripts/timekeeper-cutover.mjs \
  --phase=canary --evidence=/absolute/private/path/evidence.json
```

For the canary, deploy `ROLLOUT_PHASE=canary` and an ISO `CANARY_UNTIL` exactly 30 minutes after the measured low-traffic start. Only `/category/teaching` receives a 307, with `Cache-Control: no-store, max-age=0`. Verify its direct final destination, query/fragment inheritance, assets, canonical, errors and latency throughout that window. Restore `serve` immediately on failure. The deadline expires back to serving the pinned source automatically; expiry alone is not a successful observation.

Before permanent redirects, install the root-owned `/opt/deetnuts/state/timekeeper-redirects-active` marker on Deetnuts. It makes deployment and rollback reject any release missing the new, indexable routes. Verify the pin and marker, then pass `--phase=permanent`. Deploy `ROLLOUT_PHASE=permanent` only with complete evidence. All canonical pages and aliases receive direct 301s; trailing slashes normalize in that same response, query strings are retained and browsers inherit fragments. Unknown documents return 404; `/example-usage` returns 410. Helpers, old assets and the pass-through old service worker stay available.

Run the full mapping checks against the actual old hostname after cutover. Submit `/exam-countdown/sitemap.xml` in the verified destination Search Console property and submit Change of Address from the verified old subdomain to the new destination. Google explicitly supports a domain-to-path move in its [Change of Address guidance](https://support.google.com/webmasters/answer/9370220). Both properties must belong to the same verified owner.

After a 301, cached redirects can continue bringing visitors to Deetnuts during recovery. Keep the new destination routes usable: roll back Deetnuts only to the pinned compatible release. Restoring `serve` on the old Worker does not undo already cached redirects. Do not redirect the new routes back to the old hostname during an incident; that can loop for visitors holding cached old redirects. Investigate errors and re-run destination/mapping checks before resuming rollout.

## Observe and retire

Monitor old redirects, crawler errors, chosen canonicals, indexed replacements, organic landing traffic and destination health/latency. Record evidence, not just elapsed time. After at least 30 clean stable days and no unresolved migration errors, pass `--phase=retired`. Verify the redirect/import compatibility service can operate independently of source Git integration, retain the old host/DNS/TLS/assets, disconnect all relevant source deployment integrations, add the repository migration notice and then archive Timekeeper.

Keep the old hostname, DNS, TLS, redirects and import helper indefinitely. Google's [site-move guidance](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes) recommends redirects for at least one year. Retain historical analytics and recovery records. Temporary ranking fluctuations remain possible during recrawling; route, canonical and indexing checks do not guarantee unchanged rankings.
