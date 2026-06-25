# DEETNUTS

DEETNUTS is a data-heavy Next.js application for publishing public college and admissions data in a searchable, student-facing format. The repository contains the web application, data-access layer, upload utilities, and migration tooling used to manage JoSAA, MHT-CET, NIRF, and related datasets.

Live properties:

- [deetnuts.com](https://deetnuts.com)

## Repository Scope

The current codebase covers the following data domains:

| Domain                      | Coverage in Repository                 | Notes                                                       |
| --------------------------- | -------------------------------------- | ----------------------------------------------------------- |
| JoSAA cutoffs               | 2018-2024                              | IIT, NIT, IIIT, and GFTI institute, branch, and cutoff data |
| MHT-CET state cutoffs       | 2024 rounds 1-3, 2025 round 1          | Round selection is year-aware in the state cutoffs module   |
| MHT-CET all-India cutoffs   | 2024 rounds 1-3                        | API handlers exist for all three rounds                     |
| MHT-CET seat matrix         | 2024                                   | Batch-ingested from CSV                                     |
| MHT-CET college master data | 2024                                   | Used for directory and detail pages                         |
| JEE Main predictions        | 2026 predictions compared against 2025 | Served from a precomputed CSV-backed dataset                |

## Architecture Summary

Runtime architecture:

- Next.js 16.2.9 with the App Router
- React 19.2.3 with React Compiler enabled
- TypeScript across application and scripts
- Supabase Auth and Supabase Postgres as the live backend
- PocketBase-compatible adapters retained for legacy helpers and ingestion workflows
- Standalone Docker build for deployment

High-level flow:

```text
Browser
	-> Next.js App Router pages and route handlers
		-> lib/* data access helpers
			-> Supabase Auth / Supabase Postgres

CSV / JSON source files
	-> scripts/* ingestion utilities
		-> PocketBase-compatible wrappers
			-> Supabase Postgres
```

For a fuller system description, see [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## Repository Layout

```text
deetnuts/
├── app/               # App Router routes, layouts, loading states, API handlers
├── components/        # Shared UI components and feature-specific presentation
├── data/              # Checked-in supporting data files used by the app and imports
├── docs/              # Maintained technical and operational documentation
├── lib/               # Data clients, auth helpers, metadata, and utilities
├── public/            # Static assets
├── scripts/           # Data ingestion, migration, and maintenance scripts
├── supabase/          # SQL migrations and Supabase-specific assets
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
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000` after the dev server starts.

## Environment Variables

The application runtime is anchored on Supabase. At minimum, provide:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgres://user:password@host:5432/dbname
```

Additional variables currently used by deployment or legacy workflows:

```env
DIRECT_URL=postgres://user:password@host:5432/dbname
NEXT_PUBLIC_POCKETBASE_URL=http://localhost:8090
POCKETBASE_URL=http://localhost:8090
POCKETBASE_ADMIN_EMAIL=admin@example.com
POCKETBASE_ADMIN_PASSWORD=your-password
POCKETBASE_AUTH_TOKEN=optional-token
```

Notes:

- The web app itself runs against Supabase.
- Several ingestion and migration scripts still use PocketBase-style variable names even when the underlying operations are routed to Supabase through compatibility wrappers.
- Most `scripts/` entrypoints load `.env`; the web app uses the usual Next.js `.env.local` flow. If you run the CLI utilities directly, keep the required values available in your shell or a local `.env` file.

## Development Commands

Common commands:

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run format
```

Operational scripts are documented in [docs/scripts-readme.md](./docs/scripts-readme.md).

## Deployment

The repository is configured for standalone Next.js output and containerized deployment.

- `next.config.mjs` enables standalone output, React Compiler, and production headers.
- `Dockerfile` builds and runs the standalone server on Node 22 Alpine.
- `docker-compose.yml` still provisions a PocketBase sidecar in addition to the frontend container. That reflects migration and compatibility history rather than the primary runtime path.

## Migration and Compatibility

The repository is in a post-migration state:

- Supabase is the live runtime backend.
- `lib/pocketbaseClient.ts` preserves a PocketBase-like interface for parts of the app that still expect that contract.
- `scripts/supabase-pocketbase-compat.ts` does the same for data-upload scripts.
- `scripts/migrate-pocketbase-to-supabase.ts` exists for one-time migration and backfill work.

If you need to replay the legacy migration flow, apply the SQL in `supabase/migrations/20260304_pocketbase_to_supabase.sql` before running the migration script.

## Documentation

Start with:

- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- [docs/JOSAA_IMPLEMENTATION.md](./docs/JOSAA_IMPLEMENTATION.md)
- [docs/ROUND_SUPPORT_IMPLEMENTATION.md](./docs/ROUND_SUPPORT_IMPLEMENTATION.md)
- [docs/scripts-readme.md](./docs/scripts-readme.md)

Feature-local documentation is also available in:

- [app/predictions/README.md](./app/predictions/README.md)
- [app/mht-cet/all-india-cutoffs/README.md](./app/mht-cet/all-india-cutoffs/README.md)

## License

[MIT License](./LICENSE)
