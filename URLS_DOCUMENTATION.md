# DeetNuts URL Structure Documentation

This document provides an overview of the active URLs on the DeetNuts website.

## Base URL

```
https://www.deetnuts.com
```

## Static Pages

| Page Name | URL | Description |
|-----------|-----|-------------|
| Home | `/` | Main landing page |
| Creators | `/creators` | Information about the creators |
| Data Source | `/datasource` | Data source documentation |
| Terms & Conditions | `/compliance/terms-and-conditions` | Legal terms and conditions |

## MHT-CET Section

| Page Name | URL | Description |
|-----------|-----|-------------|
| MHT-CET Cutoffs | `/mht-cet` | Main MHT-CET cutoffs page |
| All India Cutoffs | `/mht-cet/all-india-cutoffs` | All India category cutoffs |
| State Cutoffs | `/mht-cet/state-cutoffs` | State-wise cutoffs |
| Colleges | `/mht-cet/colleges` | List of MHT-CET colleges |
| College Detail | `/mht-cet/colleges/[slug]` | College-specific cutoffs and seat data |

## Other Application Pages

| Page Name | URL | Description |
|-----------|-----|-------------|
| Account | `/account` | User account dashboard |
| Login | `/login` | User login |
| Signup | `/signup` | User registration |

## Sitemap Locations

- Main Sitemap: `https://www.deetnuts.com/sitemap.xml`
- MHT-CET Sitemap: `https://www.deetnuts.com/mht-cet/sitemap.xml`

## URL Generation Notes

- All URLs use lowercase with hyphens for readability.
- Dynamic college URLs use descriptive slugs with a stable college-code suffix.
- Sitemap files are automatically generated and kept up to date.
