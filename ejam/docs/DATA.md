# Data release guide

Counselling data is stored as versioned Parquet files under `data/`. A catalog release identifies each file and its checksum. Predictor responses include `provenance.manifest_version`, `provenance.datasets_used`, and optional `index_lineage` data from the index sidecar.

Read [NOTICE](../NOTICE) before you change a dataset. JoSAA, CSAB, and NTA own their official data. This repository stores processed copies for project use.

## Data directory

| Dataset         | Path pattern                                                                                  | Used by                                                                          |
| --------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Cutoffs         | `data/datasets/engineering/jee/{josaa                                                         | csab}/cutoffs/year=YYYY/round=R/cutoffs.parquet`                                 | Index build. Provenance links to these files through the sidecar. |
| Seat matrix     | `data/datasets/engineering/jee/josaa/seat-matrix/year=YYYY/seat-matrix.parquet`               | Reference and transparency only. The predictor does not load it at request time. |
| JoSAA index     | `data/tools/college-predictor/josaa/predictor-index.parquet`                                  | JEE Main and JEE Advanced                                                        |
| CSAB index      | `data/tools/college-predictor/csab/predictor-index.parquet`                                   | CSAB                                                                             |
| Index lineage   | `data/tools/college-predictor/*/predictor-index.lineage.json`                                 | Maps each index to the cutoff files used during the build                        |
| Registry        | `data/reference/engineering/{institutes,programs}.json`                                       | Institute and program metadata                                                   |
| MHT-CET cutoffs | `data/datasets/engineering/mht-cet/maharashtra-cap/cutoffs/year=YYYY/round=R/cutoffs.parquet` | Published CAP evidence and model evaluation                                      |

The target-2026 MHT-CET predictor uses 2024 and 2025 data. This avoids target leakage. The observed 2026 CAP Round I dataset is available for reconciliation and evaluation. The predictor does not add it to the training set.

Schemas are in `packages/data/src/schema.ts`. Official source URLs are in `data/sources/engineering/jee.json`.

## Attribution

This is a personal project. The project does not own the counselling or examination data. The data comes from public NTA, JoSAA, and CSAB releases. See [NOTICE](../NOTICE). Check the official portal before you make an admission decision.

## Download data

Parquet files are not stored in Git. Git stores catalog releases, reference and configuration metadata, and source attribution. Release payloads are published through GitHub Releases.

```bash
pnpm data:fetch --download
```

The `--download` option downloads the tarball from the GitHub Release tagged `data-{version}`. It verifies every catalog checksum. Set `EJAM_DATA_RELEASE_URL` to use another release URL.

To verify data that already exists on disk, run:

```bash
pnpm data:fetch
```

## Add data

Git stores catalog releases, reference and configuration metadata, and source attribution. GitHub Releases stores Parquet payloads as `data-X.Y.Z.tar.gz`. The catalog file `data/catalog/releases/vX.Y.Z.json` identifies each release.

Use official cutoffs only. Add the JoSAA OR/CR or CSAB notice URL to the pull request. Add a new source to `data/sources/engineering/jee.json`. Do not add fabricated cutoffs or paywalled PDFs that you cannot redistribute. Seat matrix files are optional reference data. The predictor does not load them at request time.

### File paths

Follow the path patterns in the table above. Examples:

```text
data/datasets/engineering/jee/josaa/cutoffs/year=2026/round=1/cutoffs.parquet
data/datasets/engineering/jee/csab/cutoffs/year=2026/round=1/cutoffs.parquet
data/datasets/engineering/jee/josaa/seat-matrix/year=2026/seat-matrix.parquet
```

Index outputs go to `data/tools/college-predictor/` after the build commands finish. Do not edit them by hand.

### Files for Git

| Commit in a pull request                                 | Keep local only                      |
| -------------------------------------------------------- | ------------------------------------ |
| `data/catalog/releases/vX.Y.Z.json`                      | `data/datasets/**/*.parquet`         |
| `data/reference/**` when institute or program IDs change | `data/tools/**/*.parquet`            |
| `data/sources/engineering/jee.json` when sources change  | `data/tools/**/*.lineage.json`       |
| Documentation that you changed                           | Files under `_cache/` or `_scratch/` |

Keep Parquet files on disk for local builds. The catalog checksums let CI and other machines obtain the same files from the release tarball.

### Contributor steps

1. Start with the current data.

   ```bash
   pnpm data:fetch --download
   ```

2. Add or correct Parquet files from official sources.
3. Update metadata when needed. Add new IDs to `data/reference/engineering/` and new URLs to `data/sources/engineering/jee.json`.
4. Rebuild the indexes when cutoff history changes.

   ```bash
   pnpm build:predictor-index
   pnpm build:csab-index
   ```

5. Create a new catalog release.

   ```bash
   pnpm generate:manifest --version=v0.2.0
   ```

   Manifest generation inherits the latest catalog by default. A partial local dataset cannot silently remove published paths. Use `--base-version=vX.Y.Z` to select another base. Use `--replace` only for a full replacement. Do not combine `--replace` with `--base-version`.

6. Verify the release.

   ```bash
   pnpm data:fetch --version=v0.2.0
   pnpm verify:index-lineage
   pnpm validate:data
   pnpm --filter @ejam/data test
   ```

   Run `pnpm backtest` when you change index parameters.

7. Open a pull request with catalog, reference, and source attribution changes only. Include the official source URL in the pull request description. Do not attach Parquet files. The catalog lists each file path and SHA-256 checksum.

## Build and verify

Use these commands for a full local check:

```bash
pnpm build:predictor-index
pnpm build:csab-index
pnpm generate:manifest --version=vX.Y.Z
pnpm data:fetch --version=vX.Y.Z
pnpm verify:index-lineage
pnpm validate:data
```

Run `pnpm backtest` when you change index parameters.

## Catalog release format

The canonical release file is `data/catalog/releases/v*.json`.

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

Paths omit the `data/` prefix. Deployment checks require `predictor_index` in the catalog release. Cutoff files are checksum-validated and linked at runtime through index lineage sidecars.
