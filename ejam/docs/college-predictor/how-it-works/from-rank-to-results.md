# from rank to results

every row you see is one **seat pool**: institute + branch + seat type + quota + gender. all we're really asking is, at your rank, how often did someone like you actually land that seat in past years, nudged forward to this cycle?

## the index row (built offline)

before you ever hit predict, the index builder already did the boring part:

- weighted a bunch of years of opening/closing ranks per round
- projected a **predicted closing rank** for this cycle (trend + how the pool shifts on josaa)
- saved per-round means and a **fill round** (the point where the seat basically stopped moving)
- set $\sigma_{\mathrm{eff}}$, the uncertainty width, wider when there just isn't much data

the live api doesn't redo any of this. it grabs the row and runs the probability math.

## your chance per round

for each round up to `fill_round`, we line up your rank against the predicted closing rank and treat it like a normal curve:

<p align="center">
  <img src="../../../apps/web/public/tools/p/formulas/single-round-probability.svg" alt="single-round probability" width="45%">
</p>

better rank (lower $r$) → higher $P_i$. same rank → around 50%.

then all the rounds get squished into one headline **chance** (average cumulative probability through `fill_round`). the little round bars in the table are just that story drawn out.

full formulas: [prediction engine](../nerd-stuff/prediction-engine.md).

## the bands

bands are just so you can scan fast. the cutoffs are fixed in code:

| band | threshold | meaning |
| --- | --- | --- |
| **safe** | $P \geq 0.85$ | high chance at this rank |
| **iffy** | $0.40 \leq P < 0.85$ | possible, but not locked |
| **delulu** | $0.10 \leq P < 0.40$ | low chance, long shot |
| **doesn't matter yaar** | $P < 0.10$ | very low chance, hidden by default |

under 10% is hidden until you flip **Doesn't matter yaar → Show** in the filters (same thing as `include_all=true` in the url/api).

## the closing rank column

**predicted closing rank** ($\hat{c}$) is our guess for where the seat closes this year. **chance** just compares your rank $r$ to that guess using $\sigma_{\mathrm{eff}}$.

## sorting

default is **balanced**: institute quality $\times$ branch tier $\times$ chance. you can also sort by best chance, closing rank, or institute id. the sidebar filters (institute type, band) work on the client, so nothing re-runs the engine.

balanced formula: [balanced ranking](../nerd-stuff/balanced-ranking.md).

## data quality

every row carries a quality tag based on how many years of history backed it:

| tag | years | trust |
| --- | --- | --- |
| `sufficient` | 3+ | steadier |
| `inferred` | 2 | more shaky |
| `pooled` | 1 | widest sigma, treat as rough |

open the detail panel on a row for the tag and the round chart before you trust a number too much.

**back:** [getting started](../learn/getting-started.md)
