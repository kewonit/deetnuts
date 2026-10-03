# MHT-CET college media coverage

Reviewed on **2026-10-03**. Every one of the **390 canonical CAP institute codes** has an individual identity/source review and a final outcome. **No records are pending.** Directory cards are unchanged. The shared header supplies the same assets to full college pages and slide-over views.

## Coverage

| Outcome                                        | Colleges |
| ---------------------------------------------- | -------: |
| Both logo and campus photograph verified       |      353 |
| One asset verified, with the other unavailable |       31 |
| Neither asset could be verified                |        6 |
| Reviewed total                                 |      390 |
| Pending                                        |        0 |

| Media or fallback                                     | Count |
| ----------------------------------------------------- | ----: |
| Actual logos                                          |   375 |
| Campus backgrounds                                    |   362 |
| Same-college photo avatars when no logo is available  |     9 |
| Initials avatars when neither asset is available      |     6 |
| Neutral backgrounds when no campus image is available |    28 |
| Unavailable logos                                     |    15 |
| Unavailable campus images                             |    28 |

The 737 local WebPs total 52.1 MiB (5,46,34,258 bytes): 567 assets from official sources and 170 from individually matched secondary sources. Where no clear exterior could be verified, a documented photograph of the same college's facilities was used. Institutional wordmarks and explicitly adopted trust/group marks count as logos.

## Provenance and preparation

[The media manifest](college-media.json) is the complete checklist, keyed by five-digit CAP code. Each entry retains the canonical path, college name, identity reference, official website when found, attempted source pages, review date/outcome and selection notes. Every selected asset records its source page and original URL, original/final dimensions and SHA256 checksums, crop coordinates when used, and the reviewed banner focal position. Extracted PDF images also retain page, embedded-image name and document checksum.

Final files are served from `public/mht-cet/colleges/<code>/logo.webp` and `campus.webp`. Logos use lossless WebP, retain their proportions/transparency and have a longest edge of at most 512px. Photos use WebP quality 80 with width at most 1600px. Small originals are never enlarged. Original downloads, source-page captures, candidate contact sheets and final desktop/mobile crop sheets remain in ignored `data/output/college-media/` scratch storage.

Full-page crops (1120×192) and mobile crops (360×128), plus the narrower slide-over proportions, were visually reviewed. Logos use contain with padding on a readable background; the white 04142 crest has its reviewed navy background in both themes. A failed logo falls back to its own college photo. When neither a logo nor a photo is usable, the avatar retains initials. Missing or failed campus photos retain the existing neutral banner.

Identical files across colleges were checked individually. Shared marks are intentional for MET 05151/05244, Sinhgad 06177/06178/06182/06185/06187/06769/06770, KJEI 06184/06634 and Samarth/Sawkar 06545/16372. The identical campus photo for 05239/05322 is supported by the official site's documented Jamia/JIEMS merger at Akkalkuwa. Separate college campuses retain separately matched photos, including the distinct TKIET Yelur record 16126.

## Partial coverage

These reviews are complete. Missing assets retain the agreed fallback; their source attempts and rejection reasons are in the manifest and [machine-readable coverage report](college-media-coverage.json).

| CAP code | College                                                                                                                                                                                                                                                                | Fallback for unavailable asset |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| 02021    | [University Department of Chemical Technology, Aurangabad](http://127.0.0.1:3001/mht-cet/colleges/university-department-of-chemical-technology-aurangabad-02021)                                                                                                       | Neutral banner                 |
| 02282    | [Mitthulalji Sarada Institute Of Technology, Nalwandi Road, Beed](http://127.0.0.1:3001/mht-cet/colleges/mitthulalji-sarada-institute-of-technology-nalwandi-road-beed-02282)                                                                                          | Neutral banner                 |
| 02637    | [Jijau Institute of Engineering Technology and Management, Khandgaon (Bendri), Taluka Naigaon, District Nanded](http://127.0.0.1:3001/mht-cet/colleges/jijau-institute-of-engineering-technology-and-management-khandgaon-bendri-taluka-naigaon-district-nanded-02637) | Neutral banner                 |
| 02666    | [Mangaldeep College of Engineering](http://127.0.0.1:3001/mht-cet/colleges/mangaldeep-college-of-engineering-02666)                                                                                                                                                    | Neutral banner                 |
| 02770    | [Shetkari Shikshan Prasarak Mandal's Mahesh Institute of Engineering and Technology , Ashti](http://127.0.0.1:3001/mht-cet/colleges/shetkari-shikshan-prasarak-mandals-mahesh-institute-of-engineering-and-technology-ashti-02770)                                     | Neutral banner                 |
| 02772    | [JSPM College of Engineering, Latur](http://127.0.0.1:3001/mht-cet/colleges/jspm-college-of-engineering-latur-02772)                                                                                                                                                   | Neutral banner                 |
| 03723    | [Navjeevan Education Society's College of Engineering, Bhandup(W), Mumbai](http://127.0.0.1:3001/mht-cet/colleges/navjeevan-education-societys-college-of-engineering-bhandupw-mumbai-03723)                                                                           | Neutral banner                 |
| 03724    | [Thakur Shree DPS College of Engineering & Management](http://127.0.0.1:3001/mht-cet/colleges/thakur-shree-dps-college-of-engineering-management-03724)                                                                                                                | Neutral banner                 |
| 04762    | [Mata Mahakali College of Engineering & Technology, Warora](http://127.0.0.1:3001/mht-cet/colleges/mata-mahakali-college-of-engineering-technology-warora-04762)                                                                                                       | Same-college photo avatar      |
| 05171    | [Godavari Foundation's Godavari College Of Engineering, Jalgaon](http://127.0.0.1:3001/mht-cet/colleges/godavari-foundations-godavari-college-of-engineering-jalgaon-05171)                                                                                            | Same-college photo avatar      |
| 05395    | [Ashok Institute of Engineering & Technology](http://127.0.0.1:3001/mht-cet/colleges/ashok-institute-of-engineering-technology-05395)                                                                                                                                  | Neutral banner                 |
| 05409    | [Rajiv Gandhi College of Engineering, At Post Karjule Hariya Tal.Parner, Dist.Ahmednagar](http://127.0.0.1:3001/mht-cet/colleges/rajiv-gandhi-college-of-engineering-at-post-karjule-hariya-talparner-distahmednagar-05409)                                            | Neutral banner                 |
| 05413    | [Netaji Subhashchandra Bose Edu Trust,Netaji Polytechnic.,Dhule](http://127.0.0.1:3001/mht-cet/colleges/netaji-subhashchandra-bose-edu-trustnetaji-polytechnicdhule-05413)                                                                                             | Neutral banner                 |
| 05497    | [P.G. College of Engineering & Technology, Nandurbar](http://127.0.0.1:3001/mht-cet/colleges/pg-college-of-engineering-technology-nandurbar-05497)                                                                                                                     | Neutral banner                 |
| 05509    | [Shri Swami Samarth Institute of Management and Technology, Malwadi-Bota](http://127.0.0.1:3001/mht-cet/colleges/shri-swami-samarth-institute-of-management-and-technology-malwadi-bota-05509)                                                                         | Neutral banner                 |
| 05513    | [MKD Institute of Technology, Nadurbar](http://127.0.0.1:3001/mht-cet/colleges/mkd-institute-of-technology-nadurbar-05513)                                                                                                                                             | Neutral banner                 |
| 05545    | [Shri Vile Parle Kelavani Mandal's College of Engineering, Shirpur](http://127.0.0.1:3001/mht-cet/colleges/shri-vile-parle-kelavani-mandals-college-of-engineering-shirpur-05545)                                                                                      | Neutral banner                 |
| 05597    | [VAMANRAO ITHAPE COLLEGE OF ENGINEERING AND MANAGEMENT](http://127.0.0.1:3001/mht-cet/colleges/vamanrao-ithape-college-of-engineering-and-management-05597)                                                                                                            | Neutral banner                 |
| 06122    | [TSSMS's Pd. Vasantdada Patil Institute of Technology, Bavdhan, Pune](http://127.0.0.1:3001/mht-cet/colleges/tssmss-pd-vasantdada-patil-institute-of-technology-bavdhan-pune-06122)                                                                                    | Same-college photo avatar      |
| 06155    | [G.H.Raisoni College of Engineering & Management, Wagholi, Pune](http://127.0.0.1:3001/mht-cet/colleges/ghraisoni-college-of-engineering-management-wagholi-pune-06155)                                                                                                | Same-college photo avatar      |
| 06183    | [Al-Ameen Educational and Medical Foundation, College of Engineering, Koregaon, Bhima](http://127.0.0.1:3001/mht-cet/colleges/al-ameen-educational-and-medical-foundation-college-of-engineering-koregaon-bhima-06183)                                                 | Neutral banner                 |
| 06311    | [Jayawant Shikshan Prasarak Mandal, Bhivarabai Sawant Institute of Technology & Research, Wagholi](http://127.0.0.1:3001/mht-cet/colleges/jayawant-shikshan-prasarak-mandal-bhivarabai-sawant-institute-of-technology-research-wagholi-06311)                          | Same-college photo avatar      |
| 06625    | [Universal College of Engineering & Research, Sasewadi](http://127.0.0.1:3001/mht-cet/colleges/universal-college-of-engineering-research-sasewadi-06625)                                                                                                               | Same-college photo avatar      |
| 06714    | [APPASAHEB ALIAS SA.RE.PATIL INSTITUTE OF TECHNOLOGY, Dattanagar Tal-Shirol, Dist Kolhapur](http://127.0.0.1:3001/mht-cet/colleges/appasaheb-alias-sarepatil-institute-of-technology-dattanagar-tal-shirol-dist-kolhapur-06714)                                        | Neutral banner                 |
| 06755    | [JSPM Narhe Technical Campus, Pune.](http://127.0.0.1:3001/mht-cet/colleges/jspm-narhe-technical-campus-pune-06755)                                                                                                                                                    | Same-college photo avatar      |
| 06759    | [Shree Ramchandra College of Engineering, Lonikand,Pune](http://127.0.0.1:3001/mht-cet/colleges/shree-ramchandra-college-of-engineering-lonikandpune-06759)                                                                                                            | Same-college photo avatar      |
| 06814    | [K.P. Patil Institute ( Polytechnic ), Bhudargad, Dist.Kolhapur](http://127.0.0.1:3001/mht-cet/colleges/kp-patil-institute-polytechnic-bhudargad-distkolhapur-06814)                                                                                                   | Neutral banner                 |
| 14005    | [Laxminarayan Innovation Technological University, Nagpur](http://127.0.0.1:3001/mht-cet/colleges/laxminarayan-innovation-technological-university-nagpur-14005)                                                                                                       | Same-college photo avatar      |
| 16121    | [Shri. Anandrao Abitkar College of Engineering, Pal](http://127.0.0.1:3001/mht-cet/colleges/shri-anandrao-abitkar-college-of-engineering-pal-16121)                                                                                                                    | Neutral banner                 |
| 16126    | [Tatyasaheb Kore Institute of Engineering and Technology, Yelur](http://127.0.0.1:3001/mht-cet/colleges/tatyasaheb-kore-institute-of-engineering-and-technology-yelur-16126)                                                                                           | Neutral banner                 |
| 16372    | [Sawkar Women's Institute of Technology](http://127.0.0.1:3001/mht-cet/colleges/sawkar-womens-institute-of-technology-16372)                                                                                                                                           | Neutral banner                 |

## No usable asset verified

Both the initials avatar and neutral banner remain for these six colleges. Exact-name/address sources were inspected; unrelated institutions, generated avatars, stock images, unreadable marks and unverified campuses were excluded.

| CAP code | College                                                                                                                                                                                                     |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 02805    | [Urvara Pathrikar Engineering College](http://127.0.0.1:3001/mht-cet/colleges/urvara-pathrikar-engineering-college-02805)                                                                                   |
| 03546    | [Devi Mahalaxmi College of Engineering and Technology](http://127.0.0.1:3001/mht-cet/colleges/devi-mahalaxmi-college-of-engineering-and-technology-03546)                                                   |
| 05682    | [Sai College of Engineering and Technology](http://127.0.0.1:3001/mht-cet/colleges/sai-college-of-engineering-and-technology-05682)                                                                         |
| 05683    | [Saptashrungi College of Engineering and Polytechnic](http://127.0.0.1:3001/mht-cet/colleges/saptashrungi-college-of-engineering-and-polytechnic-05683)                                                     |
| 05686    | [Loknete Suhas Dwarkanath Kande College of Engineering Management and Research](http://127.0.0.1:3001/mht-cet/colleges/loknete-suhas-dwarkanath-kande-college-of-engineering-management-and-research-05686) |
| 16371    | [Kai. Nirmalatai Pingle Institute of Engineering & Management studies](http://127.0.0.1:3001/mht-cet/colleges/kai-nirmalatai-pingle-institute-of-engineering-management-studies-16371)                      |

## Verification

- The media verifier passed: all 390 canonical codes/paths/outcomes match, every referenced file exists, all 737 WebPs decode, dimensions/checksums/no-enlargement checks pass, all 375 logos use lossless WebP, and there are no unreferenced public WebPs. Run `npm run verify:mht-cet-media -- --write-report` to reproduce it.
- `npm run typecheck` passed. Changed TypeScript/TSX files passed ESLint; both new scripts passed Node syntax checks.
- `npm run test:admissions` passed all 56 unit tests.
- At 390×844 and 1440×1000, all 12 new media browser checks passed. They cover full pages and sheets, light/dark themes, local image loading, actual missing assets, forced load failures, year/program controls, navigation and closing sheets by button/Escape.
- The combined admissions browser run finished with **20 passed and 6 failed**. The six failures are three existing checks at each viewport: two expect absolute production redirect URLs but receive relative destinations; the sitemap-index check returns 500 because the running server's JEE data root lacks `tools/college-cutoffs/catalog.json`. These route/data files were not changed by this work.
- Historical detail pages that need uncached PocketBase data could not all be opened because the local PocketBase service at port 8090 is unavailable. Their media records/files were still individually reviewed and validated; representative UI checks used available college data.

The local preview is [A. P. Shah Institute of Technology](http://127.0.0.1:3001/mht-cet/colleges/a-p-shah-institute-of-technology-thane-03475). Publishing is outside this change.
