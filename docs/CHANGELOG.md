# Changelog

## 2026-08-03

- Updated MHT-CET metadata, structured data, sitemap freshness, and public documentation for the verified 2026 CAP Round I release.
- Added accessible names to icon-only cutoff-table and mobile navigation controls.
- Hardened the local scraper/importer so invalid runtime options, non-official source manifests, malformed download manifests, and incomplete verification runs fail closed.
- Removed mock and partial-success CSV export fallbacks; malformed filters, unavailable rounds, authentication failures, and database failures now return explicit errors without fabricated rows.
- Replaced the undeclared, deprecated Reddit client with a typed native-fetch OAuth client so the bot build is reproducible without vulnerable legacy dependencies.
- Reconciled remote migration history and added fail-closed RLS/grant hardening for public reference data, owner-scoped records, mock attempts, the question bank, bot telemetry, and avatar storage.
- Updated the Discord slash command to show its 2026 Round I defaults and validate application/guild IDs before registration changes external command state.

## 2026-08-02

- Added the verified MHT-CET 2026 CAP Round I state-cutoff dataset and made 2026 Round 1 the default state-cutoff view.
- Kept candidate-level allotment rows and official PDFs local; the database contains only normalized, filled state/MHT-CET cutoff groups with source-PDF provenance.
- Added a reproducible, fail-closed local importer and a least-privilege Supabase table migration.
