# 2026 JoSAA rounds 1 to 4 accuracy report

This report evaluates `jam-josaa-v3` against 2026 JoSAA closing ranks. The model trained only on data through 2025. The evaluation uses actual 2026 rounds 1 through 4.

This report does not predict an admission outcome. Counselling continues through rounds 5 and 6. The results show how often a predicted closing rank falls near the observed closing rank.

**Date:** 2026-07-11

**Algorithm:** `jam-josaa-v3`

## Summary

Round 4 uses the same historical round path as the interface round bars.

| Measure                                                   |                                 Result |
| --------------------------------------------------------- | -------------------------------------: |
| Matched seats                                             | **10,096** of 12,548, about 81 percent |
| Prediction within 20 percent of the observed closing rank |                              **73.1%** |
| Prediction within 10 percent                              |                              **45.1%** |
| Median absolute error                                     |                          **468 ranks** |
| Median percentage error                                   |                              **11.3%** |

The prediction falls within 20 percent for about three of every four matched seats. The remaining results include disability seats, home-state seats, new seats, and highly competitive seats.

The main predicted closing rank is within 20 percent of the round 4 closing rank for 74.3 percent of matched seats. The 2025 final backtest reached 73.9 percent.

## Method

### Training and test data

| Set      | Data                                | Function                      |
| -------- | ----------------------------------- | ----------------------------- |
| Training | All JoSAA cutoffs with year <= 2025 | Build the production index    |
| Test     | 2026 rounds 1 to 4                  | Supply observed closing ranks |

One seat key contains `(institute, program, seat_type, quota, gender)`.

The training step excludes all 2026 data. The live site can later rebuild the index with 2026 data. This report intentionally freezes training at 2025.

### Prediction types

| Name                                    | Description                                                     | Used by the live site                                  |
| --------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| **A** historical `roundN_mean`          | Weighted average of the historical closing ranks for that round | Yes. The interface uses it for round probability bars. |
| **B** A with pool and trend adjustment  | Type A plus the annual pool shift and trend                     | No. This is an evaluation variant.                     |
| **C** headline `predicted_closing_rank` | Final-round forecast with higher late-round weights             | Yes. The interface displays it as the main forecast.   |

Type A is the fairest test for the corresponding round. Type C targets the final closing rank, so an early-round comparison is less direct.

### Metrics

For each seat, let `c_hat` be the predicted closing rank and `a` be the observed closing rank.

Rank error:

$$
\text{error} = |\hat{c} - a|
$$

Percentage error:

$$
\text{APE} = \frac{|\hat{c} - a|}{a}
$$

A within-20-percent hit has `APE <= 0.20`. For example, an observed closing rank of 10,000 accepts a prediction from 8,000 through 12,000.

Median absolute error and median APE show the middle error. They reduce the effect of outliers that can distort an average.

Bias is the average of `(c_hat - a) / a`.

- Positive bias means the prediction gives a higher closing-rank number.
- Negative bias means the prediction gives a lower closing-rank number.

### Probability bands

The predictor calculates probability as follows:

$$
P = \Phi\left(\frac{\hat{c} - r}{\sigma}\right)
$$

`r` is the submitted student rank. `sigma` is `sigma_effective`, the uncertainty value.

- A better submitted rank has a smaller number. It increases `P`.
- A worse submitted rank has a larger number. It decreases `P`.

| Display label | Internal key    | Probability         |
| ------------- | --------------- | ------------------- |
| Likely        | `safe`          | At least 85 percent |
| Possible      | `iffy`          | At least 40 percent |
| Unlikely      | `delulu`        | At least 10 percent |
| Very unlikely | `doesnt-matter` | Below 10 percent    |

A close prediction and a high applicant probability are different measures. For example, the model predicted 3,301 for IIT Patna Computer Science and Engineering with OPEN and All India seats. The observed closing rank was 3,305. A student rank of 3,457 still has an estimated probability near 24 percent because the rank is worse than the closing rank.

A probability-band boundary hit sets the submitted rank equal to the observed closing rank. It then checks whether the label is Likely or Possible. This is not a test of a random applicant's label.

## 2026 data coverage

| Round | Observed seats | Matched to history |  Coverage |
| ----- | -------------: | -----------------: | --------: |
| 1     |          9,233 |              7,295 | **79.0%** |
| 2     |         12,623 |             10,234 | **81.1%** |
| 3     |         12,568 |             10,205 | **81.2%** |
| 4     |         12,548 |             10,195 | **81.2%** |

About one in five 2026 seats has no matching training key. These seats are not included in the accuracy tables.

Round 1 has fewer institutes than rounds 2 through 4. Round 1 has 114 institutes. Later rounds have 132.

The training index for this run contains 19,401 seat keys from years through 2025.

## Round-level scores

Type A compares historical `roundN_mean` with the observed 2026 round N.

| Round | Matched | Within 5% | Within 10% | Within 15% | Within 20% | Within 30% | Median error, ranks | Median error |  Bias | Band hit |
| ----- | ------: | --------: | ---------: | ---------: | ---------: | ---------: | ------------------: | -----------: | ----: | -------: |
| **1** |   7,222 |     23.6% |      46.1% |      64.3% |  **75.9%** |      86.1% |                 351 |        10.9% | +2.4% |    36.8% |
| **2** |   8,708 |     21.8% |      42.7% |      59.6% |  **71.0%** |      82.4% |                 486 |        12.1% | +2.9% |    37.4% |
| **3** |   9,439 |     23.1% |      45.3% |      62.1% |  **72.9%** |      84.1% |                 463 |        11.3% | +3.0% |    39.5% |
| **4** |  10,096 |     23.3% |      45.1% |      62.2% |  **73.1%** |      84.8% |                 468 |        11.3% | +3.3% |    39.7% |

Within-20-percent accuracy remains in the low to middle 70 percent range across the four rounds. The median percentage error is about 11 percent. The positive bias ranges from 2 to 3 percent.

The probability-band hit rate at the exact closing rank is about 37 to 40 percent. A rank that is clearly better than the predicted closing rank receives a higher probability more often.

### Type B with pool and trend adjustment

Type B applies the same 3 percent annual pool shift used by the headline forecast. It improves within-20-percent accuracy in this evaluation.

| Round | Type A |    Type B | Change |
| ----- | -----: | --------: | -----: |
| 1     |  75.9% | **77.4%** |   +1.5 |
| 2     |  71.0% | **72.7%** |   +1.7 |
| 3     |  72.9% | **74.0%** |   +1.1 |
| 4     |  73.1% | **74.3%** |   +1.2 |

The live site uses Type A for the round bars.

### Type C against each round

| Round | Headline within 20% | Note                                                      |
| ----- | ------------------: | --------------------------------------------------------- |
| 1     |               69.0% | The headline targets the final round. Round 1 is early.   |
| 2     |               74.3% |                                                           |
| 3     |               74.4% |                                                           |
| 4     |           **74.3%** | The closest mid-season comparison for the headline value. |

Against round 1, the headline bias is +21 percent. Against round 4, it is +10 percent. Later rounds can still change the final closing rank.

## Round 4 details

The following tables use the latest official cutoffs in the report. They use Type A unless the table says otherwise.

### Institute type

| Type     |     N | Within 10% | Within 20% | Median error, ranks | Median error |  Bias | Band hit |
| -------- | ----: | ---------: | ---------: | ------------------: | -----------: | ----: | -------: |
| **IIT**  | 2,791 |      55.4% |  **80.3%** |                 149 |         8.9% | +0.9% |    37.8% |
| **IIIT** |   879 |      39.2% |  **78.0%** |                 712 |        12.8% | -6.5% |    26.4% |
| **CFI**  | 1,028 |      30.0% |  **74.9%** |               1,863 |        13.9% | -8.0% |    20.0% |
| **NIT**  | 5,398 |      43.2% |  **68.0%** |                 645 |        12.2% | +8.7% |    45.6% |

Headline value against round 4 by institute type:

| Type |     N | Within 20% | Median error |   Bias |
| ---- | ----: | ---------: | -----------: | -----: |
| IIT  | 2,801 |  **79.8%** |         7.6% |  +7.1% |
| IIIT |   891 |  **82.9%** |         9.0% |  -0.7% |
| CFI  | 1,039 |  **82.0%** |         9.4% |  -1.9% |
| NIT  | 5,464 |  **68.7%** |        11.2% | +15.7% |

### Seat type

| Seat type    |     N | Within 20% | Median error | Description                  |
| ------------ | ----: | ---------: | -----------: | ---------------------------- |
| OPEN         | 1,999 |  **83.2%** |         9.8% | Largest strong group         |
| OBC-NCL      | 1,837 |  **82.6%** |         9.8% |                              |
| SC           | 1,802 |  **80.4%** |         9.6% |                              |
| EWS          | 1,646 |  **80.2%** |         9.9% |                              |
| ST           | 1,571 |  **63.9%** |        13.8% | Less historical data         |
| OPEN, PwD    |   650 |  **31.1%** |        31.1% | Percentage error is unstable |
| OBC-NCL, PwD |   364 |  **42.6%** |        23.3% |                              |
| EWS, PwD     |   114 |  **37.7%** |        32.3% |                              |

Non-PwD seats reach about 78.5 percent within 20 percent for 8,855 seats. PwD seats reach about 34.3 percent for 1,241 seats.

Percentage error is unstable for PwD seats. A closing rank of 1 and a prediction of 30 produces a 30 times error, although the absolute difference is 29 ranks. Use absolute rank error for these seats.

### Quota

| Quota |     N | Within 20% | Median error | Band hit |
| ----- | ----: | ---------: | -----------: | -------: |
| AI    | 4,507 |  **78.3%** |        10.7% |    31.6% |
| OS    | 2,920 |  **77.0%** |         9.6% |    41.6% |
| HS    | 2,556 |  **60.7%** |        15.2% |    51.1% |
| JK    |    72 |      45.8% |        21.2% |    47.2% |
| GO    |    27 |      33.3% |        35.5% |    63.0% |
| LA    |    14 |      50.0% |        19.9% |    92.9% |

HS is difficult to forecast because demand can change by state each year. AI and OS are more stable in this report.

### Gender

| Gender                               |     N | Within 20% | Median error |
| ------------------------------------ | ----: | ---------: | -----------: |
| Gender-Neutral                       | 6,331 |      73.0% |        11.5% |
| Female-only, including supernumerary | 3,765 |      73.3% |        10.9% |

The two gender groups have similar results in this report.

### Closing-rank tier

The tier uses the observed 2026 round 4 closing rank.

| Tier                 |     N | Within 20% | Median error, ranks | Median error | Band hit |
| -------------------- | ----: | ---------: | ------------------: | -----------: | -------: |
| Elite, <= 500        | 1,134 |  **37.3%** |                  44 |        28.6% |    58.7% |
| Top, <= 2,000        | 1,832 |      64.6% |                 147 |        12.8% |    50.3% |
| Mid, <= 10,000       | 3,858 |  **81.2%** |                 432 |         9.1% |    38.6% |
| Lower-mid, <= 50,000 | 2,630 |  **82.5%** |               1,913 |        10.4% |    29.4% |
| High, <= 150,000     |   537 |  **78.8%** |               8,257 |        12.0% |    21.4% |
| Very high, > 150,000 |   105 |      44.8% |              71,991 |        23.4% |    41.9% |

The strongest results occur between about 2,000 and 150,000. Percentage error looks high for elite seats because a small absolute error can be large relative to a small closing rank.

### Data history

| Data quality |     Years |     N | Within 20% | Median error |
| ------------ | --------: | ----: | ---------: | -----------: |
| Sufficient   | 3 or more | 8,628 |  **74.3%** |        10.9% |
| Inferred     |         2 |   791 |      61.9% |        14.6% |
| Pooled       |         1 |   677 |      70.3% |        12.7% |

Rows with more history perform better in this report. Rows with limited history have more uncertainty.

## Headline value against round 4

This is the best mid-season comparison for the main predicted closing rank.

| Measure                       |                             Value |
| ----------------------------- | --------------------------------: |
| Matched                       |                            10,195 |
| Within 5%, 10%, 20%, and 30%  | 28.9% / 51.6% / **74.3%** / 84.2% |
| Median error                  |                         400 ranks |
| Median percentage error       |                              9.6% |
| Mean bias                     |                        **+10.1%** |
| Probability-band boundary hit |                             54.8% |

The headline value has a +10 percent bias against round 4. Later rounds can still change the final result. Re-run this evaluation after rounds 5 and 6.

## Probability labels

### Single-round label at the exact closing rank

Set the submitted rank to the observed round 4 closing rank. Use the historical `round4_mean` and `sigma`.

| Display label          |     Share |
| ---------------------- | --------: |
| Likely                 |     16.7% |
| Possible               |     23.1% |
| Unlikely               |     21.1% |
| Very unlikely          |     39.2% |
| **Likely or Possible** | **39.7%** |

### Full cumulative probability

This value comes from `computeRoundProbs` and the average across rounds 1 through `fill_round`.

| Measure            |             Value |
| ------------------ | ----------------: |
| Samples            |            10,195 |
| Mean probability   | **0.440**, or 44% |
| Likely or Possible |         **50.3%** |

| Institute type | Mean probability | Likely or Possible |
| -------------- | ---------------: | -----------------: |
| IIT            |            0.480 |              55.0% |
| NIT            |            0.481 |              55.1% |
| IIIT           |            0.320 |              36.3% |
| CFI            |            0.222 |              24.0% |

At the exact closing rank, the tool often gives a cautious result. About half of the rows are Likely or Possible. The rest are Unlikely or Very unlikely. This behavior follows from the uncertainty value.

A rank that is clearly better than the predicted closing rank receives a higher probability. A good closing-rank forecast does not provide a high probability for every student.

## Round movement

The following table compares seats present in both actual round 1 and round 4 data. The sample contains 7,031 seats with both `round1_mean` and `round4_mean`.

| Measure             | Median movement from R1 to R4 | Mean movement |
| ------------------- | ----------------------------: | ------------: |
| **Observed 2026**   |                     **+4.3%** |        +11.7% |
| **Historical path** |                     **+7.3%** |        +12.7% |

The historical path expected more movement than observed 2026 data. This contributes to the cautious Type A result.

## Error cases

The largest percentage errors usually occur at small closing ranks. Common examples include PwD, architecture, and female-only ST seats.

$$
\mathrm{APE} = \frac{|\hat{c} - a|}{a}
$$

| Example                                        | Predicted | Observed | APE |
| ---------------------------------------------- | --------: | -------: | --: |
| NIT Calicut, Architecture, OPEN, PwD, OS       |        59 |        1 | 58x |
| NIT Calicut, Architecture, ST, HS, Female      |       680 |       14 | 48x |
| IIT Hyderabad, Electrical, EWS, PwD, AI        |        28 |        1 | 27x |
| IIT Madras, Engineering Physics, OPEN, PwD, AI |       258 |       10 | 25x |

These cases show why percentage error must be read with absolute error. A small closing rank can make a small rank difference appear very large as a percentage.

The report also contains exact predictions. Examples include IIT Bombay Computer Science and Engineering, OPEN, AI, with `66` predicted and `66` observed, and IIT Delhi Electrical, OPEN, AI, with `599` predicted and `599` observed.

### Weak areas

1. PwD seats reach about 34 percent within 20 percent. Use absolute rank error.
2. Elite seats have high percentage error even when the absolute error is small.
3. HS quotas reach 60.7 percent within 20 percent in this report.
4. Non-PwD ST seats reach 63.9 percent within 20 percent.
5. NIT results include many HS seats and branch groups.
6. Ranks above 150,000 have thin and variable history.

### Strong areas

1. IIT AI seats in the middle rank tiers.
2. AI and OS quotas.
3. Non-PwD seats with at least three years of data.
4. Closing ranks between about 2,000 and 150,000.

## Comparison with earlier holdouts

| Evaluation                            | Ground truth     | Within 20% | Band boundary hit | Matched |
| ------------------------------------- | ---------------- | ---------: | ----------------: | ------: |
| [2025 final](backtest.md)             | 2025 final round |  **73.9%** |             50.7% |  11,069 |
| This report, round 4 Type A           | 2026 round 4     |  **73.1%** |             39.7% |  10,096 |
| This report, headline against round 4 | 2026 round 4     |  **74.3%** |             54.8% |  10,195 |

Within-20-percent accuracy is similar across these evaluations. The Type A boundary result is lower because it uses round means without the pool shift and because round 4 is not final.

## Limitations

1. Counselling is not complete. Re-run the report after rounds 5 and 6.
2. The headline value is not a direct test against round 1.
3. Coverage is about 81 percent. Unmatched seats are not included.
4. Percentage error is unstable for small ranks. Also check median absolute error.
5. A band boundary hit does not mean that every student received the correct label.
6. The live index can change when the project adds 2026 data.
7. This report covers JoSAA only. It does not cover CSAB.

## Guidance for students

- Treat the results as planning information, not an allotment.
- Treat bands as directional for PwD seats, HS-only NIT seats, ST seats, and elite seats below rank 500.
- Check the official cutoff table for the relevant year and round.
- Recheck this report after rounds 5 and 6.

## Related documents

| Topic              | Document                                  |
| ------------------ | ----------------------------------------- |
| Index build        | [Index algorithms](index-algorithms.md)   |
| Probability bands  | [Prediction engine](prediction-engine.md) |
| 2025 final holdout | [Backtest](backtest.md)                   |

## Changelog

| Date       | Change                                                          |
| ---------- | --------------------------------------------------------------- |
| 2026-07-11 | Added the 2026 rounds 1 to 4 holdout report for `jam-josaa-v3`. |
