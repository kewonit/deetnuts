# balanced ranking

chance alone pushes very safe but less popular branches to the top. balanced ranking tries to surface options that are both reachable and reasonably desirable. it runs after probability, using metadata on each row plus NIRF ranks from the institute registry.

## composite formula

<p align="center">
  <img src="../../../apps/web/public/tools/p/formulas/balanced-score.svg" alt="balanced score" width="45%">
</p>

`I` = institute score, `B` = branch factor, `P` = cumulative probability. higher is better. `I` and `B` are 0–100; `P` is 0–1.

when a **branch name filter** is active in the UI, `branch_factor` is forced to `100` so every visible row is branch-neutral (the filter already narrowed branches).

## institute score

base score by institute type:

| type | base |
| --- | --- |
| IIT | 95 |
| NIT | 75 |
| IIIT | 65 |
| CFI | 55 |
| GFTI | 50 |
| unknown | 40 |

**if NIRF rank is known:** up to +5 points. rank 1 gets full bonus; rank 200+ gets none.

$$
b_{\mathrm{nirf}} = \max\!\left(0,\; 5 \cdot \left(1 - \frac{n - 1}{199}\right)\right)
$$

$$
I = \min(100,\; I_{\mathrm{base}} + b_{\mathrm{nirf}})
$$

where $n$ = NIRF rank.

**if NIRF is missing:** blend base with competitiveness vs the worst predicted closing rank in the current result set:

$$
\kappa = 1 - \frac{\hat{c}}{\hat{c}_{\max}}
$$

$$
I = \min\!\left(100,\; 0.7\, I_{\mathrm{base}} + 0.3 \cdot \max(0, \kappa) \cdot 100\right)
$$

tighter cutoffs (lower rank number) imply stronger demand, so the fallback nudges score up.

## branch score

branch names matched with keyword tiers on `program_id` and `program_name`:

| pattern (examples) | score |
| --- | --- |
| CSE, CS, Computer Science | 100 |
| AI, ML, Data Science | 92 |
| ECE, Electronics | 85 |
| EE, Electrical | 80 |
| ME, Mechanical | 72 |
| CE, Civil | 68 |
| Chemical | 65 |
| no match | 50 |

first matching tier wins. rough popularity proxy, not placement or salary data.

## sort tie-breakers

when score ties:

1. higher `institute_score`
2. higher `branch_score`
3. higher `cumulative_probability`
4. lower `predicted_closing_rank` (more competitive)

## other sort modes

| sort key | behavior |
| --- | --- |
| **balanced** | composite score above (default) |
| **best chance** | highest cumulative probability first, then closing rank (UI label; internal key `chance`) |
| **closing rank** | most competitive programs first |
| **institute** | alphabetical by institute, then program |

balanced scores recompute on filtered subsets so the competitiveness fallback uses the current result ceiling, not the full national list.
