# College Predictor

After JEE results, counselling is mostly one question: at this rank, which colleges and branches are actually in play?

Give it a counselling rank plus category, gender, quota, and home state (for NIT pools). It matches that profile against years of **JoSAA** and **CSAB** closing ranks, scores each program with a chance band, and sorts by probability, predicted closing rank, or a balanced mix of institute quality and branch. Planning aid only. Not official allotment.

`/college-predictor`

## Contents

| Section | Purpose |
| --- | --- |
| [Learn](#learn) | First run and inputs |
| [How it works](#how-it-works) | Pipeline, rank → chance, bands |
| [Nerd stuff](#nerd-stuff) | Formulas and index build |
| [FAQs](#faqs) | Short answers |

## Learn

| Page | Purpose |
| --- | --- |
| [Getting started](learn/getting-started.md) | Open the tool, pick exam, first prediction |
| [What you need to know](learn/what-you-need-to-know.md) | Rank, quota, GFTI vs CFI, disclaimers |

## How it works

| Page | Purpose |
| --- | --- |
| [From rank to results](how-it-works/from-rank-to-results.md) | Chance, bands, closing rank, sorting |

## Nerd stuff

| Page | Purpose |
| --- | --- |
| [Prediction engine](nerd-stuff/prediction-engine.md) | CDF math, round probabilities, band thresholds |
| [Index algorithms](nerd-stuff/index-algorithms.md) | DuckDB build, `jam-josaa-v3`, `jam-csab-v2` |
| [Backtest](nerd-stuff/backtest.md) | 2025 holdout methodology and metrics |
| [2026 R1–R4 accuracy report](nerd-stuff/2026-rounds-accuracy-report.md) | Mid-counselling holdout vs real 2026 cutoffs |
| [Balanced ranking](nerd-stuff/balanced-ranking.md) | $I \times B \times P$ composite score |

## FAQs

| Page | Purpose |
| --- | --- |
| [FAQs](faqs/faqs.md) | Common questions |

## Full page list

- [Getting started](learn/getting-started.md)
- [What you need to know](learn/what-you-need-to-know.md)
- [Overview](how-it-works/overview.md)
- [From rank to results](how-it-works/from-rank-to-results.md)
- [Prediction engine](nerd-stuff/prediction-engine.md)
- [Index algorithms](nerd-stuff/index-algorithms.md)
- [Backtest](nerd-stuff/backtest.md)
- [2026 R1–R4 accuracy report](nerd-stuff/2026-rounds-accuracy-report.md)
- [Balanced ranking](nerd-stuff/balanced-ranking.md)
- [FAQs](faqs/faqs.md)

[← Back to ejam docs](../README.md)
