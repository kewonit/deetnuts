# DEETNUTS URL structure

This document lists the active public URLs on the DEETNUTS website.

## Base URL

```
https://www.deetnuts.com
```

## Static Pages

| Page                 | URL                                | Description                      |
| -------------------- | ---------------------------------- | -------------------------------- |
| Home                 | `/`                                | Main page                        |
| Creators             | `/creators`                        | Project and operator information |
| Data sources         | `/datasource`                      | Data source documentation        |
| Terms and conditions | `/compliance/terms-and-conditions` | Service terms                    |

## MHT-CET Section

| Page              | URL                          | Description                   |
| ----------------- | ---------------------------- | ----------------------------- |
| MHT-CET cutoffs   | `/mht-cet`                   | MHT-CET cutoff tools          |
| All India cutoffs | `/mht-cet/all-india-cutoffs` | All India cutoff data         |
| State cutoffs     | `/mht-cet/state-cutoffs`     | State cutoff data             |
| Colleges          | `/mht-cet/colleges`          | MHT-CET college list          |
| College detail    | `/mht-cet/colleges/[slug]`   | College cutoffs and seat data |

## Other Application Pages

| Page    | URL        | Description           |
| ------- | ---------- | --------------------- |
| Account | `/account` | Account page          |
| Login   | `/login`   | Sign-in page          |
| Signup  | `/signup`  | Account creation page |

## Sitemap Locations

- Main Sitemap: `https://www.deetnuts.com/sitemap.xml`
- MHT-CET Sitemap: `https://www.deetnuts.com/mht-cet/sitemap.xml`

## URL Generation Notes

- All URLs use lowercase with hyphens for readability.
- Dynamic college URLs use descriptive slugs with a stable college-code suffix.
- Sitemap files are automatically generated and kept up to date.
