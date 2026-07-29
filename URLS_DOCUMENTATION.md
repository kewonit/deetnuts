# DeetNuts URL Structure Documentation

This document provides a comprehensive overview of all URLs available on the DeetNuts website.

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

## JoSAA Section

### Static JoSAA Pages
| Page Name | URL | Description |
|-----------|-----|-------------|
| JoSAA Cutoffs | `/josaa` | Main JoSAA cutoffs page |
| All Colleges | `/josaa/all-colleges` | List of all colleges |
| Institute Search | `/josaa/search` | Search for institutes |
| Compare Institutes | `/josaa/compare` | Compare different institutes |
| Trends Analysis | `/josaa/trends` | Trend analysis page |

### Dynamic JoSAA Pages
| Pattern | Example | Description |
|---------|---------|-------------|
| `/josaa/institutes/[slug]` | `/josaa/institutes/iit-bombay` | Institute-specific cutoffs |
| `/josaa/institutes/[slug]/[branchCode]` | `/josaa/institutes/iit-bombay/cse` | Branch-specific cutoffs |

## MHT-CET Section

| Page Name | URL | Description |
|-----------|-----|-------------|
| MHT-CET Cutoffs | `/mht-cet` | Main MHT-CET cutoffs page |
| All India Cutoffs | `/mht-cet/all-india-cutoffs` | All India category cutoffs |
| State Cutoffs | `/mht-cet/state-cutoffs` | State-wise cutoffs |
| Colleges | `/mht-cet/colleges` | List of MHT-CET colleges |

## NIRF Section

### Static NIRF Pages
| Page Name | URL | Description |
|-----------|-----|-------------|
| NIRF Rankings | `/nirf` | Main NIRF rankings page |

### Dynamic NIRF Pages
| Pattern | Example | Description |
|---------|---------|-------------|
| `/nirf/institute/[id]/[name]` | `/nirf/institute/1/iit-bombay` | Institute-specific details |

## Predictions Section

| Page Name | URL | Description |
|-----------|-----|-------------|
| Predictions | `/predictions` | Predictions and analysis |

## Account Pages

| Page Name | URL | Description |
|-----------|-----|-------------|
| Account | `/account` | User account dashboard |
| Login | `/login` | User login |
| Signup | `/signup` | User registration |

## External Links

| Page Name | URL | Description |
|-----------|-----|-------------|
| GitHub Repository | `https://github.com/kewonit/deetnuts` | Source code repository |
| Creator's Twitter | `https://x.com/kewonit` | Creator's Twitter profile |

## URL Categories

### Educational Data URLs
- `/josaa` - JoSAA cutoffs
- `/mht-cet` - MHT-CET cutoffs
- `/nirf` - NIRF rankings
- `/predictions` - Predictions

### Interactive Tool URLs
- `/josaa/search` - Institute search
- `/josaa/compare` - Institute comparison
- `/josaa/trends` - Trend analysis

### Information URLs
- `/creators` - Creator information
- `/datasource` - Data sources

### Account Management URLs
- `/account` - User dashboard
- `/login` - Authentication
- `/signup` - Registration

## Dynamic URL Patterns

The following URL patterns contain dynamic parameters:

1. **Institute URLs**: `/josaa/institutes/[slug]`
   - `[slug]` is the institute identifier (e.g., "iit-bombay", "vjti")

2. **Branch URLs**: `/josaa/institutes/[slug]/[branchCode]`
   - `[branchCode]` is the branch code (e.g., "cse", "ece", "me")

3. **NIRF Institute URLs**: `/nirf/institute/[id]/[name]`
   - `[id]` is the institute ID
   - `[name]` is the institute name

## Sitemap Locations

- Main Sitemap: `https://www.deetnuts.com/sitemap.xml`
- JoSAA Sitemap: `https://www.deetnuts.com/josaa/sitemap.xml`
- MHT-CET Sitemap: `https://www.deetnuts.com/mht-cet/sitemap.xml`

## API Endpoints

The website includes several API endpoints (not publicly listed):
- `/api/` - General API endpoints
- `/auth/` - Authentication endpoints

These are excluded from search engine indexing as specified in robots.txt.

## URL Generation Notes

- All URLs use lowercase with hyphens for readability
- Dynamic URLs follow RESTful conventions
- URLs are SEO-friendly with descriptive slugs
- Sitemap files are automatically generated and kept up-to-date
