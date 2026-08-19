# JEE cutoff pages: phased implementation plan

Status: implementation plan only. Nothing in this folder is evidence that a phase has shipped or that a legal permission has been obtained.

This folder turns the corrected JEE Main and JEE Advanced cutoff plan into independently verifiable phases. The order is intentional: fix the public shell first, establish trustworthy source and route records before multiplying pages, then add crawl surfaces, policy controls, and release gates.

## Objective

Publish accurate, minimal, server-rendered college cutoff pages that:

- preserve the exact counselling dimensions and published rank values;
- remain useful without JavaScript;
- expose stable, crawlable paths without creating query-parameter or thin-page spam;
- match the eJAM visual language without leaking eJAM resets into the rest of DEETNUTS;
- provide transparent provenance, privacy controls, and open-source notices; and
- are fast enough to serve statically or from a CDN without an auth request on the public render path.

Indexing and ranking are outcomes controlled by search engines. The implementation may make pages eligible and easy to crawl; it must never promise a page count, a number-one ranking, or guaranteed indexing.

## Measured release baseline

These counts are release acceptance fixtures, not estimates:

| Surface | Count | Indexing policy |
| --- | ---: | --- |
| Entry page | 1 | Index |
| Exam directories | 2 | Index |
| College hubs | 131 | Index |
| College-year pages | 1,096 | Index |
| Exact program pages | 7,476 | Index |
| Multi-round exact profiles | 88,147 | Index |
| One-round exact profiles | 16,968 | `noindex,follow` |
| All canonical HTML routes | 113,821 | Mixed |
| Quality-gated sitemap inventory | 96,853 | Index |

The data release contains 463,050 cutoff rows. The 1,096 college-year pages split into 866 JEE Main and 230 JEE Advanced pages. Recompute and reconcile all counts during the data phase; fail rather than silently accepting drift.

## Non-negotiable invariants

- A cutoff row is identified by counselling body, year, round, institute, source offering, degree, duration, quota, seat type, and gender.
- Opening and closing ranks, missing rounds, degree-duration variants, and source taxonomy are never inferred or smoothed.
- Round is content on an exact profile page, not another route dimension.
- Query strings and fragments are interaction state only and never become sitemap URLs.
- A one-round profile remains a real `200` page with a self-canonical and `noindex,follow`; its facts also appear on the parent program page.
- Unknown, empty, path-traversal, and unresolved wrong-exam paths return a genuine `404`.
- The public JEE render path performs no Supabase session lookup, GitHub request, or other external request.
- The page-specific provenance remains visible and crawlable. Only repeated boilerplate may use `data-nosnippet`.
- No `Dataset`, FAQ, Course, Review, Rating, or unearned organization markup is emitted.
- No footer, disclaimer, or terms page is described as a substitute for permission or a data license.
- No bulk data feed is introduced. Respectful HTML fetching remains possible without JavaScript, authentication, CAPTCHA, or a cookie wall.

## Phase order

| Phase | Deliverable | Depends on | Exit gate |
| --- | --- | --- | --- |
| [01](./phase-01-rendering-shell-and-ui.md) | Stable header, scoped eJAM shell, compact footer, single accessible result surface | Current routes | Visual and layout matrix passes |
| [02](./phase-02-data-provenance-and-rights.md) | Validated serving data, exact offering identity, complete source registry, explicit rights state | Phase 01 may run in parallel, but Phase 03 depends on this | Row, source, checksum, and lineage gates pass |
| [03](./phase-03-seo-catalog-and-routing.md) | SEO route artifact, deterministic slugs, route semantics, static public path | Phase 02 | Route inventory and HTTP behavior pass |
| [04](./phase-04-page-templates-and-interaction.md) | Hub, year, program, and profile templates with progressive enhancement | Phases 01-03 | No-JS content and interaction parity pass |
| [05](./phase-05-crawling-sitemaps-and-html-access.md) | Sitemap index and shards, robots rules, semantic scraper-friendly HTML | Phases 03-04 | Exact sitemap and crawl audit passes |
| [06](./phase-06-policy-privacy-and-open-source.md) | Consent controls, source methodology, terms/privacy/cookie/automated-access/open-source notices | Can start after Phase 02; must finish before release | Consent and disclosure audit passes |
| [07](./phase-07-verification-and-release.md) | Full regression, performance, visual, SEO, and deployment gates | Phases 01-06 | All required checks pass and exceptions are documented |

## Working protocol

1. Start each phase from the current working tree and record the relevant baseline; do not overwrite unrelated local changes.
2. Keep each implementation diff limited to that phase. Do not stage or commit unless the operator later asks explicitly.
3. Do not advance past an exit gate by weakening the check. Record a real exception with owner and reason if an external prerequisite cannot be completed.
4. Run the narrow checks while iterating, then the full gate in Phase 07.
5. Update the release fixtures only when a newly validated source release intentionally changes them.

## Repository checks already available

```bash
npm run verify:jee-cutoff-data
npm run test:jee-cutoffs
npm run test:e2e:jee-cutoffs
npm run lint
npx tsc --noEmit
npm run build
```

Phase-specific tests should be added to these existing commands rather than creating overlapping test entry points.

