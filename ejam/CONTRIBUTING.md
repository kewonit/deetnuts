# Contributing to eJAM

eJAM is an open-source project under [AGPL-3.0-or-later](LICENSE). Contributions can include code, data corrections, documentation, and bug reports.

Read [NOTICE](NOTICE) before you change a dataset. JoSAA, CSAB, and NTA own their official data. This repository stores processed copies for project use.

## Contribution areas

You can contribute to the web application, predictor, index builders, cutoff data, documentation, or issue reports.

The project currently focuses on JEE Main, JEE Advanced, JoSAA, and CSAB. If you understand another counselling system, open an issue with the official rules and source locations.

## Setup

Use Node.js 22 or newer and pnpm 11. The root `package.json` defines the package manager version. Use `uv` when you change Python validation tools.

```bash
git clone https://github.com/su6u/ejam.git
cd ejam
pnpm install
pnpm data:fetch --download
pnpm dev
```

The web application is in `apps/web`. The college predictor uses the `/college-predictor` route.

## Before you open a pull request

Run these checks:

```bash
pnpm typecheck
pnpm check
pnpm build
```

Run these additional checks when you change `data/` or an index builder:

```bash
pnpm data:fetch
pnpm verify:index-lineage
pnpm validate:data
pnpm --filter @ejam/data test
```

Run `pnpm backtest` when you change index parameters. Run `pnpm check:write` to apply lint fixes.

Keep the existing style in each file. Keep one concern per pull request when possible. Read [DATA.md](docs/DATA.md) for data changes and [college predictor documentation](docs/college-predictor/) for predictor changes.

## Data changes

Use official cutoff data only. Include the source URL in the pull request. Do not add fabricated data or material that you cannot redistribute.

1. Run `pnpm data:fetch --download`.
2. Add or correct local Parquet files.
3. Rebuild the index when the cutoff history changes.
4. Run `pnpm generate:manifest --version=vX.Y.Z`.
5. Run the checks in [Before you open a pull request](#before-you-open-a-pull-request).
6. Open a pull request with catalog, reference, and source changes only.

Read [DATA.md](docs/DATA.md#adding-data) for the complete process.

## Bug reports

Include the rank and profile inputs, or a sanitized URL. Describe the expected and actual result. Include the data version shown in the result footer when available. For a cutoff correction, provide the official OR/CR source link instead of a screenshot.

## Security reports

Send serious security reports to the maintainer privately. Do not publish sensitive details in a public issue.
