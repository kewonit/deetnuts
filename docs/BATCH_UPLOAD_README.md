# MHT-CET State Cutoff Batch Uploader

## Purpose

`scripts/batch-upload-mht-cet-cutoffs.ts` uploads state-cutoff CSV data through the repository's PocketBase-compatible batch wrapper.

As committed today, the script writes to:

```text
2024_mht_cet_round_three_cutoffs
```

That target is hardcoded in the file. If you need round-one or round-two ingestion, adjust the collection name before running the upload or use a round-specific script path that matches your dataset.

## Input File

The script expects this file in `scripts/`:

```text
combined_cutoffs.csv
```

That CSV is referenced by code but is not checked into the repository snapshot shown here.

Expected columns:

```csv
college_code,college_name,course_code,course_name,category,seat_allocation_section,cutoff_score,last_rank,total_admitted,status,home_university
```

## Environment Variables

Required in practice:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
POCKETBASE_ADMIN_EMAIL=admin@example.com
POCKETBASE_ADMIN_PASSWORD=your-password
```

Alternative legacy auth path:

```env
POCKETBASE_AUTH_TOKEN=any-non-empty-token
```

Notes:

- database operations are executed against Supabase
- the script still checks legacy PocketBase-style auth variable names before continuing

## Commands

Preferred invocation:

```bash
npx tsx scripts/batch-upload-mht-cet-cutoffs.ts create
npx tsx scripts/batch-upload-mht-cet-cutoffs.ts upsert
npx tsx scripts/batch-upload-mht-cet-cutoffs.ts clear
npx tsx scripts/batch-upload-mht-cet-cutoffs.ts replace
```

If you use the npm alias, pass the subcommand after `--`:

```bash
npm run batch-upload -- create
```

## Current Operational Characteristics

- batch size: 500 records
- concurrent batches: 5
- request de-duplication protection via unique request keys
- CSV streaming for lower memory pressure

## Troubleshooting

### Authentication fails immediately

The current script wrapper exits before it reaches the compatibility layer if neither `POCKETBASE_AUTH_TOKEN` nor `POCKETBASE_ADMIN_EMAIL` and `POCKETBASE_ADMIN_PASSWORD` are present.

### The script uploads to the wrong table

The target collection is not inferred from the file name. Confirm the `collectionName` constant in the script before you run it.

### The input CSV is missing

`combined_cutoffs.csv` is not part of this repository snapshot. Place it in `scripts/` before running the uploader.
