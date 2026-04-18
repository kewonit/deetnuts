# Scripts Reference

## How to Read This Directory

The `scripts/` directory mixes three types of utilities:

- ingestion scripts that create or update dataset tables
- maintenance scripts used during schema and mapping work
- one-time migration helpers retained for historical portability

## Recommended Invocation Pattern

Prefer direct execution:

```bash
npx tsx scripts/<script-name>.ts <args>
```

If you use `npm run`, remember that npm passes subcommands only after `--`:

```bash
npm run batch-upload-colleges -- create
```

Many script entrypoints call `dotenv.config()` and therefore expect values in `.env` or the current shell environment. The web app itself continues to use the normal Next.js `.env.local` flow.

## Ingestion Scripts

| Script                              | Purpose                                                      | Expected Input                             | Primary Target                                            |
| ----------------------------------- | ------------------------------------------------------------ | ------------------------------------------ | --------------------------------------------------------- |
| `import-josaa-data.ts`              | Imports JoSAA institutes, branches, aliases, and cutoff data | `data/josaa/*` JSON payloads               | `josaa_*` tables                                          |
| `batch-upload-colleges.ts`          | Uploads MHT-CET college master data                          | `scripts/college_information.csv`          | `2024_mht_cet_colleges`                                   |
| `batch-upload-seat-matrix.ts`       | Uploads seat matrix data                                     | `scripts/2024_seat_matrix_complete.csv`    | `2024_mht_cet_colleges_seat_matrix`                       |
| `batch-upload-mht-cet-cutoffs.ts`   | Uploads MHT-CET state cutoff data                            | `scripts/combined_cutoffs.csv`             | `2024_mht_cet_round_three_cutoffs` as currently committed |
| `upload-mht-cet-cutoffs-v2.ts`      | Uploads the newer 2025 state cutoff dataset                  | `scripts/combined_cutoffs_with_status.csv` | `2025_mht_cet_round_one_cutoffs`                          |
| `batch-upload-all-india-rounds.ts`  | Uploads 2024 all-India cutoff files                          | round-specific CSV                         | `2024_all_india_rounds_one/two/three`                     |
| `import-bits-cutoffs.ts`            | Imports BITS engineering cutoff data                         | script-specific source file                | `engineering_bits_cutoffs`                                |
| `migrate-pocketbase-to-supabase.ts` | One-time migration and backfill utility                      | legacy PocketBase instance                 | Supabase tables matching runtime names                    |

## Maintenance and Diagnostics

| Script                     | Purpose                                           |
| -------------------------- | ------------------------------------------------- |
| `check-schemas.ts`         | Inspect table and field expectations              |
| `check-institutes.ts`      | Sanity-check institute data                       |
| `verify-mapping.ts`        | Validate JoSAA branch and institute relationships |
| `cleanup.ts`               | Clean or reconcile imported data                  |
| `update-josaa-schema.ts`   | Update JoSAA schema expectations                  |
| `add-original-id-field.ts` | Schema/data migration helper                      |
| `add-original-ids.ts`      | Populate or backfill original IDs                 |

## Environment Expectations

Current reality is slightly hybrid:

- the data operations are Supabase-backed
- several scripts still validate PocketBase-style auth variable names before they proceed

In practice, keep the following available for ingestion work:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
POCKETBASE_ADMIN_EMAIL=admin@example.com
POCKETBASE_ADMIN_PASSWORD=your-password
```

If a script accepts `POCKETBASE_AUTH_TOKEN`, that also satisfies its legacy auth gate.

## Checked-In Source Files

Present in the repository snapshot:

- `scripts/college_information.csv`
- `scripts/2024_seat_matrix_complete.csv`
- `scripts/predictions_2026_complete.csv`

Referenced by scripts but not checked in here:

- `scripts/combined_cutoffs.csv`
- `scripts/combined_cutoffs_with_status.csv`
- `scripts/all-india-2024-round-one.csv` and related round files

## Known Maintenance Drift

Several `package.json` aliases currently reference script files that are not present in `scripts/`.

Examples include references to:

- `batch-import-josaa.ts`
- `test-batch-api.ts`
- `test-seat-matrix-upload.ts`
- `test-setup.ts`
- `test-pocketbase.ts`
- `diagnostic-pocketbase.ts`

Until those aliases are cleaned up, direct `npx tsx` execution is the safer operational path.
