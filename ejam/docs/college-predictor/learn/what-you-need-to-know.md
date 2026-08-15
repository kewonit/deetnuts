# what you need to know

garbage in, garbage out. have this ready before you hit predict, and know what the numbers actually are.

## before you open the tool

| topic | what to have |
| --- | --- |
| **counselling rank** | the number from the official rank list / allotment. not percentile, not marks. |
| **category + gender** | same seat pool as the portal: OPEN, EWS, OBC-NCL, SC, ST, plus gender-neutral or female-only where it applies. |
| **quota + home state** | Main / CSAB: **OS** and **HS** need domicile **home state**. **AI** does not. UI default is **OS**. pick the quota you'll actually fill choices with. |
| **counselling body** | JoSAA and CSAB are different indexes and cutoffs. CSAB is after JoSAA for vacant NIT+ seats; cutoffs are usually worse (higher rank) because stronger people already took JoSAA seats. |

## exams and institute types

### JEE Main + JoSAA

- **NIT:** National Institutes of Technology
- **IIIT:** Indian Institutes of Information Technology
- **CFI:** centrally funded institutes in the JoSAA pool

JoSAA PDFs often say **GFTI**. ejam uses **CFI** for the same group in the index and UI. same seats, different acronym.

quota: **OS**, **HS**, **AI**.

### JEE Main + CSAB

separate CSAB index. same rank / profile inputs, CSAB cutoff history only. NIT+, IIIT, CFI. no IITs.

### JEE Advanced

IITs only. category and gender still matter; quota is All India inside this tool.

## EWS: two different things

| mechanism | what it does |
| --- | --- |
| **Gen-EWS category** (dropdown) | predicts against **EWS seat rows**. normal path when applying under EWS. |
| **`?ews=true` in the URL** | dual comparison: OPEN seats plus a parallel EWS pass, for General students weighing an EWS certificate. |

both assume you actually qualify for EWS in counselling. dual mode shows a caveat when it's on.
