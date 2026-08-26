# College predictor

After JEE results, many students ask which programs may be available at a given rank. The college predictor compares a counselling rank with historical JoSAA and CSAB closing ranks.

Enter the counselling rank, category, gender, quota, and home state when the selected pool requires it. The predictor assigns a probability band and sorts programs by probability, predicted closing rank, or a balanced score. The result is planning information. It is not an official allotment.

Route: `/college-predictor`

## Contents

| Section                                 | Purpose                         |
| --------------------------------------- | ------------------------------- |
| [Learn](#learn)                         | Inputs and first use            |
| [How it works](#how-it-works)           | Probability, bands, and sorting |
| [Technical details](#technical-details) | Formulas and index builds       |
| [FAQs](#faqs)                           | Common questions                |

## Learn

| Page                                                    | Purpose                                             |
| ------------------------------------------------------- | --------------------------------------------------- |
| [Getting started](learn/getting-started.md)             | Open the tool, select an exam, and run a prediction |
| [What you need to know](learn/what-you-need-to-know.md) | Rank, quota, institute groups, and limits           |

## How it works

| Page                                                         | Purpose                                       |
| ------------------------------------------------------------ | --------------------------------------------- |
| [From rank to results](how-it-works/from-rank-to-results.md) | Probability, bands, closing rank, and sorting |

## Technical details

| Page                                                                            | Purpose                                            |
| ------------------------------------------------------------------------------- | -------------------------------------------------- |
| [Prediction engine](nerd-stuff/prediction-engine.md)                            | Probability, round calculations, and thresholds    |
| [Index algorithms](nerd-stuff/index-algorithms.md)                              | DuckDB builds and index versions                   |
| [Backtest](nerd-stuff/backtest.md)                                              | Holdout method and metrics                         |
| [2026 rounds 1 to 4 accuracy report](nerd-stuff/2026-rounds-accuracy-report.md) | Mid-counselling evaluation against 2026 cutoffs    |
| [Balanced ranking](nerd-stuff/balanced-ranking.md)                              | Composite institute, branch, and probability score |

## FAQs

| Page                 | Purpose          |
| -------------------- | ---------------- |
| [FAQs](faqs/faqs.md) | Common questions |

## Full page list

- [Getting started](learn/getting-started.md)
- [What you need to know](learn/what-you-need-to-know.md)
- [From rank to results](how-it-works/from-rank-to-results.md)
- [Prediction engine](nerd-stuff/prediction-engine.md)
- [Index algorithms](nerd-stuff/index-algorithms.md)
- [Backtest](nerd-stuff/backtest.md)
- [2026 rounds 1 to 4 accuracy report](nerd-stuff/2026-rounds-accuracy-report.md)
- [Balanced ranking](nerd-stuff/balanced-ranking.md)
- [FAQs](faqs/faqs.md)

[Back to eJAM documentation](../README.md)
