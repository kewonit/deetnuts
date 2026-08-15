# FAQs

Quick answers about how ejam works. For formulas and pipeline detail, see [Prediction engine](../nerd-stuff/prediction-engine.md) and [Index algorithms](../nerd-stuff/index-algorithms.md).

> **Warning:** Hobby project, not an official NTA, JoSAA, or CSAB service. Confirm ranks, eligibility, and seat counts on government portals before locking choices.

## About predictions

<details>
<summary>Does a Safe band mean a guaranteed seat?</summary>

No. **Safe** means the model puts cumulative chance at roughly 85%+ from past cutoffs and the rank entered. That is a planning label, not a seat guarantee. Cutoffs move every year. New seats, category changes, and choice-filling order can all shift where a program actually closes.

</details>

<details>
<summary>How accurate are the numbers?</summary>

Depends on how stable that program's cutoff history is. Rows tagged `sufficient` (3+ years) are usually steadier. `inferred` (2 years) and `pooled` (1 year) are noisier, and the index widens $\sigma_{\mathrm{eff}}$ for sparse rows. Builders are backtested on held-out years ([backtest.md](../nerd-stuff/backtest.md)); a good backtest is not a promise for this year's counselling.

</details>

<details>
<summary>Why might results differ from other predictors?</summary>

Different years, formulas, or category matching. ejam uses `jam-josaa-v3` / `jam-csab-v2` (v2 deprecated), round-weighted JoSAA anchors, pool shift on JoSAA only, and a normal-CDF chance model. Many sites treat last year's closing rank as a hard cutoff with no probability band.

</details>

<details>
<summary>Why are some colleges missing?</summary>

A row only appears if that program exists in the cutoff dataset for the selected seat type, gender, and quota. Brand-new programs, rare quota combos, or home-state filtering can drop rows. Toggle filters or check whether that combo showed up in recent JoSAA/CSAB data.

</details>

## Ranks and inputs

<details>
<summary>Which rank should be entered?</summary>

The counselling rank for the exam being predicted:

- **JEE Main + JoSAA or CSAB:** JEE Main rank (NIT / IIIT / CFI)
- **JEE Advanced:** JEE Advanced rank (IIT only)

Do not mix Main and Advanced ranks across predictors. Allotment is rank-based, not percentile-based.

</details>

<details>
<summary>What are the rank limits?</summary>

Hard limits in the UI and API:

| Exam | Accepted range |
| --- | --- |
| JEE Main | 1 to **500,000** |
| CSAB | 1 to **500,000** |
| JEE Advanced | 1 to **50,000** |

These are not NTA's official rank caps. They are the range where this tool can return meaningful rows.

The predictor matches rank against historical closing ranks in the index. JoSAA/CSAB data for NIT+ seats basically runs out long before 500,000, but that cap matches the Main/CSAB validators and leaves headroom for edge cases. IIT counselling is a much smaller pool (on the order of tens of thousands of qualified candidates), so Advanced stops at 50,000. Above these limits there are no seat rows to score against, so the app rejects the input instead of showing empty or nonsense results.

</details>

<details>
<summary>What do Safe, Iffy, Delulu, and Doesn't matter yaar mean?</summary>

Fixed chance bands for scanning the table:

| Band | Threshold | Rough read |
| --- | --- | --- |
| **Safe** | $P \geq 0.85$ | High chance at this rank |
| **Iffy** | $0.40 \leq P < 0.85$ | Possible, but not locked |
| **Delulu** | $0.10 \leq P < 0.40$ | Low chance, long shot |
| **Doesn't matter yaar** | $P < 0.10$ | Very low chance, hidden by default |

Math and round bars: [From rank to results](../how-it-works/from-rank-to-results.md).

</details>

<details>
<summary>Why are "Doesn't matter yaar" picks hidden by default?</summary>

Below 10% they mostly clutter the list. Flip **Doesn't matter yaar → Show** in the filters (or pass `include_all=true` in the URL / API).

</details>

<details>
<summary>What is predicted closing rank on each row?</summary>

The index forecast $\hat{c}$ for where that seat might close this cycle: weighted history, capped trend, and (for JoSAA) pool shift. Not last year's cutoff copied forward. **Chance** compares student rank $r$ via $P_i = \Phi\!\left((\hat{c}_i - r)/\sigma_{\mathrm{eff}}\right)$.

</details>

<details>
<summary>Why is the Predict button disabled after a run?</summary>

It re-enables when any main input changes: rank, category, gender, quota, home state, exam, or counselling. Sidebar filters apply on the client and do not need another Predict click.

</details>

## Categories and quotas

<details>
<summary>Why does the tool ask for home state?</summary>

For **HS** (Home State) and **OS** (Other State) on JEE Main and CSAB, which seat rows apply depends on whether the institute is in the student's home state. HS seats are for domiciled students; OS seats are for everyone else. **AI** (All India) ignores home state. Default quota is **OS**.

</details>

<details>
<summary>What about EWS?</summary>

Two separate paths:

1. **Gen-EWS** in the category dropdown: normal prediction against EWS seat rows.
2. **`?ews=true` in the URL:** dual OPEN + EWS comparison for General students weighing a certificate.

Both assume real EWS certificate eligibility for counselling. Dual mode shows a caveat when active.

</details>

<details>
<summary>What is GFTI vs CFI?</summary>

Same institute group. JoSAA documents say **GFTI**; ejam's index and UI badge say **CFI**.

</details>

<details>
<summary>What is the difference between JEE Main, JEE Advanced, and CSAB in the app?</summary>

- **JEE Main + JoSAA:** NIT, IIIT, CFI/GFTI via the six-round JoSAA process (non-IIT index)
- **JEE Advanced:** IIT only, AI quota (same JoSAA index, IIT filter)
- **CSAB:** Supplementary counselling after JoSAA for vacant seats; separate cutoff history and index; closing ranks are usually worse (higher numbers)

</details>

## Share links

<details>
<summary>How do share links work?</summary>

Main inputs sync to the URL: `rank`, `exam`, `counselling`, `category`, `gender`, `quota`, `state`, `ews`, `include_all`. A complete URL on load auto-runs the prediction. Legacy links at `/` with these params redirect to `/college-predictor`.

</details>

## Data and the project

<details>
<summary>Where does the data come from?</summary>

Public JoSAA and CSAB cutoff datasets in `data/datasets/engineering/jee/`. Source URLs: `data/sources/engineering/jee.json`. Institute metadata and NIRF ranks: `data/reference/engineering/`.

</details>

<details>
<summary>Can the data be trusted?</summary>

Cutoffs are transcribed from official PDFs and notices. Typos and lag happen. Each API response includes provenance (manifest version, datasets used). Release mechanics and checksums: [DATA.md](../../DATA.md).

</details>

<details>
<summary>Is ejam free?</summary>

Yes. No account, no paywall. Source is AGPL. Personal hobby project, not affiliated with NTA, JoSAA, CSAB, or any institute.

</details>

<details>
<summary>What does Balanced sort do?</summary>

Default sort: $\frac{I}{100} \cdot \frac{B}{100} \cdot P$ (institute $\times$ branch $\times$ chance). Navigation aid, not an official college ranking. **Best chance** or **Closing rank** sort by probability or competitiveness only. Formula: [Balanced ranking](../nerd-stuff/balanced-ranking.md).

</details>

<details>
<summary>What do the round bars on each row mean?</summary>

Six bars for JoSAA-style rounds 1–6. Height is cumulative probability through that round. After the program's typical `fill_round`, later bars freeze. The % label is the average cumulative chance from round 1 through `fill_round`.

</details>

## More reading

| Guide | Description |
| --- | --- |
| [Overview](../how-it-works/overview.md) | End-to-end pipeline. |
| [From rank to results](../how-it-works/from-rank-to-results.md) | Bands, chance, closing rank. |
| [Prediction engine](../nerd-stuff/prediction-engine.md) | Runtime math and round probabilities. |
| [Index algorithms](../nerd-stuff/index-algorithms.md) | Offline index build. |
| [Data pipeline](../../DATA.md) | Fetch, verify, and rebuild datasets locally. |
