# Batch Upload Concurrency Note

## Background

The upload scripts in this repository still preserve a PocketBase-era mitigation for duplicate concurrent batch requests. The original issue surfaced as request auto-cancellation when multiple similar batch operations were in flight at the same time.

Even though the current repository now routes those operations through Supabase-backed compatibility wrappers, the same protective patterns were kept in place because the script interface still behaves like a batch-oriented PocketBase client.

## Current Safeguards

The active upload scripts generally apply the same three controls:

1. `autoCancellation(false)` is called on the compatibility client.
2. each batch submission gets a unique `requestKey`.
3. concurrency is capped at a conservative level, typically 500-record batches with 5 concurrent groups.

## Where This Still Matters

The pattern is still visible in scripts such as:

- `batch-upload-mht-cet-cutoffs.ts`
- `batch-upload-colleges.ts`
- `batch-upload-seat-matrix.ts`
- `batch-upload-all-india-rounds.ts`

## Why This Document Still Exists

This note is now historical and operational rather than product-facing. It explains why the scripts still include explicit anti-collision logic even though the live database backend is no longer PocketBase.

If those scripts are later rewritten to direct Supabase bulk operations with no PocketBase-shaped abstraction, this note can be retired.
