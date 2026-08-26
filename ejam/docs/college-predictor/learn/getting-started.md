# Getting started

| Counselling body | When it applies                 | Institutes                     |
| ---------------- | ------------------------------- | ------------------------------ |
| **JoSAA**        | After JEE Main and JEE Advanced | IITs, NITs, IIITs, and GFTIs   |
| **CSAB**         | After JoSAA for vacant seats    | NIT+, IIIT, and CFI institutes |

JoSAA can run up to six rounds. At NITs, `HS` and `OS` depend on the student's domicile and the institute state. The predictor uses a counselling rank, not a percentile or mark.

## Exam routing

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#0A0A0A', 'primaryTextColor': '#FFFFFF', 'primaryBorderColor': '#FFFFFF', 'lineColor': '#F45611', 'nodeBorder': '#FFFFFF', 'mainBkg': '#0A0A0A', 'edgeLabelBackground': 'transparent', 'clusterBkg': 'transparent', 'clusterBorder': 'transparent'}}}%%
flowchart LR
    classDef step fill:#1A1A1A,stroke:#FFF,stroke-width:1.5px,color:#FFF,rx:5px,ry:5px;
    classDef choice fill:#0A0A0A,stroke:#888,stroke-width:1px,stroke-dasharray: 4 4,color:#FFF,rx:5px,ry:5px;
    classDef out fill:#0A0A0A,stroke:#FFF,stroke-width:2px,color:#FFF,rx:15px,ry:15px;

    Open[Open tool]:::step --> Exam{Exam}:::choice
    Exam -->|Main| Body{JoSAA / CSAB}:::choice
    Exam -->|Advanced| IIT[IITs only]:::step
    Body -->|JoSAA| NIT[NIT / IIIT / CFI]:::step
    Body -->|CSAB| Vacant[Vacant seats]:::step
    NIT --> Rank[Rank + profile]:::step
    Vacant --> Rank
    IIT --> Rank
    Rank --> Predict[Predict]:::step
    Predict --> Results([Filter / sort]):::out
```

## Steps

1. Open `/college-predictor`. A shared URL with predictor parameters opens the same route.
2. Select an exam.
   - **JEE Main** uses JoSAA or CSAB. The result includes NIT, IIIT, and CFI institutes.
   - **JEE Advanced** uses IIT data. Quota and home-state fields remain hidden because the tool uses All India seats.
3. Enter the rank and profile.
   - **Rank:** Enter a counselling integer. Do not enter a percentile or mark. The limits are **500,000** for JEE Main and CSAB and **50,000** for JEE Advanced. See [rank limits](../faqs/faqs.md#what-are-the-rank-limits).
   - **Category:** Select General, Gen-EWS, OBC-NCL, SC, or ST.
   - **Gender:** Select Neutral or Female.
   - **JEE Main profile:** Select quota, counselling body, and home state when required.
4. Select **Predict colleges**. The inputs are stored in the URL. A complete URL runs the prediction when it loads.
5. Filter or sort the results. Use institute type, probability band, and long-shot controls. Select a row to view round details.

## Next steps

| Guide                                                           | Content                                     |
| --------------------------------------------------------------- | ------------------------------------------- |
| [What you need to know](what-you-need-to-know.md)               | Rank, category, quota, and institute groups |
| [From rank to results](../how-it-works/from-rank-to-results.md) | Probability bands and closing ranks         |
