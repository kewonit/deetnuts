<p align="center">
  <img src="apps/web/public/media/p-readme-logo.png" alt="ejam" width="600">
</p>

---

<p align="center">
  <a href="docs/README.md">Documentation</a>
  ·
  <a href="CONTRIBUTING.md">Contributing</a>
  ·
  <a href="LICENSE">License</a>
  ·
  <a href="NOTICE">Notice</a>
</p>

<br>

<p align="center">
  <img src="apps/web/public/media/og.png" alt="ejam" width="700">
</p>

<br>

## rant (#`^´)／

Every tool for students online somehow manages to suck. Closed-source. Ads everywhere. "Buy this." "Buy that." Yeah buddy... no thank you.

And then comes the data collection. Like...

**Alakh sir, do you really need my date of birth, phone-number, rank?**

Papa mummy ka bhi DOB dedu? Time of birth bhi chahiye kya? Blood group? Aadhaar bhi le lo sir. 😭

<br>

*oh my fucking god.* these sites squeeze students because they can. So tried to built what I wish existed.
<br>

**For students. From students.**

<br><br><br>

## tools (˶˃ ᵕ ˂˶) .ᐟ.ᐟ

<p align="center">
  <code>ejam</code> / <code>tools</code> / <code>college predictor</code>
</p>

<br>

A college predictor. It takes years of past JoSAA and CSAB closing ranks to estimate what you might actually get. Just a simple tool to save you some headache during counselling. (Will try to add more exams soon, but for now it's just JEE).

<br>

### how it works?

two stages. first we chew through years of counselling data offline (duckdb, so the site stays fast). then when you type your rank, the live bit just reads that index and scores every seat.

<br>

<p align="center">
  <a href="docs/college-predictor/nerd-stuff/index-algorithms.md#predicted-closing-rank"><img src="apps/web/public/tools/p/formulas/r-predicted-closing-rank.svg" alt="[1] predicted closing rank" width="55%" style="vertical-align:middle"></a>
  &nbsp;&nbsp;
  <a href="docs/college-predictor/nerd-stuff/index-algorithms.md#sigma-floor"><img src="apps/web/public/tools/p/formulas/r-sigma-floor.svg" alt="[2] sigma floor" width="40%" style="vertical-align:middle"></a>
</p>

<br>

ok so basically... we already did the heavy lifting offline. took years of josaa/csab cutoffs, weighted recent years higher, trimmed out the covid outliers, and accounted for ranks drifting ~3% every year like they always do.

[**[1]**](docs/college-predictor/nerd-stuff/index-algorithms.md#predicted-closing-rank) is just "where do we think it'll close this year". [**[2]**](docs/college-predictor/nerd-stuff/index-algorithms.md#sigma-floor) is "uhh how wrong could we be". if the old data looks weird we leave more space.

<br>

<p align="center">
  <a href="docs/college-predictor/nerd-stuff/prediction-engine.md#single-round-probability"><img src="apps/web/public/tools/p/formulas/r-single-round-probability.svg" alt="[3] single-round probability" width="30%"></a>
  &nbsp;&nbsp;
  <a href="docs/college-predictor/nerd-stuff/prediction-engine.md#round-by-round-cumulative-chance"><img src="apps/web/public/tools/p/formulas/r-cumulative-probability.svg" alt="[4] cumulative probability" width="30%"></a>
  &nbsp;&nbsp;
  <a href="docs/college-predictor/nerd-stuff/balanced-ranking.md#composite-formula"><img src="apps/web/public/tools/p/formulas/r-balanced-score.svg" alt="[5] balanced score" width="30%"></a>
</p>

<br>

now you enter your rank. [**[3]**](docs/college-predictor/nerd-stuff/prediction-engine.md#single-round-probability) is like... for one round, what's your chance. better rank = higher P.

but counselling has ~6 rounds. so [**[4]**](docs/college-predictor/nerd-stuff/prediction-engine.md#round-by-round-cumulative-chance) adds them up. didn't get it in round 1? maybe round 6 still works.

and please don't flex 99% on a branch nobody wants. so [**[5]**](docs/college-predictor/nerd-stuff/balanced-ranking.md#composite-formula) looks at the college and the branch too. a good nit at 70% should beat some random place at 95%.

<br>

<p align="center">
  <img src="apps/web/public/tools/p/graphs/past-cutoffs-to-prediction.svg" alt="past cutoffs to prediction" width="46%" style="vertical-align:middle">
  &nbsp;&nbsp;
  <img src="apps/web/public/tools/p/graphs/rank-to-chance.svg" alt="rank to chance" width="46%" style="vertical-align:middle">
</p>

<br>

to summarize up, look at the graphs. left shows how past cutoffs turn into this year's **pred**, with the ±σ whisker for uncertainty. right shows your rank r on the chance curve pull across for P, and **Safe** / **Iffy** / **Delulu** are just labels for that number.

<br>

### TL;DR

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#0A0A0A', 'primaryTextColor': '#FFFFFF', 'primaryBorderColor': '#FFFFFF', 'lineColor': '#F45611', 'nodeBorder': '#FFFFFF', 'mainBkg': '#0A0A0A', 'edgeLabelBackground': 'transparent', 'clusterBkg': 'transparent', 'clusterBorder': 'transparent'}}}%%
flowchart LR
    classDef data fill:#0A0A0A,stroke:#888,stroke-width:1px,stroke-dasharray: 4 4,color:#FFF,rx:5px,ry:5px;
    classDef engine fill:#1A1A1A,stroke:#FFF,stroke-width:1.5px,color:#FFF,rx:5px,ry:5px;
    classDef output fill:#0A0A0A,stroke:#FFF,stroke-width:2px,color:#FFF,rx:15px,ry:15px;

    subgraph Offline [ Offline Build ]
        Data[(Past JoSAA/CSAB)]:::data -->|Crunch| Index[DuckDB Index]:::engine
    end

    subgraph Live ["Live Predictor&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"]
        User[/Your Rank Input/]:::data -.-> Engine{Prediction Engine}:::engine
        Index ==> Engine
        Engine -->|Calculate 6 Rounds| Out([Safe / Iffy / Delulu]):::output
    end
```

<br>

<p align="left">
  <a href="docs/README.md"><code><b>Read the full documentation ↗</b></code></a>
</p>

<br><br><br>

## credits [^._.^]ﾉ彡

<p align="center">
  Dashboard layout adapted from <a href="https://efferd.com/">Efferd</a> by <a href="https://x.com/shabanhr">Shaban</a><br>
  Charts adapted from <a href="https://evilcharts.com/">EvilCharts</a> by <a href="https://x.com/legionsdev">Gurbinder</a><br>
  A few illustrations from <a href="https://icons8.com/">Icons8</a>
</p>

<br><br><br>

## sponsors /ᐠ. ｡.ᐟ\ᵐᵉᵒʷˎˊ˗

<p align="center">
  <a href="https://github.com/sponsors/su6u"><img src="apps/web/public/media/sponser.png" alt="No sponsors yet" width="30%"></a>
</p>

Hosting servers and crunching this much data isn't exactly free. If you found these tools useful and want to help keep it running, consider sponsoring. sponsorships go directly toward covering server costs and keeping the site completely ad-free.

<p align="center">
  <a href="https://github.com/sponsors/su6u"><code><b>Sponsor the project 💖</b></code></a>
</p>

<br><br><br>

<p align="center">
  <strong>→ <a href="docs/README.md">Documentation</a></strong>
  ·
  <strong><a href="https://ejam.in/college-predictor">Try College Predictor</a></strong>
  ·
  <strong><a href="https://github.com/su6u/ejam/issues/new?labels=tool-request&title=Tool+request%3A+&body=%23%23+Tool+name%0A%3C%21--+e.g.+NEET+college+predictor+--%3E%0A%0A%0A%23%23+What+should+it+do%3F%0A%3C%21--+What+problem+would+it+solve%3F+A+few+sentences+is+enough.+--%3E%0A%0A%0A%23%23+Who+is+it+for%3F%0A%3C%21--+e.g.+JEE+Main%2C+NEET+UG%2C+counselling+season+--%3E%0A%0A%0A%23%23+Anything+else%3F+%28optional%29%0A%3C%21--+Links%2C+screenshots%2C+or+similar+tools+you+like+--%3E%0A">Request a tool</a></strong>
</p>
