# Seat Matrix Uploader

## Purpose

`scripts/batch-upload-seat-matrix.ts` uploads the 2024 MHT-CET seat matrix dataset into:

```text
2024_mht_cet_colleges_seat_matrix
```

## Input File

The script expects the checked-in file:

```text
scripts/2024_seat_matrix_complete.csv
```

The CSV contains the college, course, and category-wise seat distribution fields used by the public seat-matrix views and APIs.

## Environment Variables

Use the same hybrid operational set required by the other uploaders:

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
npx tsx scripts/batch-upload-seat-matrix.ts validate
npx tsx scripts/batch-upload-seat-matrix.ts create
npx tsx scripts/batch-upload-seat-matrix.ts upsert
npx tsx scripts/batch-upload-seat-matrix.ts clear
npx tsx scripts/batch-upload-seat-matrix.ts replace
npx tsx scripts/batch-upload-seat-matrix.ts list 20
npx tsx scripts/batch-upload-seat-matrix.ts stats
```

Equivalent npm form:

```bash
npm run batch-upload-seat-matrix -- validate
```

## Data Handling Rules

- required fields: `college_code`, `college_name`, `choice_code`, `course_name`
- numeric fields are parsed defensively and default to `0`
- string fields are trimmed
- `choice_code` is used as the upsert identity key

## Runtime Characteristics

- batch size: 500
- concurrent batches: 5
- invalid rows are skipped with warnings
- request keys are generated per batch to avoid collisions

## Operational Note

The current API routes use the full table name `2024_mht_cet_colleges_seat_matrix`. If you add views or helper functions around seat-matrix data, keep that naming consistent unless you intentionally create a compatibility alias.
