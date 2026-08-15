# 2026 JoSAA rounds 1-4 accuracy report

ok so we took the real algo (`jam-josaa-v3`), trained it only on old data (upto 2025), and checked how close it got to **actual 2026 JoSAA closing ranks** for rounds 1, 2, 3, and 4.

simple idea: hide 2026 from the model, let it guess, then open the real cutoffs and see how bad (or good) we are.

> this is **not** a promise you will get that college. counselling is still going (r5/r6 not out yet). these numbers are about how often the predicted closing rank lands near the real one.

**when:** 2026-07-11
**algo:** `jam-josaa-v3`

---

## tl;dr

round 4, using the same path the website uses for round bars:

| thing | number |
| --- | --- |
| seats we could match | **10,096** out of 12,548 (~81%) |
| prediction within ±20% of real close | **73.1%** |
| within ±10% | **45.1%** |
| typical miss (median) | **468 ranks** |
| typical miss in % (median) | **11.3%** |

so roughly: **3 out of 4 seats** we get within 20%. the other 1 out of 4 is where stuff gets messy (PwD, home state, brand new seats, ultra top ranks).

the big "predicted closing rank" number on the site vs round 4 actual: also **74.3%** within ±20%. same vibe as the [2025 final backtest](backtest.md) (that was 73.9%).

---

## what we actually did

### train vs test

| side | data | job |
| --- | --- | --- |
| train | all JoSAA cutoffs with year ≤ 2025 | build the index like production does |
| test | 2026 rounds 1-4 | real `closing_rank` from JoSAA |

one seat = one key: `(institute, program, seat_type, quota, gender)`.

we did **not** let 2026 data leak into training. the live site might later rebuild with 2026 rounds in. this report freezes training at 2025 on purpose.

### three kinds of "prediction" we scored

| name | what it is | on the live site? |
| --- | --- | --- |
| **A** historical `roundN_mean` | average of that round's past closing ranks (recent years count more) | **yes** (round probability bars) |
| **B** A + pool/trend nudge | same as A, but add the yearly pool shift (+3%) and trend | no, just a what-if |
| **C** headline `predicted_closing_rank` | the big final-ish number (weights late rounds hard) | **yes** (main predicted close) |

A is the fairest check for "did round 3 look right".
C is aiming at **final** close, so comparing C to round 1 is kinda unfair. comparing C to round 4 is ok-ish as a mid-season peek.

### the maths (kept simple)

for each seat we have:

- $\hat{c}$ = what we predicted
- $a$ = what actually closed

**how far off (in ranks):**

$$
\text{error} = |\hat{c} - a|
$$

**how far off (in %):**

$$
\text{APE} = \frac{|\hat{c} - a|}{a}
$$

**±20% hit** means APE ≤ 0.20. example: real close 10,000, we said anything from 8,000 to 12,000 counts as a hit.

**median AE / median APE** = the middle miss if you line all misses up. less drama than averages (outliers don't wreck it as much).

**bias** = average of $(\hat{c} - a) / a$

- bias **positive** → we usually predicted a **later** close (higher rank number)
- bias **negative** → we usually predicted an **earlier** close (tighter)

**chance / band maths** (what safe / iffy / delulu come from):

$$
P = \Phi\left(\frac{\hat{c} - r}{\sigma}\right)
$$

where $r$ is the student rank and $\sigma$ is uncertainty (`sigma_effective`).

- your rank **better** than predicted close (smaller number) → $P$ goes up → safe/iffy
- your rank **worse** than predicted close → $P$ goes down → delulu / doesn't-matter

bands:

| band | P |
| --- | --- |
| safe | ≥ 85% |
| iffy | ≥ 40% |
| delulu | ≥ 10% |
| doesn't-matter | < 10% |

**important:** nailing the closing rank and getting a high chance are different things.

example from this run: IIT Patna CSE OPEN AI

- we predicted close **3301**, real was **3305** (miss of 4 ranks, 0.1%). great.
- student at **3457** still gets ~24% → **delulu**, because 3457 is past 3305. you would not have got that seat. the band is about *you*, not about "was the cutoff guess good".

**band boundary hit** = pretend the student rank *is* the actual close, then check if band is safe or iffy. hard test. not the same as "random student got the right label".

---

## how much 2026 data we covered

| round | real seats | matched to our history | coverage |
| --- | --- | --- | --- |
| 1 | 9,233 | 7,295 | **79.0%** |
| 2 | 12,623 | 10,234 | **81.1%** |
| 3 | 12,568 | 10,205 | **81.2%** |
| 4 | 12,548 | 10,195 | **81.2%** |

about **1 in 5** 2026 seats have no twin in training (new combo / thin history). those are out of the accuracy tables.

round 1 had fewer institutes (114) than rounds 2-4 (132). that's why R1 is smaller.

training index for this run: **19,401** seat keys from year ≤ 2025.

---

## per-round scores (path A = what the UI round bars use)

historical `roundN_mean` vs real 2026 round N:

| round | matched | ±5% | ±10% | ±15% | ±20% | ±30% | median miss (ranks) | median miss % | bias | band hit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **1** | 7,222 | 23.6% | 46.1% | 64.3% | **75.9%** | 86.1% | 351 | 10.9% | +2.4% | 36.8% |
| **2** | 8,708 | 21.8% | 42.7% | 59.6% | **71.0%** | 82.4% | 486 | 12.1% | +2.9% | 37.4% |
| **3** | 9,439 | 23.1% | 45.3% | 62.1% | **72.9%** | 84.1% | 463 | 11.3% | +3.0% | 39.5% |
| **4** | 10,096 | 23.3% | 45.1% | 62.2% | **73.1%** | 84.8% | 468 | 11.3% | +3.3% | 39.7% |

how to read that:

- ±20% hangs around the **low/mid 70s** for all four rounds. not falling apart as rounds go.
- typical miss is about **11%**. not wild.
- bias a bit positive (+2 to +3%). on average we say the seat closes a little later than it did.
- band hit at the exact close is only ~37-40%. sitting *exactly* on the cutoff is the hard case (wide $\sigma$, round means have no pool shift). if your rank is clearly better than the predicted close, safe shows up a lot more.

### path B (pool+trend on round means, not live)

same +3%/year pool shift the headline uses. bumps ±20% a little:

| round | A (live) ±20% | B (nudged) ±20% | change |
| --- | --- | --- | --- |
| 1 | 75.9% | **77.4%** | +1.5 |
| 2 | 71.0% | **72.7%** | +1.7 |
| 3 | 72.9% | **74.0%** | +1.1 |
| 4 | 73.1% | **74.3%** | +1.2 |

site still uses A. B is just "hey this might help later".

### path C (headline number vs that round)

| round | headline ±20% vs that round | note |
| --- | --- | --- |
| 1 | 69.0% | expected worse. headline wants final, R1 is early |
| 2 | 74.3% | |
| 3 | 74.4% | |
| 4 | **74.3%** | best mid-season check for the big number |

vs R1, headline bias is **+21%** (way too late-looking for early rounds).
vs R4 it cools to **+10%**. still a bit late, which is fine if r5/r6 still open up.

---

## round 4 deep dive

most recent official cutoffs we have. path A unless said otherwise.

### by college type

| type | n | ±10% | ±20% | median miss (ranks) | median miss % | bias | band hit |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **IIT** | 2,791 | 55.4% | **80.3%** | 149 | 8.9% | +0.9% | 37.8% |
| **IIIT** | 879 | 39.2% | **78.0%** | 712 | 12.8% | -6.5% | 26.4% |
| **CFI** | 1,028 | 30.0% | **74.9%** | 1,863 | 13.9% | -8.0% | 20.0% |
| **NIT** | 5,398 | 43.2% | **68.0%** | 645 | 12.2% | +8.7% | 45.6% |

IITs are the cleanest. NITs are most of the volume and the softest, mostly because of home-state (HS) chaos.

headline number vs R4 by type:

| type | n | ±20% | median miss % | bias |
| --- | --- | --- | --- | --- |
| IIT | 2,801 | **79.8%** | 7.6% | +7.1% |
| IIIT | 891 | **82.9%** | 9.0% | -0.7% |
| CFI | 1,039 | **82.0%** | 9.4% | -1.9% |
| NIT | 5,464 | **68.7%** | 11.2% | +15.7% |

### by seat type

| seat | n | ±20% | median miss % | vibe |
| --- | --- | --- | --- | --- |
| OPEN | 1,999 | **83.2%** | 9.8% | best big bucket |
| OBC-NCL | 1,837 | **82.6%** | 9.8% | |
| SC | 1,802 | **80.4%** | 9.6% | |
| EWS | 1,646 | **80.2%** | 9.9% | |
| ST | 1,571 | **63.9%** | 13.8% | thinner history |
| OPEN (PwD) | 650 | **31.1%** | 31.1% | % maths goes crazy |
| OBC-NCL (PwD) | 364 | **42.6%** | 23.3% | |
| EWS (PwD) | 114 | **37.7%** | 32.3% | |

non-PwD: about **78.5%** ±20% (n=8,855).
PwD: about **34.3%** ±20% (n=1,241).

PwD is the clearest fail mode for **%** error. if the seat closes at rank 1 and we say 30, that looks like 30× wrong even if absolute miss is tiny. don't trust % on PwD. look at absolute ranks.

### by quota

| quota | n | ±20% | median miss % | band hit |
| --- | --- | --- | --- | --- |
| AI | 4,507 | **78.3%** | 10.7% | 31.6% |
| OS | 2,920 | **77.0%** | 9.6% | 41.6% |
| HS | 2,556 | **60.7%** | 15.2% | 51.1% |
| JK | 72 | 45.8% | 21.2% | 47.2% |
| GO | 27 | 33.3% | 35.5% | 63.0% |
| LA | 14 | 50.0% | 19.9% | 92.9% |

**home state (HS) is hard.** demand jumps around by state every year. AI/OS are more stable.

### by gender

| gender | n | ±20% | median miss % |
| --- | --- | --- | --- |
| Gender-Neutral | 6,331 | 73.0% | 11.5% |
| Female-only (incl. supernumerary) | 3,765 | 73.3% | 10.9% |

basically the same. gender is not the weak spot.

### by how competitive the seat is

tier = **actual** 2026 R4 closing rank.

| tier | n | ±20% | median miss (ranks) | median miss % | band hit |
| --- | --- | --- | --- | --- | --- |
| elite ≤500 | 1,134 | **37.3%** | 44 | 28.6% | 58.7% |
| top ≤2k | 1,832 | 64.6% | 147 | 12.8% | 50.3% |
| mid ≤10k | 3,858 | **81.2%** | 432 | 9.1% | 38.6% |
| lower-mid ≤50k | 2,630 | **82.5%** | 1,913 | 10.4% | 29.4% |
| high ≤150k | 537 | **78.8%** | 8,257 | 12.0% | 21.4% |
| very high >150k | 105 | 44.8% | 71,991 | 23.4% | 41.9% |

sweet spot is about **2k to 150k**.

elite looks ugly on % because missing by 50 ranks when the close is 100 = 50% error. median miss is still only **44 ranks**. useful for counselling. just don't freak out at the %.

### by how much history we had

| data_quality | years | n | ±20% | median miss % |
| --- | --- | --- | --- | --- |
| sufficient | ≥3 | 8,628 | **74.3%** | 10.9% |
| inferred | 2 | 791 | 61.9% | 14.6% |
| pooled | 1 | 677 | 70.3% | 12.7% |

more years = better. thin history is noisier but not garbage.

---

## headline number vs round 4

best mid-season answer to "is our main predicted close near reality yet?"

| metric | value |
| --- | --- |
| matched | 10,195 |
| ±5% / ±10% / ±20% / ±30% | 28.9% / 51.6% / **74.3%** / 84.2% |
| median miss | 400 ranks |
| median miss % | 9.6% |
| mean bias | **+10.1%** (we predict later than R4) |
| band boundary hit | 54.8% |

+10% bias vs R4 is expected if later rounds still move. after r5/r6, re-run and stack it next to the [2025 final holdout](backtest.md) (73.9% ±20% on 11,069 seats).

---

## bands and probability (are the labels sane?)

### single-round band at the exact close (path A, R4)

set student rank = actual R4 close. use historical `round4_mean` + $\sigma$.

| band | share |
| --- | --- |
| safe | 16.7% |
| iffy | 23.1% |
| delulu | 21.1% |
| doesn't-matter | 39.2% |
| **safe or iffy** | **39.7%** |

### full cumulative chance (what the site averages)

this is `computeRoundProbs` then average over rounds 1..`fill_round`:

| | |
| --- | --- |
| samples | 10,195 |
| mean P | **0.440** (44%) |
| safe or iffy | **50.3%** |

by college type:

| type | mean P | safe or iffy |
| --- | --- | --- |
| IIT | 0.480 | 55.0% |
| NIT | 0.481 | 55.1% |
| IIIT | 0.320 | 36.3% |
| CFI | 0.222 | 24.0% |

so at the **exact** closing rank, the tool is a bit careful / pessimistic. about half still look iffy/safe, half look delulu or worse. that's the hard case on purpose (wide $\sigma$).

if your rank is clearly better than the predicted close, safe shows up way more. that is how the CDF is supposed to work.

again: **good cutoff guess ≠ high chance for every student.** if we nail a close at 3300 and you are 3457, delulu is the honest answer.

---

## do rounds open the way history says? (R1 → R4)

seats in both R1 and R4 actuals, and we have both `round1_mean` and `round4_mean` (n=7,031):

| | median drift R1→R4 | mean drift |
| --- | --- | --- |
| **real 2026** | **+4.3%** | +11.7% |
| **our history path** | **+7.3%** | +12.7% |

history expected a bit more opening than 2026 has shown so far. one reason path A looks a bit tight on a lot of seats.

---

## where it breaks

worst **%** misses are almost always tiny actual ranks (PwD / architecture / weird female-only ST). APE goes insane:

$$
\mathrm{APE} = \frac{|\hat{c} - a|}{a}
$$

| example | predicted | actual | APE |
| --- | --- | --- | --- |
| nit-calicut architecture OPEN (PwD) OS | 59 | 1 | 58× |
| nit-calicut architecture ST HS Female | 680 | 14 | 48× |
| iit-hyderabad electrical EWS (PwD) AI | 28 | 1 | 27× |
| iit-madras eng physics OPEN (PwD) AI | 258 | 10 | 25× |

we are not "58× dumb" for counselling. we missed a single-digit PwD close. % maths just hates tiny denominators.

we also get exact hits (APE = 0). examples: IIT Bombay CSE OPEN AI (`66` → `66`), IIT Delhi Electrical OPEN AI (`599` → `599`).

### weak zones (worst first)

1. **PwD** → ±20% falls to ~34%. use absolute rank miss, ignore %.
2. **elite ≤500** → % looks bad, absolute miss often still small.
3. **HS quota** → 60.7% ±20% vs ~78% for AI/OS.
4. **ST (non-PwD)** → 63.9% ±20%.
5. **NIT overall** → lots of seats + HS + branch mix.
6. **very high ranks (>150k)** → thin, jumpy tails.

### strong zones

1. IIT AI OPEN / OBC / EWS in the mid tiers
2. AI and OS quotas in general
3. non-PwD seats with ≥3 years of data (~74% ±20%)
4. closes around **2k-150k**

---

## vs older holdouts

| eval | ground truth | ±20% | band boundary | matched |
| --- | --- | --- | --- | --- |
| [2025 final](backtest.md) | 2025 final round | **73.9%** | 50.7% | 11,069 |
| this report, R4 path A | 2026 round 4 | **73.1%** | 39.7% | 10,096 |
| this report, headline vs R4 | 2026 round 4 | **74.3%** | 54.8% | 10,195 |

±20% is basically stable year to year. path A band boundary is lower mid-season because round means have no pool shift and R4 is not final. the cumulative engine (~50% safe/iffy at R4 boundary) is closer to the 2025 final band number.

---

## caveats (please read)

1. counselling not done. r5/r6 will move stuff. re-run after finals.
2. headline vs R1 is a bad test. headline wants final.
3. ~81% coverage. unmatched seats are invisible here.
4. APE hates small ranks. always look at median AE too, and filter PwD.
5. band boundary ≠ "we labelled every student right". it only tests the exact cutoff student.
6. live index may differ if rebuilt with 2026 rounds in. this report trains on ≤2025 only.
7. JoSAA only. no CSAB here.

---

## if you are a student reading this

- common OPEN/OBC/EWS AI or OS seat, mid ranks → ±20% is a fair mental model. tool is right that often.
- PwD, HS-only NIT, ST, or sub-500 elite → treat bands as direction, not laser precision. also check last year's real table.
- safe / iffy / delulu are labels on a probability. not allotment tickets.
- after r5/r6, this page should get a real final update.

---

## related

| thing | where |
| --- | --- |
| how the index is built | [index algorithms](index-algorithms.md) |
| chance / band maths | [prediction engine](prediction-engine.md) |
| 2025 final holdout | [backtest](backtest.md) |

---

## changelog

| date | what |
| --- | --- |
| 2026-07-11 | first report: 2026 R1-R4 holdout vs `jam-josaa-v3` |
