# College Master Data Uploader

## Purpose

`scripts/batch-upload-colleges.ts` uploads the MHT-CET college master dataset into:

```text
2024_mht_cet_colleges
```

The uploader is designed for repeatable bulk loads and supports create, upsert, clear, replace, list, and validate operations.

## Input File

The script reads the checked-in file:

```text
scripts/college_information.csv
```

Expected columns:

- `college_id`
- `college_name`
- `status`
- `home_university`

## Environment Variables

Use the same operational pattern as the other legacy-shaped upload scripts:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
POCKETBASE_ADMIN_EMAIL=admin@example.com
POCKETBASE_ADMIN_PASSWORD=your-password
```

`POCKETBASE_AUTH_TOKEN` can be used instead of the admin email and password gate.

## Commands

Preferred direct execution:

```bash
npx tsx scripts/batch-upload-colleges.ts create
npx tsx scripts/batch-upload-colleges.ts upsert
npx tsx scripts/batch-upload-colleges.ts clear
npx tsx scripts/batch-upload-colleges.ts replace
npx tsx scripts/batch-upload-colleges.ts list
npx tsx scripts/batch-upload-colleges.ts validate
```

Equivalent npm form:

```bash
npm run batch-upload-colleges -- create
```

## Runtime Characteristics

- batch size: 500
- concurrent batches: 5
- required-field validation before upload
- unique request keys to avoid duplicate batch collisions

## When to Use Create vs Upsert

- `create`: for an empty target table or when duplicate failures are desirable
- `upsert`: for idempotent reloads keyed by `college_id`
- `replace`: for a full destructive refresh of the target table

## Verification

Use `list` after a load to inspect the first few records and confirm that the current environment points at the intended database.
