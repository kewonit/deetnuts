# Changelog

## 2026-08-23

- Prepared the application for a secure blue/green DigitalOcean container origin behind Cloudflare, without changing any external infrastructure.
- Centralized the canonical `www.deetnuts.com` origin across auth redirects, metadata, structured data, sitemaps, bot links, tests and documentation.
- Removed Vercel-specific runtime fallbacks, packages, nested configuration and provider disclosures.
- Added private digest-only image builds, provenance, SBOM and vulnerability gates, an unprivileged Nginx origin, a shallow release health endpoint, restricted deployment helpers and a disabled Reddit-worker profile.
- Hardened production CSP, cache boundaries, container privileges, secret handling, request limits and bounded operational-log retention.

## 2026-08-03

- Updated MHT-CET metadata, structured data, sitemap freshness, and public documentation for the verified 2026 CAP Round I release.
- Added accessible names to icon-only cutoff-table and mobile navigation controls.
- Hardened the local scraper/importer so invalid runtime options, non-official source manifests, malformed download manifests, and incomplete verification runs fail closed.
- Removed mock and partial-success CSV export fallbacks. Malformed filters, unavailable rounds, authentication failures, and database failures now return explicit errors without fabricated rows.
- Replaced the undeclared, deprecated Reddit client with a typed native-fetch OAuth client so the bot build is reproducible without vulnerable legacy dependencies.
- Reconciled remote migration history and added fail-closed RLS/grant hardening for public reference data, owner-scoped records, mock attempts, the question bank, bot telemetry, and avatar storage.
- Updated the Discord slash command to show its 2026 Round I defaults and validate application/guild IDs before registration changes external command state.

## 2026-08-02

- Added the verified MHT-CET 2026 CAP Round I state-cutoff dataset and made 2026 Round 1 the default state-cutoff view.
- Kept candidate-level allotment rows and official PDFs local. The database contains only normalized, filled state and MHT-CET cutoff groups with source-PDF provenance.
- Added a reproducible, fail-closed local importer and a least-privilege Supabase table migration.
