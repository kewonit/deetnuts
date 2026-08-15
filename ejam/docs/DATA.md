# Data release guide

All counselling data lives as versioned parquet under `data/`, pinned by a catalog release. When you run the predictor, the response includes `provenance.manifest_version`, `provenance.datasets_used` (each entry is `loaded` or `linked`), and optional `index_lineage` from the index sidecar so you can see what cutoffs built the index.

Read [NOTICE](../NOTICE) before touching datasets. Official JoSAA / CSAB / NTA data stays their property; this repo only ships processed copies for convenience.

<br>

## What's in `data/`

| Dataset | Path pattern | Used by |
|---------|--------------|---------|
| Cutoffs | `data/datasets/engineering/jee/{josaa|csab}/cutoffs/year=YYYY/round=R/cutoffs.parquet` | Index build (linked in provenance via sidecar) |
| Seat matrix | `data/datasets/engineering/jee/josaa/seat-matrix/year=YYYY/seat-matrix.parquet` | Reference / transparency only; **not** loaded by the prediction runtime |
| Predictor index | `data/tools/college-predictor/josaa/predictor-index.parquet` | JEE Main, JEE Advanced |
| CSAB index | `data/tools/college-predictor/csab/predictor-index.parquet` | CSAB |
| Index lineage | `data/tools/college-predictor/*/predictor-index.lineage.json` | Maps each index to cutoff files consumed at build time |
| Registry | `data/reference/engineering/{institutes,programs}.json` | Institute and program metadata; update when new ids show up in cutoffs |
| MHT-CET cutoffs | `data/datasets/engineering/mht-cet/maharashtra-cap/cutoffs/year=YYYY/round=R/cutoffs.parquet` | Published CAP evidence and model evaluation |

The target-2026 MHT-CET predictor remains trained on 2024-2025 data to avoid
target leakage. The observed 2026 CAP Round I cutoff dataset is published for
reconciliation and evaluation, and is not silently added to that training set.

Schemas: `packages/data/src/schema.ts` (`CutoffRow`, `SeatMatrixRow`). Official source URLs: `data/sources/engineering/jee.json`.

<br>

## Attribution

Personal hobby project. I don't own the counselling or exam data; it's compiled from public NTA, JoSAA, and CSAB releases. See [NOTICE](../NOTICE). Always verify on official portals before making decisions.

<br>

## Get Data Locally

Parquet files under `data/` do not ship in git. Git tracks catalog releases, reference/config metadata, and source attribution; release payloads live in GitHub Releases.

```bash
pnpm data:fetch --download
```

`--download` pulls the tarball from the GitHub Release tagged `data-{version}` and verifies every catalog checksum. Override with `EJAM_DATA_RELEASE_URL` if needed.

If you already have local data and only want to verify it:

```bash
pnpm data:fetch
```

<br>

## Adding data

Git tracks catalog releases, reference/config metadata, and source attribution. Parquet payloads live in GitHub Releases as `data-X.Y.Z.tar.gz`, pinned by `data/catalog/releases/vX.Y.Z.json`. Local dev, CI, and Vercel all hydrate `data/` with `pnpm data:fetch --download`.

Official cutoffs only. Cite the JoSAA OR/CR or CSAB notice URL in your PR. If it's a new source, add it to `data/sources/engineering/jee.json`. No fabricated cutoffs, no paywalled PDFs you can't redistribute. Seat matrix is optional registry data; the predictor does not load it at runtime.

### Where to put files

Follow the path patterns in the table above. Examples:

```text
data/datasets/engineering/jee/josaa/cutoffs/year=2026/round=1/cutoffs.parquet
data/datasets/engineering/jee/csab/cutoffs/year=2026/round=1/cutoffs.parquet
data/datasets/engineering/jee/josaa/seat-matrix/year=2026/seat-matrix.parquet
```

Index outputs land in `data/tools/college-predictor/` after you run the build commands below — don't hand-edit those unless you know what you're doing.

### What goes in git

| Commit in PR | Keep local only |
|--------------|-----------------|
| `data/catalog/releases/vX.Y.Z.json` | `data/datasets/**/*.parquet` |
| `data/reference/**` (if institute/program ids changed) | `data/tools/**/*.parquet` |
| `data/sources/engineering/jee.json` (if sources changed) | `data/tools/**/*.lineage.json` |
| docs, if you touched them | anything under `_cache/` or `_scratch/` |

Parquet files stay on disk for your build but are gitignored. The catalog checksums are how CI and other machines get the same bytes from the release tarball.

### Contributor steps

1. **Start from current data**

   ```bash
   pnpm data:fetch --download
   ```

2. **Add or fix parquets** from official sources at the paths above.

3. **Update metadata** when needed — new ids in `data/reference/engineering/`, new URLs in `data/sources/engineering/jee.json`.

4. **Rebuild indices** if cutoff history changed:

   ```bash
   pnpm build:predictor-index
   pnpm build:csab-index
   ```

5. **Bump the catalog release** — pick a new semver, e.g. `v0.2.0`:

   ```bash
   pnpm generate:manifest --version=v0.2.0
   ```

   Manifest generation inherits the latest catalog by default, so a partial
   local dataset checkout cannot silently remove previously published paths.
   Use `--base-version=vX.Y.Z` to select a different base. Use `--replace`
   only for an intentional full replacement; it cannot be combined with
   `--base-version`.

6. **Verify locally**:

   ```bash
   pnpm data:fetch --version=v0.2.0
   pnpm verify:index-lineage
   pnpm validate:data
   pnpm --filter @ejam/data test
   ```

   Changed index hyperparams? Also run `pnpm backtest`.

7. **Open a PR** with catalog release + reference + source attribution only. Mention the official source URL(s) in the PR description. You don't need to attach parquets — the catalog lists every file path and sha256.

<br>

## Build and verify

Quick reference — full walkthrough in [Adding data](#adding-data):

```bash
pnpm build:predictor-index    # JoSAA -> data/tools/college-predictor/josaa/predictor-index.parquet + .lineage.json
pnpm build:csab-index         # CSAB -> data/tools/college-predictor/csab/predictor-index.parquet + .lineage.json
pnpm generate:manifest --version=vX.Y.Z
pnpm data:fetch --version=vX.Y.Z
pnpm verify:index-lineage
pnpm validate:data
```

Changed index hyperparams? Also run `pnpm backtest`.

<br>

## Catalog release format

Canonical file: `data/catalog/releases/v*.json`

```json
{
  "version": "v0.1.0",
  "generated_at": "2026-04-26T18:35:55Z",
  "git_sha": "abc1234",
  "datasets": [
    {
      "path": "datasets/engineering/jee/josaa/cutoffs/year=2025/round=1/cutoffs.parquet",
      "sha256": "...",
      "bytes": 81938
    }
  ]
}
```

Paths omit the `data/` prefix. Deploy gating needs `predictor_index` in the catalog release; cutoffs are checksum-validated and linked at runtime through index lineage sidecars.
