# MHT-CET 2026 CAP Round I data

The 2026 state-cutoff table is derived from the official institute-wise CAP
Round I allotment PDFs listed at:

<https://fe2026.mahacet.org/StaticPages/frmInstituteWiseAllotmentList?did=2021>

## Local source archive

Install the isolated scraper dependencies, then run the scraper from the
repository root:

```sh
python3 -m venv .venv-mahacet
. .venv-mahacet/bin/activate
python3 -m pip install -r scripts/requirements-mahacet-scraper.txt
python3 scripts/scrape_mahacet_allotments.py
```

The ignored `data/output/mahacet_2026_cap_round_1/` directory contains all 380
PDFs, SHA-256 hashes, extraction manifests, candidate-level allotment rows, and
derived source-level cutoffs. Candidate names and application IDs remain local
and are never included in the database import. Treat this directory as private
working data and never stage or publish it.

The scraper fails strict verification unless every institute link and PDF is
valid, every course seat count matches its extracted rows, serials are
contiguous, scores and ranks are valid, and there are no quarantined extraction
issues. Minority rows retain the preceding official base-allocation section so
their home/other/state context is not inferred from seat codes.

## Database normalization

Run the importer without flags for a read-only dry run:

```sh
npx tsx scripts/import-mahacet-2026-round-one.ts
```

Pass `--write-sql` only after the dry run succeeds. This writes ignored audit
JSON and transactional import SQL under the local archive's `database/`
directory.

The database import intentionally:

- includes only filled MHT-CET state cutoff groups;
- excludes vacant-only groups and All-India/JEE groups;
- normalizes `ORPHANI` and `ORPHANN` to `ORPHAN`;
- normalizes EWS, TFWS, and orphan rows to state-level allocation;
- maps minority rows from their preserved parent allocation section;
- reuses existing 2025 institute eligibility IDs only when the explicit 2026
  home-university and minority status do not conflict;
- maps new institutes only from exact official home-university labels; and
- leaves the affiliating-university ID null for new institutes because the PDFs
  do not authoritatively provide it.

Each stored cutoff retains the official cutoff PDF name, page, serial, and PDF
SHA-256. Record IDs are deterministic, so an interrupted import can be rerun.
The import refuses to proceed if the target table contains any row outside the
verified local record set, and it never deletes rows.

The verified import contains 35,956 normalized cutoff rows across 380
institutes and 4,238 course choice codes, representing 134,942 admitted state
seats. It excludes 17,949 vacant-only source groups and 2,337 All-India or
non-MHT source groups. The 12 new 2026 institute codes have exact official
home-university mappings and deliberately null affiliating-university IDs.

The `2026_mht_cet_round_one_cutoffs` table has RLS enabled. Direct access is
revoked from anonymous and authenticated roles; server-side `service_role`
access is read-only. Schema changes are in
`supabase/migrations/20260802160720_add_2026_mht_cet_round_one_cutoffs.sql`.
