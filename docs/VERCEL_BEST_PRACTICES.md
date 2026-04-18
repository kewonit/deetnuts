# Platform and Performance Notes

## Scope

This repository follows a set of practical platform conventions aligned with modern Next.js and React deployment guidance. This document describes what is verifiably present in the codebase today, not a generic wish list.

## Runtime Baseline

The current repository uses:

- Next.js 16.1.4
- React 19.2.3
- standalone output for deployment
- React Compiler enabled in `next.config.mjs`

## Reliability Patterns in Use

### Error Boundaries

The application includes:

- a root error boundary in `app/global-error.tsx`
- route-level error boundaries for at least the JoSAA and MHT-CET college-detail surfaces

### Loading States

Route-level loading files are present for the root app shell and key JoSAA and MHT-CET routes. Heavy client tables are also dynamically imported in several feature areas with explicit loading placeholders.

## Metadata and SEO

Current SEO-related building blocks include:

- global metadata in `app/layout.tsx`
- reusable generators in `lib/metadata.ts`
- route-level `robots.ts` and `sitemap.ts`
- JSON-LD components for site, college, and FAQ-style structured data

This is one of the stronger parts of the repository and should remain centralized rather than duplicated page by page.

## Data Fetching Conventions

The repository contains shared utilities in `lib/data-fetching.ts` for:

- retry logic
- timeouts
- deduplication
- simple cache presets
- typed error wrapping

Not every route uses every helper, but the file serves as the house style for fetch behavior and error handling.

## Performance-Oriented Decisions Already Present

- React Compiler enabled in `next.config.mjs`
- standalone build output for smaller deployment surfaces
- image output configured for AVIF and WebP
- selective dynamic imports for large client-side table views
- cache wrappers in parts of the data layer, including JoSAA and college helpers
- lightweight performance instrumentation in `lib/performance.ts`

## Security and Delivery Defaults

`next.config.mjs` currently configures:

- HSTS
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- disabled `X-Powered-By`
- compressed responses

These headers are part of the repository, independent of any edge platform defaults.

## Deployment Notes

The codebase is ready for containerized standalone deployment. The Docker configuration uses Node 22 Alpine, builds the Next.js standalone output, and runs the application as a non-root user.

## Caveats

- Some utility files are broad and reusable by design; do not assume every helper is currently exercised everywhere.
- The repository includes platform improvements that were added incrementally. When extending a feature, match the existing route's pattern rather than applying every helper indiscriminately.
