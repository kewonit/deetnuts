<p align="center">
  <img src="apps/web/public/media/p-readme-logo.png" alt="eJAM" width="600">
</p>

<p align="center">
  <a href="docs/README.md">Documentation</a>
  ·
  <a href="CONTRIBUTING.md">Contributing</a>
  ·
  <a href="LICENSE">License</a>
  ·
  <a href="NOTICE">Notice</a>
</p>

<p align="center">
  <img src="apps/web/public/media/og.png" alt="eJAM college predictor" width="700">
</p>

## Purpose

eJAM provides open-source tools for students who compare engineering admission options. The project uses historical counselling data and shows the calculations that produce each result.

The tools do not replace official counselling portals. Check current eligibility rules, seat availability, and published cutoffs before you submit choices.

## College predictor

The college predictor uses historical JoSAA and CSAB closing ranks to estimate which programs may be available at a submitted rank. It accepts the counselling rank, exam, counselling body, category, gender, quota, and home state when the selected pool requires it.

Each result includes a predicted closing rank, a probability band, and the data-quality label for the supporting history. The result is planning information. It is not an official allotment or a guarantee.

## Processing model

The predictor has two stages:

1. An offline build reads cutoff data, applies the index rules, and writes a queryable index.
2. A request reads the matching index rows and calculates the probability for each program.

The offline build applies recency weights, round weights, trend limits, and uncertainty limits. The request does not train a model or fetch new cutoff data.

<p align="center">
  <a href="docs/college-predictor/nerd-stuff/index-algorithms.md#predicted-closing-rank"><img src="apps/web/public/tools/p/formulas/r-predicted-closing-rank.svg" alt="Predicted closing rank formula" width="55%" style="vertical-align:middle"></a>
  &nbsp;&nbsp;
  <a href="docs/college-predictor/nerd-stuff/index-algorithms.md#sigma-floor"><img src="apps/web/public/tools/p/formulas/r-sigma-floor.svg" alt="Uncertainty floor formula" width="40%" style="vertical-align:middle"></a>
</p>

## Probability and ranking

For each counselling round, the predictor compares the submitted rank with the predicted closing rank. A lower rank number is better. The predictor then combines the round probabilities into one cumulative probability.

The default result order uses the balanced score. This score combines institute score, branch score, and cumulative probability. You can also sort by probability, predicted closing rank, or institute.

<p align="center">
  <a href="docs/college-predictor/nerd-stuff/prediction-engine.md#single-round-probability"><img src="apps/web/public/tools/p/formulas/r-single-round-probability.svg" alt="Single-round probability formula" width="30%"></a>
  &nbsp;&nbsp;
  <a href="docs/college-predictor/nerd-stuff/prediction-engine.md#round-by-round-cumulative-chance"><img src="apps/web/public/tools/p/formulas/r-cumulative-probability.svg" alt="Cumulative probability formula" width="30%"></a>
  &nbsp;&nbsp;
  <a href="docs/college-predictor/nerd-stuff/balanced-ranking.md#composite-formula"><img src="apps/web/public/tools/p/formulas/r-balanced-score.svg" alt="Balanced score formula" width="30%"></a>
</p>

The interface displays four probability labels. The internal keys remain stable for API compatibility.

| Display label | Internal key    | Probability        |
| ------------- | --------------- | ------------------ |
| Likely        | `safe`          | `P >= 0.85`        |
| Possible      | `iffy`          | `0.40 <= P < 0.85` |
| Unlikely      | `delulu`        | `0.10 <= P < 0.40` |
| Very unlikely | `doesnt-matter` | `P < 0.10`         |

Results below 10 percent are hidden by default. Select **Show very unlikely results** to include them.

<p align="center">
  <img src="apps/web/public/tools/p/graphs/past-cutoffs-to-prediction.svg" alt="Historical cutoffs and predicted closing rank" width="46%" style="vertical-align:middle">
  &nbsp;&nbsp;
  <img src="apps/web/public/tools/p/graphs/rank-to-chance.svg" alt="Rank and probability relationship" width="46%" style="vertical-align:middle">
</p>

## Documentation

Read the [full documentation](docs/README.md) for the data release process, predictor inputs, formulas, index builders, and evaluation reports.

## Credits

The dashboard layout is adapted from [Efferd](https://efferd.com/) by [Shaban](https://x.com/shabanhr). The charts are adapted from [EvilCharts](https://evilcharts.com/) by [Gurbinder](https://x.com/legionsdev). Some illustrations come from [Icons8](https://icons8.com/).

## Sponsorship

Hosting and data processing have operating costs. If these tools help you, you can [sponsor the project](https://github.com/sponsors/su6u). Sponsorship supports server costs and keeps the site free of advertising.

<p align="center">
  <a href="https://github.com/sponsors/su6u"><code><b>Sponsor the project</b></code></a>
</p>

<p align="center">
  <strong><a href="docs/README.md">Documentation</a></strong>
  ·
  <strong><a href="https://ejam.in/college-predictor">Try the college predictor</a></strong>
  ·
  <strong><a href="https://github.com/su6u/ejam/issues/new?labels=tool-request&title=Tool+request%3A+&body=%23%23+Tool+name%0A%3C%21--+e.g.+NEET+college+predictor+--%3E%0A%0A%0A%23%23+What+should+it+do%3F%0A%3C%21--+What+problem+would+it+solve%3F+A+few+sentences+is+enough.+--%3E%0A%0A%0A%23%23+Who+is+it+for%3F%0A%3C%21--+e.g.+JEE+Main%2C+NEET+UG%2C+counselling+season+--%3E%0A%0A%0A%23%23+Anything+else%3F+%28optional%29%0A%3C%21--+Links%2C+screenshots%2C+or+similar+tools+you+like+--%3E%0A">Request a tool</a></strong>
</p>
