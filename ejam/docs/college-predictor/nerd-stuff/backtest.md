# Backtest

This backtest evaluates `jam-josaa-v3` and `jam-csab-v2`. It rebuilds each index from training cutoffs, forecasts 2025 closing ranks, and compares the forecasts with the final 2025 cutoffs.

`jam-josaa-v2` is deprecated. The backtest uses the version 3 production parameters.

The result is not a promise for the current counselling cycle. It helps identify harmful index parameter changes before a data release.

## Setup

```bash
pnpm data:fetch --download
pnpm exec tsx packages/data-cli/src/backtest/predictor.ts
```

The script writes `data/_scratch/backtest-results.json`. The file is ignored by Git. The command exits with a non-zero status when either builder's within-20-percent rate falls below 30 percent.

The implementation is in `packages/data-cli/src/backtest/predictor.ts`. Its training SQL matches the production builders in `jee/josaa/build-index.ts` and `jee/csab/build-index.ts`.

## Training and holdout split

| Split    | Years        | Role                                                               |
| -------- | ------------ | ------------------------------------------------------------------ |
| Training | 2021 to 2024 | Build predicted closing rank and `sigma_eff` for each program seat |
| Holdout  | 2025         | Provide the actual final-round closing rank                        |

For each `(institute, program, seat_type, quota, gender)` key:

1. The training step runs the production DuckDB pipeline with input cutoffs limited to `year <= 2024`. JoSAA uses a four-year weighted window. CSAB uses a two-year window and the 50/50 ensemble.
2. The holdout step takes the 2025 final-round closing rank. When duplicate keys exist, the highest closing rank wins.
3. The match step keeps keys that exist in both the training index and the 2025 holdout.

The latest run on 2026-06-09 matched 11,069 JoSAA programs and 1,221 CSAB programs.

## Metrics

### Within-20-percent cutoff accuracy

For each matched program, a prediction is a hit when:

$$
\left|\frac{\hat{c} - a}{a}\right| \leq 0.20
$$

`c_hat` is the prediction from the training-only index. `a` is the actual final-round closing rank in 2025.

The result is the fraction of matched programs that pass. The JSON file also includes within-10-percent accuracy. The homepage does not show that value.

### Probability-band boundary hit

At the actual 2025 closing rank `a`, the backtest sets `r = a` in the normal CDF. It uses the training-only predicted rank and `sigma_eff`.

The backtest counts a hit when the result is **Likely** or **Possible**. This tests the label at the exact closing rank. It does not test a random applicant.

### Other fields

| Field                             | Meaning                                                                  |
| --------------------------------- | ------------------------------------------------------------------------ |
| `mae_ranks` and `median_ae_ranks` | Mean and median absolute rank error                                      |
| `band_calibration`                | Direction accuracy by band, including optimistic and pessimistic results |
| `within_10pct`                    | Same metric with a 10 percent threshold                                  |

## Latest results, 2025 holdout

| Metric                        | JoSAA (`jam-josaa-v3`) |  CSAB |
| ----------------------------- | ---------------------: | ----: |
| Within 20 percent             |              **73.9%** | 68.8% |
| Probability-band boundary hit |              **50.7%** | 51.8% |
| Programs matched              |                 11,069 | 1,221 |
| Median absolute error, ranks  |                    433 | 9,927 |

The deprecated `jam-josaa-v2` result was 72.8 percent within 20 percent. Its probability-band boundary result was 42.0 percent.

To reproduce the result, run `pnpm exec tsx packages/data-cli/src/backtest/predictor.ts`. Read the summary or open `data/_scratch/backtest-results.json`.

When you change index parameters in `packages/data-cli/src/jee/josaa/model-config.ts` or `packages/data-cli/src/jee/csab/model-config.ts`, run the backtest before you publish a data release.

## Related evaluation

Read the [2026 rounds 1 to 4 accuracy report](2026-rounds-accuracy-report.md) for a seat-level evaluation against 2026 JoSAA rounds 1 through 4. That report also groups results by institute type, seat type, quota, rank tier, disability status, and round trajectory.
