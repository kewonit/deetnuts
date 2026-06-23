# DEETNUTS Query Analytics & Logging Plan

> **Status:** Draft
> **Owner:** Engineering
> **Goal:** Log every cutoff query across all tools (MHT-CET State/All-India, JoSAA, BITS, Predictions) so we can track usage patterns, popular filters, zero-result searches, and tool adoption. All data stays in Supabase. No external analytics dependencies except existing GA.

---

## 1. Executive Summary

We will introduce a lightweight, fire-and-forget query logging layer that intercepts API requests **after** the response is sent, writes structured rows to a new `query_logs` table in Supabase, and exposes a minimal internal dashboard at `/admin/analytics` (or similar) for consumption.

**Why this approach?**

- **Zero latency impact:** Logging is asynchronous and non-blocking.
- **Full data ownership:** No third-party product analytics required.
- **Reuses existing stack:** Supabase PostgreSQL + service-role client.
- **User-aware:** Can correlate queries with authenticated users or stable anonymous sessions.

**Important codebase constraints discovered:**

- There is **no root `middleware.ts`** in the project; the `utils/supabase/middleware.ts` exists but is not currently hooked up globally. Admin route protection must happen inside server components.
- The MHT-CET State Cutoffs API already calls `supabase.auth.getUser()` for rate-limiting. Our logger must **reuse that user object** to avoid double auth lookups per request.
- Next.js App Router request bodies **cannot be safely cloned** in all runtimes. We must use inline logging (parse body once) rather than a HOF wrapper.

---

## 2. Goals & Non-Goals

### Goals

- Log every search/query across all major API routes with full filter context.
- Distinguish authenticated vs anonymous users.
- Capture result counts, execution timing, and zero-result flags.
- Track aggregate trends: popular categories, courses, percentile ranges, colleges.
- Provide a lightweight internal dashboard for product decisions.

### Non-Goals

- **Not a real-time monitoring system** (no alerting, no P95 latency SLOs — use Vercel Analytics for that).
- **Not user-facing history** (we are not building a "your recent searches" feature yet, though the schema should allow it).
- **Not a replacement for Google Analytics** (GA stays for traffic/marketing; this is for product analytics).
- **Not logging raw IP addresses** (privacy-conscious; we log a hashed session identifier instead).

---

## 3. Data Model

### 3.1 Primary Table: `query_logs`

```sql
CREATE TABLE query_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Temporal
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- User Identity (one of these will be set)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  anonymous_session_id TEXT, -- stable hash/cookie for anonymous users

  -- Tool Context
  tool TEXT NOT NULL, -- e.g. 'mht-cet-state', 'mht-cet-all-india', 'josaa', 'bits', 'predictions'
  tool_version INT NOT NULL DEFAULT 1, -- schema version for future migrations

  -- Request Context
  http_method TEXT NOT NULL,
  path TEXT NOT NULL,

  -- Query Payload (normalized JSON)
  filters JSONB NOT NULL DEFAULT '{}',
  /* Examples:
     mht-cet-state: { percentile: 85.5, categories: ["GOPENS"], courses: [...], year: 2025, round: 1, search: "coep" }
     josaa: { instituteType: "IIT", category: "OPEN", minRank: 1000 }
     predictions: { institute: "IIT Bombay", branch: "CSE", minCutoff: 250 }
  */

  -- Result Metadata
  result_count INT,
  page INT DEFAULT 1,
  per_page INT DEFAULT 25,
  has_zero_results BOOLEAN GENERATED ALWAYS AS (COALESCE(result_count, -1) = 0) STORED,

  -- Performance
  duration_ms INT, -- total API handler duration
  db_duration_ms INT, -- optional: server action query time

  -- Client Context
  user_agent TEXT,
  referrer TEXT,

  -- Derived / Enrichment (can be backfilled)
  country TEXT,
  device_type TEXT -- 'mobile' | 'tablet' | 'desktop'
);

-- Indexes for fast dashboard queries
CREATE INDEX idx_query_logs_created_at ON query_logs(created_at DESC);
CREATE INDEX idx_query_logs_tool_created_at ON query_logs(tool, created_at DESC);
CREATE INDEX idx_query_logs_user_id ON query_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_query_logs_anonymous_session ON query_logs(anonymous_session_id) WHERE anonymous_session_id IS NOT NULL;
CREATE INDEX idx_query_logs_filters_gin ON query_logs USING GIN (filters);

-- Security: enable RLS but do NOT create any public policies.
-- Only the service-role client (admin) can insert/select.
ALTER TABLE query_logs ENABLE ROW LEVEL SECURITY;
```

### 3.2 Aggregation Table: `query_daily_aggregates` (Optional Phase 2)

For fast dashboard loads, pre-aggregate daily stats rather than scanning millions of rows.

```sql
CREATE TABLE query_daily_aggregates (
  date DATE NOT NULL,
  tool TEXT NOT NULL,
  metric TEXT NOT NULL, -- 'total_queries', 'unique_users', 'zero_result_rate', 'avg_percentile'
  dimension TEXT, -- e.g. 'category:GOPENS', 'course:Computer Engineering', or NULL for totals
  value NUMERIC NOT NULL,
  PRIMARY KEY (date, tool, metric, dimension)
);
```

---

## 4. Architecture

### 4.1 Interception Strategy

We intercept at the **API Route layer** because it is the single chokepoint for all client requests. We do **not** instrument every PocketBase adapter call or Server Action directly; instead, we wrap the API route handler.

```
Client (React) -> API Route (Next.js) -> [LOGGING WRAPPER] -> Server Action / DB -> Response
                                                     |
                                                     v
                                              Supabase query_logs
```

### 4.2 Logger Utility: `lib/analytics/query-logger.ts`

A small, reusable module that:

1. Accepts a `QueryLogPayload` object.
2. Writes to Supabase via the **service-role** client (bypasses RLS, no auth needed).
3. Returns immediately (fire-and-forget); errors are caught and silently logged to console.

```typescript
// lib/analytics/query-logger.ts
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export interface QueryLogPayload {
  userId?: string;
  anonymousSessionId?: string;
  tool: string;
  httpMethod: string;
  path: string;
  filters: Record<string, unknown>;
  resultCount?: number;
  page?: number;
  perPage?: number;
  durationMs?: number;
  dbDurationMs?: number;
  userAgent?: string;
  referrer?: string;
}

export function logQuery(payload: QueryLogPayload): void {
  // Fire-and-forget; do not await in hot path
  supabaseAdmin
    .from("query_logs")
    .insert({
      user_id: payload.userId || null,
      anonymous_session_id: payload.anonymousSessionId || null,
      tool: payload.tool,
      http_method: payload.httpMethod,
      path: payload.path,
      filters: payload.filters,
      result_count: payload.resultCount ?? null,
      page: payload.page ?? 1,
      per_page: payload.perPage ?? 25,
      duration_ms: payload.durationMs ?? null,
      db_duration_ms: payload.dbDurationMs ?? null,
      user_agent: payload.userAgent?.slice(0, 512) || null,
      referrer: payload.referrer?.slice(0, 512) || null,
    })
    .then(({ error }) => {
      if (error) console.error("[Analytics] Failed to log query:", error);
    });
}
```

### 4.3 Anonymous Session ID

We need a stable identifier for anonymous users that survives page reloads but is not a raw IP.

**Approach:**

- If authenticated: use `user.id` from Supabase.
- If anonymous: read a cookie named `dn_session_id`. If absent, generate a UUIDv4 and set it with:
  - `httpOnly: false` (so client can also read it if needed later)
  - `sameSite: 'lax'`
  - `maxAge: 60 * 60 * 24 * 30` (30 days)
  - `secure: process.env.NODE_ENV === 'production'`

This cookie is separate from the existing anonymous usage cookie so it doesn't interfere with rate-limiting logic.

**Helper:** `lib/analytics/session.ts`

```typescript
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { createClient } from "@/app/lib/supabase/server";

const SESSION_COOKIE = "dn_session_id";
const COOKIE_OPTS = {
  httpOnly: false,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

/**
 * Get user ID or anonymous session ID.
 * NOTE: In API routes that already check auth (e.g. MHT-CET state cutoffs),
 * pass the already-resolved `user` object to avoid double auth lookups.
 */
export async function getOrCreateSessionId(
  existingUser?: { id: string } | null,
): Promise<{ userId?: string; anonymousSessionId?: string }> {
  const cookieStore = await cookies();

  // Reuse existing auth check if provided
  if (existingUser) return { userId: existingUser.id };

  // Try auth
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) return { userId: user.id };

  // Anonymous
  let sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) {
    sessionId = randomUUID();
    cookieStore.set(SESSION_COOKIE, sessionId, COOKIE_OPTS);
  }
  return { anonymousSessionId: sessionId };
}
```

### 4.4 Integration Pattern: Inline Logging (Recommended)

Because Next.js App Router request bodies cannot be safely consumed twice in all runtimes, **do not use a wrapper/HOF**. Instead, add explicit logging at the end of each handler after the response is built.

Example for MHT-CET State Cutoffs (`/api/mht-cet/state-cutoffs/route.ts`):

```typescript
export async function POST(request: NextRequest) {
  const start = performance.now();
  let user: User | null = null;

  // ... existing auth check ...
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user: authUser } } = await supabase.auth.getUser();
  user = authUser;
  const isAuthenticated = !error && Boolean(user);

  // ... existing body parsing & handler logic ...
  const body = await request.json();
  // ... sanitization, getCutoffRecords call ...
  const result = await getCutoffRecords(...);

  // Fire-and-forget log (non-blocking)
  logQuery({
    ...(await getOrCreateSessionId(user)),
    tool: 'mht-cet-state',
    httpMethod: 'POST',
    path: '/api/mht-cet/state-cutoffs',
    filters: {
      search, categories, courses, statuses, homeUniversities,
      percentileInput, year, round, sortBy, sortOrder, page, perPage
    },
    resultCount: result.totalItems,
    page: result.page,
    perPage: result.perPage,
    durationMs: Math.round(performance.now() - start),
    userAgent: request.headers.get('user-agent') || undefined,
    referrer: request.headers.get('referer') || undefined,
  });

  return NextResponse.json(result);
}
```

**Key rules:**

1. Parse the request body **once** (e.g. `const body = await request.json()`).
2. Reuse the already-resolved `user` object for the logger.
3. Never `await` `logQuery`; let it fire-and-forget.
4. Log after the result is ready so `resultCount` is accurate.

### 4.5 Integration Per Tool

Apply the inline logging pattern from §4.4 to each route below. Remember to reuse the already-resolved `user` object where auth is already checked.

#### Instrumentation Targets

| Route                                | Tool Key                  | Filters to Log                                                                                  | Notes                                    |
| ------------------------------------ | ------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `/api/mht-cet/state-cutoffs`         | `mht-cet-state`           | percentile, categories, courses, statuses, homeUniversities, search, year, round                | Reuse existing `user` from auth check    |
| `/api/mht-cet/state-cutoffs/export`  | `mht-cet-state-export`    | same as state cutoffs                                                                           | Logged separately to track export demand |
| `/api/mht-cet/all-india-cutoffs/*`   | `mht-cet-all-india`       | search, branch, branches, collegeName, min/maxPercentile, min/maxRank, sort                     | Instrument `_shared.ts` once             |
| `/api/josaa/cutoffs`                 | `josaa`                   | instituteType, instituteId, branchId, year, round, category, gender, seatType, minRank, maxRank |                                          |
| `/api/josaa/institutes`              | `josaa-institutes`        | query (search), type, state, grouped                                                            | Has 3 branches; log whichever was used   |
| `/api/josaa/trends`                  | `josaa-trends`            | instituteId, branchId, category, gender                                                         |                                          |
| `/api/predictions`                   | `predictions`             | institute, branch, seatType, quota, search, min/maxCutoff, min/maxChange                        |                                          |
| `/api/mht-cet/colleges/[id]/cutoffs` | `mht-cet-college-cutoffs` | collegeId (from slug)                                                                           | Hardcoded to 2024 round one currently    |

---

## 5. What Exactly Gets Logged

### 5.1 MHT-CET State Cutoffs (Deep Dive)

For every POST to `/api/mht-cet/state-cutoffs`:

```json
{
  "tool": "mht-cet-state",
  "filters": {
    "percentileInput": "87.5",
    "search": "coep",
    "categories": ["GOPENS", "GOBCS"],
    "courses": ["Computer Engineering", "Electronics"],
    "statuses": ["Home University"],
    "homeUniversities": ["Savitribai Phule Pune University"],
    "year": 2025,
    "round": 1,
    "sortBy": "cutoff_score",
    "sortOrder": "desc",
    "page": 1,
    "perPage": 25
  },
  "result_count": 142,
  "duration_ms": 340,
  "user_id": "a1b2c3d4..."
}
```

This gives us the ability to answer:

- What is the most common percentile searched? (histogram on `filters->percentileInput`)
- Which categories are most filtered? (unnest `filters->categories`)
- What % of searches return zero results? (`has_zero_results`)
- What are the most popular course + category combos?
- How does query volume change before/after counseling rounds?

### 5.2 Zero-Result Searches

When `result_count === 0`, we should consider logging an **expanded context** (Phase 2):

- Which filters were so restrictive that nothing matched?
- Was it a specific college search that failed? (helps identify data gaps or typos)

This can be a simple flag in `query_logs` plus a nightly job that surfaces the top 50 zero-result filter combinations.

---

## 6. Dashboard & Consumption

### 6.1 Internal Dashboard Route: `/admin/analytics`

A simple server-component protected page. **Important:** There is currently no root `middleware.ts` in this project, so admin protection must be handled inside the page itself.

```tsx
// app/admin/analytics/page.tsx
import { ensureUserAuthenticated } from "@/lib/supabaseAuth";
import { redirect } from "next/navigation";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

export default async function AnalyticsPage() {
  const user = await ensureUserAuthenticated();
  if (!ADMIN_EMAILS.includes(user.email!)) {
    redirect("/");
  }
  // ... dashboard components ...
}
```

**Widgets:**

1. **KPI Cards:** Total queries (7d, 30d), unique users, zero-result rate, avg query duration.
2. **Volume Chart:** Queries per day, split by tool (Recharts area chart).
3. **Popular Filters:**
   - Top 10 percentile ranges (buckets: 0-50, 50-60, 60-70, 70-80, 80-90, 90-95, 95-100)
   - Top 10 categories searched
   - Top 10 courses searched
4. **Tool Breakdown:** Pie/donut chart of queries by tool.
5. **Recent Zero-Result Searches:** Table showing filters that returned 0 results in the last 24h.
6. **User Retention:** % of anonymous sessions that return within 7 days (Phase 2).

### 6.2 SQL Views for Convenience

```sql
-- Daily query volume by tool
CREATE VIEW v_query_volume_daily AS
SELECT date_trunc('day', created_at)::date as date, tool, count(*) as queries
FROM query_logs
GROUP BY 1, 2;

-- Top filters for mht-cet-state
CREATE VIEW v_mht_cet_top_categories AS
SELECT jsonb_array_elements_text(filters->'categories') as category, count(*) as count
FROM query_logs
WHERE tool = 'mht-cet-state'
  AND created_at > now() - interval '30 days'
GROUP BY 1
ORDER BY 2 DESC;
```

### 6.3 Raw SQL Access

For ad-hoc analysis, connect directly to Supabase SQL Editor or use `psql`.

Example queries:

```sql
-- Most searched colleges in the last week
SELECT filters->>'search' as search_term, count(*)
FROM query_logs
WHERE tool = 'mht-cet-state'
  AND created_at > now() - interval '7 days'
  AND filters->>'search' IS NOT NULL
GROUP BY 1 ORDER BY 2 DESC LIMIT 20;

-- Zero result rate by tool
SELECT tool,
       count(*) as total,
       sum(case when result_count = 0 then 1 else 0 end) as zero_count,
       round(100.0 * sum(case when result_count = 0 then 1 else 0 end) / count(*), 2) as zero_pct
FROM query_logs
WHERE created_at > now() - interval '30 days'
GROUP BY 1;
```

---

## 7. Privacy & Compliance

- **No PII in logs:** Do not log email, name, or raw IP. `user_id` is acceptable because it is an opaque UUID.
- **No precise geolocation:** Country-level is fine if derived from Vercel headers (`x-vercel-ip-country`), but do not store city/postal.
- **Retention policy:** Auto-delete rows older than 12 months using a Supabase cron job or pg_cron (Phase 2).
  ```sql
  -- Example retention
  DELETE FROM query_logs WHERE created_at < now() - interval '12 months';
  ```
- **Cookie consent:** The `dn_session_id` cookie is strictly necessary for analytics; it does not track across sites. If we expand to marketing pixels, revisit consent banner.
- **RLS:** `query_logs` should have **no RLS SELECT policy for public** and **only service-role inserts** to prevent users from reading each other's queries.

---

## 8. Implementation Phases

### Phase 1: Foundation (Week 1)

1. **Migration:** Create `query_logs` table + indexes in Supabase.
2. **Logger Module:** Create `lib/analytics/query-logger.ts` and `lib/analytics/session.ts`.
3. **Instrument MHT-CET State Cutoffs:** Add inline logging to `/api/mht-cet/state-cutoffs/route.ts`.
4. **Smoke Test:** Run queries locally, verify rows appear in Supabase.

### Phase 2: Full Coverage (Week 2)

1. **Instrument remaining API routes:**
   - MHT-CET All-India routes
   - JoSAA routes
   - Predictions route
   - BITS cutoffs (if applicable)
2. **Dashboard skeleton:** Create `/admin/analytics` page with basic KPI cards and a daily volume chart.
3. **Admin protection:** Gate `/admin/*` behind `ensureUserAuthenticated()` + admin email allow-list.

### Phase 3: Insights (Week 3)

1. **Zero-result report:** Dashboard widget showing top zero-result filter combinations.
2. **Popular filters widgets:** Top categories, courses, percentile buckets.
3. **Performance tracking:** Add `db_duration_ms` by threading a timer through `getCutoffRecords`.
4. **Anonymous retention:** Simple cohort chart (Phase 2 stretch goal).

### Phase 4: Optimization (Week 4+)

1. **Aggregation table:** `query_daily_aggregates` with a nightly cron job.
2. **Retention job:** Auto-delete >12 month rows.
3. **Export:** CSV export from dashboard for external analysis.
4. **Alerting:** Optional Slack/Discord webhook when zero-result rate spikes >20% for a tool.

---

## 9. File Additions & Modifications

### New Files

```
lib/analytics/
  query-logger.ts       -- Core fire-and-forget logger
  session.ts            -- getOrCreateSessionId helper
  types.ts              -- Shared TypeScript interfaces

app/admin/analytics/
  page.tsx              -- Dashboard page
  components/
    KpiCards.tsx
    VolumeChart.tsx
    TopFilters.tsx
    ZeroResultsTable.tsx
    ToolBreakdown.tsx

supabase/migrations/
  20250620_query_logs.sql   -- Table + indexes
```

### Modified Files

```
app/api/mht-cet/state-cutoffs/route.ts           -- Add logQuery call
app/api/mht-cet/state-cutoffs/export/route.ts    -- Add logQuery call (tool: mht-cet-state-export)
app/api/mht-cet/all-india-cutoffs/_shared.ts     -- Add logQuery call inside handleAllIndiaCutoffsRequest
app/api/josaa/cutoffs/route.ts                   -- Add logQuery call
app/api/josaa/institutes/route.ts                -- Add logQuery call (3 branches: search/grouped/list)
app/api/josaa/trends/route.ts                    -- Add logQuery call
app/api/predictions/route.ts                     -- Add logQuery call
app/api/mht-cet/colleges/[id]/cutoffs/route.ts   -- Add logQuery call
```

---

## 10. Risks & Mitigations

| Risk                       | Impact | Mitigation                                                                                                                                       |
| -------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Logging adds latency       | Low    | Fire-and-forget `logQuery`; never `await` it in the hot path.                                                                                    |
| Supabase write rate limits | Low    | Single-row inserts are fast; if volume explodes, switch to batching or aggregation.                                                              |
| Request body double-read   | Medium | Use inline logging (parse body once, pass to both handler and logger). Do not use a wrapper that clones `request`.                               |
| DB size bloat              | Medium | 12-month retention policy + aggregation table in Phase 4.                                                                                        |
| Accidental PII logging     | High   | Code review checklist: never log `email`, `name`, `ip`. Only log `user_id`.                                                                      |
| Admin route exposure       | Medium | Gate `/admin/*` behind `ensureUserAuthenticated()` + hardcoded `ADMIN_EMAILS` env var inside the page component. No middleware currently exists. |
| Double auth lookup         | Low    | Reuse the `user` object from existing auth checks in API routes; do not call `supabase.auth.getUser()` twice.                                    |

---

## 11. Open Questions

1. **Admin access:** Who gets access to `/admin/analytics`? Maintain a hardcoded env var `ADMIN_EMAILS=kew@example.com` (simplest), or add an `is_admin` column to `public.profiles`?
2. **Missing middleware:** There is no root `middleware.ts` currently. Should we create one to refresh Supabase sessions globally and protect `/admin/*`, or keep auth checks page-by-page?
3. **Real-time needs:** Do we need a live-updating dashboard (WebSocket/polling) or is a daily snapshot sufficient?
4. **Client-side events:** Should we also log frontend interactions (e.g., "user opened filter sidebar", "user clicked export CSV") or stick to API queries only?
5. **BITS cutoffs:** BITS data is fetched via `getBitsCutoffsData` in `lib/pocketbaseClient.ts`, but there may not be a dedicated client-facing API route. If BITS is server-component only, we can log via a server-side helper instead of an API route wrapper.
6. **Prefetch noise:** The `useCutoffData` hook prefetches the next page in the background. This will double log counts (actual + prefetch). Is this desired, or should we add a `is_prefetch` flag to distinguish them?
7. **Budget:** Supabase free tier has a 500MB DB limit. At high volume, `query_logs` could grow quickly. Should we archive old data to S3/R2 or enable compression?
8. **Retention automation:** Should we use Supabase `pg_cron` (if available on the tier) or a Vercel cron job to call a cleanup API route?

---

## 12. Success Metrics

- **Coverage:** 100% of major API routes instrumented within 2 weeks.
- **Data Quality:** <1% of logged rows missing `result_count` or `filters`.
- **Performance:** No measurable P99 latency increase on API routes.
- **Usage:** Dashboard accessed at least weekly by the product team for decision-making.

---

_End of Plan_
