# backtest

holdout check for `jam-josaa-v3` and `jam-csab-v2`. rebuilds each index from training cutoffs only, forecasts 2025 closing ranks, and compares to actual 2025 final-round cutoffs.

> `jam-josaa-v2` is deprecated. backtest now runs v3 production hyperparams.

not a promise for this year's counselling. useful for catching bad hyperparam changes before shipping.

## setup

```bash
pnpm data:fetch --download   # needs local cutoff parquets
pnpm exec tsx packages/data-cli/src/backtest/predictor.ts
```

writes `data/_scratch/backtest-results.json` (gitignored). exits non-zero if either builder's within-20% rate drops below 30%.

implementation: `packages/data-cli/src/backtest/predictor.ts`. training SQL mirrors the production index builders (`jee/josaa/build-index.ts`, `jee/csab/build-index.ts`).

## train / holdout split

| split | years | role |
| --- | --- | --- |
| training | 2021–2024 | build predicted closing rank + `sigma_eff` per program seat |
| holdout | 2025 | ground truth from official cutoffs |

for each `(institute, program, seat_type, quota, gender)` key:

1. **training:** run the same DuckDB pipeline as production, but cap input cutoffs at `year <= 2024`. JoSAA uses a 4-year weighted window; CSAB uses 2 years and the 50/50 ensemble.
2. **holdout:** take 2025's **final round** closing rank (max round per key, worst closing rank wins dedupe ties).
3. **match:** keep keys present in both training index and 2025 holdout.

latest run (2026-06-09): **11,069** JoSAA programs matched, **1,221** CSAB programs matched.

## metrics

### ±20% cutoff accuracy (`within_20pct`)

for each matched program, a hit when:

$$
\left|\frac{\hat{c} - a}{a}\right| \le 0.20
$$

$\hat{c}$ = predicted closing rank from the training-only index. $a$ = actual 2025 final-round closing rank.

reported as the fraction of matched programs that pass. JSON also has ±10% (`within_10pct`); not shown on the homepage.

### band boundary hit (`band_accuracy`)

at the **actual** 2025 closing rank $a$, plug $r = a$ into the normal CDF with the training-only $\hat{c}$ and $\sigma_{\mathrm{eff}}$. classify the band (safe ≥85%, iffy ≥40%, delulu ≥10%, else doesn't matter yaar).

count a hit when the band is **safe** or **iffy**. that checks whether a student sitting exactly on the holdout closing rank would see a non-pessimistic label.

this is not the same as "did we predict the right band for a random applicant." it only tests programs at the cutoff boundary.

### other fields in `backtest-results.json`

| field | meaning |
| --- | --- |
| `mae_ranks` / `median_ae_ranks` | mean / median absolute rank error |
| `band_calibration` | per-band direction accuracy (optimistic vs pessimistic vs predicted rank) |
| `within_10pct` | same as ±20%, threshold 10% |

## latest results (2025 holdout)

| metric | JoSAA (`jam-josaa-v3`) | CSAB |
| --- | --- | --- |
| ±20% cutoff accuracy | **73.9%** | 68.8% |
| band boundary hit | **50.7%** | 51.8% |
| programs matched | 11,069 | 1,221 |
| median absolute error (ranks) | 433 | 9,927 |

previous `jam-josaa-v2` (deprecated): 72.8% ±20%, 42.0% band boundary.

reproduce: `pnpm exec tsx packages/data-cli/src/backtest/predictor.ts` and read the summary, or open `data/_scratch/backtest-results.json`.

---

when you change index hyperparameters (`packages/data-cli/src/jee/josaa/model-config.ts`, `packages/data-cli/src/jee/csab/model-config.ts`), run the backtest script before publishing a data release.

---

## related: 2026 mid-counselling holdout

for a seat-by-seat accuracy report against **2026 JoSAA rounds 1–4** (train ≤2025, no leakage), see [2026 R1–R4 accuracy report](2026-rounds-accuracy-report.md). that run also breaks out institute type, seat type, quota, rank tier, PwD vs non-PwD, and round-trajectory drift.
