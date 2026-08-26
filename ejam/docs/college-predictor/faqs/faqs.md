# Frequently asked questions

These answers describe how eJAM works. Read [Prediction engine](../nerd-stuff/prediction-engine.md) and [Index algorithms](../nerd-stuff/index-algorithms.md) for technical details.

> **Warning:** eJAM is not an official NTA, JoSAA, or CSAB service. Check ranks, eligibility, and seat counts on the official portal before you submit choices.

## Predictions

<details>
<summary>Does the Likely band guarantee a seat?</summary>

No. **Likely** means that the model estimates a cumulative probability of about 85 percent or more from historical cutoffs and the submitted rank. It is a planning label. It is not a seat guarantee.

Cutoffs can change each year. New seats, category changes, and choice-filling order can change where a program closes.

</details>

<details>
<summary>How accurate are the results?</summary>

Accuracy depends on the stability of the program's cutoff history. Rows with `sufficient` history have at least three years of data. Rows with `inferred` or `pooled` history have less data and wider uncertainty.

The builders use held-out years for backtesting. A backtest does not predict the result of the current counselling cycle.

</details>

<details>
<summary>Why can results differ from other predictors?</summary>

Predictors can use different years, formulas, and category rules. eJAM uses `jam-josaa-v3` and `jam-csab-v2`. It uses round-weighted JoSAA anchors, a JoSAA pool shift, and a normal-CDF probability model.

Many predictors copy the previous closing rank as a fixed cutoff. eJAM returns a probability band instead.

</details>

<details>
<summary>Why are some colleges missing?</summary>

A row appears only when the selected program exists for the chosen seat type, gender, and quota. New programs, rare quota combinations, and home-state filters can remove rows.

Change the filters or check whether the selected combination appears in recent JoSAA or CSAB data.

</details>

## Rank and profile inputs

<details>
<summary>Which rank should I enter?</summary>

Enter the counselling rank for the selected exam:

- **JEE Main with JoSAA or CSAB:** JEE Main rank for NIT, IIIT, and CFI institutes.
- **JEE Advanced:** JEE Advanced rank for IITs.

Do not use a JEE Main rank in the JEE Advanced view. Do not use a percentile as a rank.

</details>

<details>
<summary>What are the rank limits?</summary>

| Exam         | Accepted range   |
| ------------ | ---------------- |
| JEE Main     | 1 to **500,000** |
| CSAB         | 1 to **500,000** |
| JEE Advanced | 1 to **50,000**  |

These are limits for this tool. They are not official NTA rank limits.

The tool uses these ranges because historical data does not provide meaningful rows beyond them. The application rejects a rank outside the range.

</details>

<details>
<summary>What do the probability labels mean?</summary>

| Display label     | Internal key    | Threshold            | Meaning                      |
| ----------------- | --------------- | -------------------- | ---------------------------- |
| **Likely**        | `safe`          | $P \geq 0.85$        | High probability             |
| **Possible**      | `iffy`          | $0.40 \leq P < 0.85$ | The program may be available |
| **Unlikely**      | `delulu`        | $0.10 \leq P < 0.40$ | Low probability              |
| **Very unlikely** | `doesnt-matter` | $P < 0.10$           | Hidden by default            |

The internal keys remain stable for API compatibility.

</details>

<details>
<summary>Why are very unlikely results hidden?</summary>

Results below 10 percent can make the list harder to use. Select **Show very unlikely results** in the filters, or pass `include_all=true` in the URL or API request.

</details>

<details>
<summary>What is the predicted closing rank?</summary>

The predicted closing rank is the index forecast for the target cycle. It uses weighted history, trend limits, and a pool shift for JoSAA. It is not the previous year's cutoff copied forward.

The probability uses the forecast and `sigma_eff`, which represents uncertainty.

</details>

<details>
<summary>Why is the Predict button disabled after a run?</summary>

The button becomes active when a main input changes. Main inputs include rank, category, gender, quota, home state, exam, and counselling body.

Sidebar filters run in the browser. They do not require another prediction request.

</details>

## Categories and quotas

<details>
<summary>Why does the tool ask for a home state?</summary>

For `HS` and `OS` in JEE Main and CSAB, the applicable seat rows depend on the institute state and the student's home state.

`HS` seats are for students with the required domicile. `OS` seats are for students from another state. `AI` seats do not use the home state. The default quota is `OS`.

</details>

<details>
<summary>How does the EWS option work?</summary>

The tool has two paths:

1. **Gen-EWS** in the category list compares the rank with EWS seat rows.
2. **`?ews=true` in the URL** adds an EWS comparison beside the OPEN comparison for a General candidate.

Both paths assume valid EWS eligibility during counselling. The dual view shows a notice when it is active.

</details>

<details>
<summary>What is the difference between GFTI and CFI?</summary>

They refer to the same institute group in this context. JoSAA documents use `GFTI`. The eJAM index and interface use `CFI`.

</details>

<details>
<summary>How do JEE Main, JEE Advanced, and CSAB differ?</summary>

- **JEE Main with JoSAA:** NIT, IIIT, and CFI institutes in the JoSAA process.
- **JEE Advanced:** IITs with All India quota.
- **CSAB:** Supplementary counselling after JoSAA for vacant seats. It uses a separate cutoff history and index.

</details>

## Shared URLs

<details>
<summary>How do shared URLs work?</summary>

The URL stores the main inputs: `rank`, `exam`, `counselling`, `category`, `gender`, `quota`, `state`, `ews`, and `include_all`.

A complete URL runs the prediction when it loads. Legacy links at `/` with these parameters redirect to `/college-predictor`.

</details>

## Data and project

<details>
<summary>Where does the data come from?</summary>

The project uses public JoSAA and CSAB cutoff datasets in `data/datasets/engineering/jee/`. Source URLs are in `data/sources/engineering/jee.json`. Institute metadata and NIRF ranks are in `data/reference/engineering/`.

</details>

<details>
<summary>Can I rely on the data?</summary>

The project transcribes cutoffs from official PDFs and notices. Transcription errors and delayed updates can occur. Each API response includes provenance, including the manifest version and datasets used.

Read [DATA.md](../../DATA.md) for release checks and checksums. Check the official portal before you make an admission decision.

</details>

<details>
<summary>Is eJAM free?</summary>

Yes. The college predictor does not require an account or payment. The source code is under AGPL-3.0-or-later. eJAM is not affiliated with NTA, JoSAA, CSAB, or any institute.

</details>

<details>
<summary>What does the balanced sort do?</summary>

The default score is:

$$
\frac{I}{100} \cdot \frac{B}{100} \cdot P
$$

`I` is institute score. `B` is branch score. `P` is cumulative probability. This score helps with navigation. It is not an official college ranking.

The **Best probability** and **Predicted closing rank** sorts use only their named measures. Read [Balanced ranking](../nerd-stuff/balanced-ranking.md) for the formula.

</details>

<details>
<summary>What do the round bars mean?</summary>

The bars represent JoSAA-style rounds 1 through 6. The height is the cumulative probability through that round. Bars after the program's typical `fill_round` keep the final cumulative value.

The percentage beside the bars is the average cumulative probability from round 1 through `fill_round`.

</details>

## More reading

| Guide                                                           | Description                                |
| --------------------------------------------------------------- | ------------------------------------------ |
| [From rank to results](../how-it-works/from-rank-to-results.md) | Probability bands and closing ranks        |
| [Prediction engine](../nerd-stuff/prediction-engine.md)         | Runtime formulas and round probabilities   |
| [Index algorithms](../nerd-stuff/index-algorithms.md)           | Offline index build                        |
| [Data pipeline](../../DATA.md)                                  | Download, verify, and rebuild data locally |
