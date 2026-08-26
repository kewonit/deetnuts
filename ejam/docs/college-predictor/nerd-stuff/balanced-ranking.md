# Balanced ranking

Probability alone can place a highly reachable branch above a branch that a student may prefer. Balanced ranking combines probability with institute and branch scores.

The score runs after probability calculation. It uses metadata for each row and NIRF ranks from the institute registry.

## Composite formula

<p align="center">
  <img src="../../../apps/web/public/tools/p/formulas/balanced-score.svg" alt="Balanced score" width="45%">
</p>

`I` is institute score. `B` is branch score. `P` is cumulative probability. Higher values produce a higher score. `I` and `B` range from 0 to 100. `P` ranges from 0 to 1.

When the interface filters by branch name, it sets `branch_factor` to `100`. The filter already selects the branch group.

## Institute score

The base score depends on institute type:

| Type    | Base score |
| ------- | ---------: |
| IIT     |         95 |
| NIT     |         75 |
| IIIT    |         65 |
| CFI     |         55 |
| GFTI    |         50 |
| Unknown |         40 |

When the NIRF rank exists, the score can increase by up to 5 points. Rank 1 receives the full bonus. Rank 200 or higher receives no bonus.

$$
b_{\mathrm{nirf}} = \max\!\left(0,\; 5 \cdot \left(1 - \frac{n - 1}{199}\right)\right)
$$

$$
I = \min(100,\; I_{\mathrm{base}} + b_{\mathrm{nirf}})
$$

`n` is the NIRF rank.

When NIRF data is missing, the score uses the base score and competitiveness against the highest predicted closing rank in the current result set.

$$
\kappa = 1 - \frac{\hat{c}}{\hat{c}_{\max}}
$$

$$
I = \min\!\left(100,\; 0.7\, I_{\mathrm{base}} + 0.3 \cdot \max(0, \kappa) \cdot 100\right)
$$

A lower predicted closing rank indicates stronger demand. The fallback increases the score for that condition.

## Branch score

The builder matches keywords in `program_id` and `program_name`. The first matching tier wins.

| Pattern examples          | Score |
| ------------------------- | ----: |
| CSE, CS, Computer Science |   100 |
| AI, ML, Data Science      |    92 |
| ECE, Electronics          |    85 |
| EE, Electrical            |    80 |
| ME, Mechanical            |    72 |
| CE, Civil                 |    68 |
| Chemical                  |    65 |
| No match                  |    50 |

This score is a rough popularity measure. It does not represent placement or salary data.

## Tie breakers

When two rows have the same balanced score, sort them in this order:

1. Higher `institute_score`.
2. Higher `branch_score`.
3. Higher `cumulative_probability`.
4. Lower `predicted_closing_rank`.

## Other sort modes

| Sort key                   | Behavior                                                                          |
| -------------------------- | --------------------------------------------------------------------------------- |
| **Balanced**               | Uses the composite score. This is the default.                                    |
| **Best probability**       | Sorts by cumulative probability, then closing rank. The internal key is `chance`. |
| **Predicted closing rank** | Places the most competitive programs first.                                       |
| **Institute**              | Sorts by institute name, then program name.                                       |

The interface recalculates balanced scores after filters run. The competitiveness fallback uses the highest result in the filtered set.
