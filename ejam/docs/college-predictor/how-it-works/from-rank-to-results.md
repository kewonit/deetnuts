# From rank to results

Each result represents one seat pool. A seat pool combines an institute, program, seat type, quota, and gender.

The predictor asks one question. How often did a similar rank reach this seat in the available history?

## The index row

The index builder prepares each row before a request runs. It performs these steps:

- It weights opening and closing ranks from several years.
- It calculates a predicted closing rank for the target cycle.
- It stores a mean for each counselling round.
- It stores a typical final round called `fill_round`.
- It sets `sigma_eff`, which represents uncertainty.

The request reads the index row. It does not rebuild the index.

## Probability for each round

For each round through `fill_round`, the predictor compares the submitted rank with that round's predicted closing rank.

<p align="center">
  <img src="../../../apps/web/public/tools/p/formulas/single-round-probability.svg" alt="Single-round probability" width="45%">
</p>

A lower rank number is better. A rank equal to the predicted closing rank has a probability near 50 percent.

The predictor combines the round probabilities into one cumulative probability. The interface shows the cumulative value for each round. It also shows the average from round 1 through `fill_round` as the headline probability.

Read [Prediction engine](../nerd-stuff/prediction-engine.md) for the formulas.

## Probability bands

The thresholds are fixed in the index code. The internal keys remain stable for API compatibility.

| Display label     | Internal key    | Threshold            | Meaning                                  |
| ----------------- | --------------- | -------------------- | ---------------------------------------- |
| **Likely**        | `safe`          | $P \geq 0.85$        | High probability at this rank            |
| **Possible**      | `iffy`          | $0.40 \leq P < 0.85$ | The program may be available             |
| **Unlikely**      | `delulu`        | $0.10 \leq P < 0.40$ | Low probability                          |
| **Very unlikely** | `doesnt-matter` | $P < 0.10$           | Very low probability. Hidden by default. |

Results below 10 percent remain hidden until you select **Show very unlikely results**. The URL and API option is `include_all=true`.

## Predicted closing rank

The predicted closing rank is the forecast for the target cycle. It uses historical rank data, trend limits, and uncertainty. It is not a copy of the previous year's cutoff.

The probability compares the submitted rank with this forecast by using `sigma_eff`.

## Sorting

The default sort uses the balanced score. It combines institute score, branch score, and cumulative probability.

You can also sort by best probability, predicted closing rank, or institute name. The filters run in the browser. They do not rebuild the index.

Read [Balanced ranking](../nerd-stuff/balanced-ranking.md) for the score formula.

## Data quality

Each row has a quality label based on the amount of supporting history.

| Label        | Years     | Interpretation                                     |
| ------------ | --------- | -------------------------------------------------- |
| `sufficient` | 3 or more | More stable historical support                     |
| `inferred`   | 2         | Limited historical support                         |
| `pooled`     | 1         | Wide uncertainty. Treat the result as an estimate. |

Open a result to view its quality label and round chart. Check the official portal before you make a decision.
