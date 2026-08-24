# DEETNUTS

DEETNUTS is a data-heavy Next.js application for publishing MHT-CET college and admissions data in a searchable, student-facing format. The repository contains the web application, data-access layer, upload utilities, and migration tooling used to manage MHT-CET datasets.

Live properties:

- [www.deetnuts.com](https://www.deetnuts.com)

## Repository Scope

The current codebase covers the following data domains:

| Domain                      | Coverage in Repository                         | Notes                                                       |
| --------------------------- | ---------------------------------------------- | ----------------------------------------------------------- |
| MHT-CET state cutoffs       | 2024 rounds 1-3, 2025 rounds 1-4, 2026 round 1 | Profile-aware cutoffs derived from official CAP data        |
| MHT-CET all-India cutoffs   | 2024 rounds 1-3                                | API handlers exist for all three rounds                     |
| MHT-CET seat matrix         | 2024                                           | Batch-ingested from CSV                                     |
| MHT-CET college master data | 2024                                           | Used for directory and detail pages                         |

## Architecture Summary

Runtime architecture:

- Next.js 16.2.12 with the App Router
- React 19.2.8 with React Compiler enabled
- TypeScript across application and scripts
- Self-hosted PocketBase for auth, application data, and private avatar storage
- PocketBase service access remains private to the Docker network
- Standalone Docker build for deployment

High-level flow:

```text
Browser
	-> Next.js App Router pages and route handlers
		-> lib/* data access helpers
			-> PocketBase Auth / collections

CSV / JSON source files
	-> scripts/* ingestion utilities
		-> PocketBase SDK
			-> PocketBase collections
```

For a fuller system description, see [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## Repository Layout

```text
deetnuts/
├── app/               # App Router routes, layouts, loading states, API handlers
├── components/        # Shared UI components and feature-specific presentation
├── data/              # Checked-in supporting data files used by the app and imports
├── docs/              # Maintained technical and operational documentation
├── ejam/              # Vendored eJAM predictor runtime and verified release data
├── lib/               # Data clients, auth helpers, metadata, and utilities
├── public/            # Static assets
├── scripts/           # Data ingestion, migration, and maintenance scripts
├── pocketbase/        # Pinned image, hooks, migrations, and one-time migration image
├── supabase/          # Historical source schema retained for migration provenance
└── utils/             # Supporting utility modules
```

## Local Setup

Prerequisites:

- Node.js 22 or newer is the safest match for the checked-in Docker build
- npm

Install and start the app:

```bash
git clone https://github.com/kewonit/deetnuts
cd deetnuts
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000` after the dev server starts.

## Environment Variables

The application runtime uses private PocketBase service credentials. At minimum, provide:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
POCKETBASE_INTERNAL_URL=http://127.0.0.1:8090
POCKETBASE_SERVICE_EMAIL=backend@example.com
POCKETBASE_SERVICE_PASSWORD=32-to-72-random-characters
AUTH_STATE_SECRET=at-least-32-random-characters
```

Notes:

- The browser never receives PocketBase administrator or service credentials.
- Supabase variables are accepted only by the explicit one-time source migration; they must not appear in the application runtime environment.
- Most `scripts/` entrypoints load `.env`; the web app uses the usual Next.js `.env.local` flow. If you run the CLI utilities directly, keep the required values available in your shell or a local `.env` file.

## Development Commands

Common commands:

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run test:platform
npm run format
```

Operational scripts are documented in [docs/scripts-readme.md](./docs/scripts-readme.md).

### eJAM predictor runtime

The JEE Main and JEE Advanced predictor uses the minimum vendored eJAM runtime
under `ejam/`: predictor/data source modules, verified release data, and the
upstream licence and attribution files. The standalone eJAM web app, workspace
tooling, build caches, and duplicate UI source are intentionally excluded.

The checked-in MHT-CET eligibility-map generator reads eJAM reference data from
this in-repository runtime rather than relying on a sibling checkout.

## Deployment

The repository is configured for a private, standalone Next.js container deployment on DigitalOcean.

- `next.config.mjs` enables standalone output, version-skew protection, React Compiler, scoped caching, and production security headers. On-demand prerenders use a release-scoped persistent cache inside the dedicated `.next/cache` volume while the image filesystem stays read-only.
- `Dockerfile` builds and runs the standalone server as a non-root user on a digest-pinned Node 22 Alpine image.
- `docker-compose.yml` defines blue/green web slots, private PocketBase, an unprivileged Nginx origin, and a disabled Reddit-worker profile.
- `.github/workflows/production.yaml` verifies the application, publishes private attested image digests, scans them, and invokes the restricted deployment command.
- `deploy/README.md` documents the host layout, backups, one-time source migration, and external DigitalOcean, Cloudflare, Google OAuth, and GHCR configuration.

## Migration and Compatibility

The repository contains the complete Supabase-to-PocketBase migration path:

- `lib/pocketbaseClient.ts` is the private service adapter used by runtime data access.
- Upload and maintenance scripts use the official PocketBase SDK.
- `scripts/migrate-supabase-to-pocketbase.ts` takes a read-only repeatable snapshot, imports auth/data/storage, verifies exact counts and digests, configures Google OAuth, and creates a pre-cutover backup.
- The source Supabase project is rollback-only after cutover and is not a runtime dependency.

Run the migration only through `deploy/bin/deetnuts-pocketbase-migrate`; it gates the temporary import hook and disables batch migration features when verification finishes.

## Documentation

Feature-local documentation is also available in:

- [app/mht-cet/all-india-cutoffs/README.md](./app/mht-cet/all-india-cutoffs/README.md)

## License

[MIT License](./LICENSE)
