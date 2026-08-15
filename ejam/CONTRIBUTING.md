# Contributing to ejam

ejam is a personal hobby project, open source under [AGPL-3.0-or-later](LICENSE). Contributions are welcome: code, data fixes, docs, and bug reports.

Read [NOTICE](NOTICE) before touching datasets. Official JoSAA / CSAB / NTA data stays their property; this repo only ships processed copies for convenience.

<br>

## Help with

Code (web, engine, index build), cutoff data, docs, or issues.

**Non-engineering exams (NEET, etc.)** Right now ejam is mostly JEE / JoSAA / CSAB. I do not know how NEET or other counselling bodies work (MCC, state quotas, round rules, where official cutoffs live). If you do, I would genuinely love help: docs explaining the process, data sources, or what a tool should even look like. [Open an issue](https://github.com/su6u/ejam/issues/new).

<br>

## Setup

Node 22+, pnpm 11 (`packageManager` in root). uv if you touch Python validation.

```bash
git clone https://github.com/su6u/ejam.git && cd ejam
pnpm install
pnpm data:fetch --download
pnpm dev
```

App is `apps/web`, predictor at `/college-predictor`.

<br>

## Before a PR

```bash
pnpm typecheck
pnpm check
pnpm build
```

Touched `data/` or index builders? Also run:

```bash
pnpm data:fetch
pnpm verify:index-lineage
pnpm validate:data
pnpm --filter @ejam/data test
```

Changed index hyperparams? `pnpm backtest`. Lint fix: `pnpm check:write`.

Match existing style in the file you edit. One concern per PR when you can. Details: [docs/DATA.md](docs/DATA.md) for data, [docs/college-predictor/](docs/college-predictor/) for predictor.

<br>

## Data PRs

Official cutoffs only. Cite the source URL. No fabricated cutoffs or stuff you can't redistribute.

Full walkthrough: [docs/DATA.md — Adding data](docs/DATA.md#adding-data). Short version:

1. `pnpm data:fetch --download`
2. Add/fix parquets locally, rebuild indices if history changed
3. `pnpm generate:manifest --version=vX.Y.Z` and run the verify commands in [Before a PR](#before-a-pr)
4. Open PR with catalog release + reference + sources only

<br>

## Bugs

Share rank/profile (or sanitized URL), expected vs actual, data version from results footer if you have it. Wrong cutoff? Official OR/CR link beats a screenshot.

<br>

## Security

Serious stuff: contact maintainer privately, not a public issue.
