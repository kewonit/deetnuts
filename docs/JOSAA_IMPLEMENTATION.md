# JoSAA Cutoff Explorer - Implementation Guide

This document provides a complete guide for the JoSAA (Joint Seat Allocation Authority) cutoff data explorer implementation using PocketBase and Next.js 16.

## 📋 Overview

The JoSAA module provides:

- **467,000+** cutoff records across 7 years (2018-2024)
- **~109** institutes (IITs, NITs, IIITs, GFTIs)
- Interactive trend charts with Recharts
- Cascading filters with URL state (nuqs)
- Institute comparison tool
- Rank-based college finder
- Fully typed PocketBase integration

## 🏗️ Architecture

```
lib/
├── types/josaa.ts           # TypeScript definitions
├── josaa-client.ts          # PocketBase client with typed collections
└── josaa-static-params.ts   # Static generation helpers

app/josaa/
├── page.tsx                 # Landing page with stats
├── sitemap.ts               # SEO sitemap generation
├── institutes/
│   ├── page.tsx             # Institutes listing
│   ├── [slug]/
│   │   ├── page.tsx         # Institute detail
│   │   └── [branchCode]/
│   │       └── page.tsx     # Branch detail with trends
├── search/
│   └── page.tsx             # Rank-based search
├── compare/
│   └── page.tsx             # Multi-institute comparison
└── trends/
    └── page.tsx             # Historical trend analysis

components/josaa/
├── CutoffChart.tsx          # Recharts trend visualization
├── CutoffsTable.tsx         # Filterable table with nuqs
├── BranchComparison.tsx     # Bar chart comparison
├── InstitutesFilter.tsx     # Filter pills component
└── SearchForm.tsx           # Cascading filter search

app/api/josaa/
├── cutoffs/route.ts         # Cutoffs API
├── institutes/route.ts      # Institutes API
└── institutes/[slug]/route.ts # Single institute API

data/josaa/
└── pocketbase_schema.json   # PocketBase collection schemas

scripts/
└── batch-import-josaa.ts    # Data import script
```

## 🚀 Setup Instructions

### 1. Prerequisites

- Node.js 18+
- PocketBase running at `http://127.0.0.1:8090`
- Admin credentials for PocketBase
- Scraped JoSAA data files

### 2. Configure Environment

Ensure your `.env.local` has:

```env
NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
POCKETBASE_ADMIN_EMAIL=your-admin@email.com
POCKETBASE_ADMIN_PASSWORD=your-password
```

### 3. Import PocketBase Schema

1. Open PocketBase Admin UI: `http://127.0.0.1:8090/_/`
2. Go to **Settings > Import collections**
3. Upload `data/josaa/pocketbase_schema.json`
4. This creates 4 collections:
   - `josaa_institutes` - Institute master data
   - `josaa_branches` - Branch/program master data
   - `josaa_cutoffs` - Cutoff records (main data)
   - `josaa_institute_aliases` - Search aliases

### 4. Prepare Data Files

Copy your scraped data to the data directory:

```powershell
# Copy from deetnuts-scripts
Copy-Item "E:\Github\deetnuts-scripts\JoSAA_html_to_csv\data_pipeline\output\institutes.json" "E:\Github\deetnuts\data\josaa\"
Copy-Item "E:\Github\deetnuts-scripts\JoSAA_html_to_csv\data_pipeline\output\branches.json" "E:\Github\deetnuts\data\josaa\"
Copy-Item "E:\Github\deetnuts-scripts\JoSAA_html_to_csv\data_pipeline\output\cutoffs_by_year\*.json" "E:\Github\deetnuts\data\josaa\cutoffs\"
```

### 5. Run Data Import

The data is already exported in `data/output/export/` folder:

- `institutes.json` - Institute master data (~1600 lines)
- `branches.json` - Branch master data (~4500 lines)
- `cutoffs_chunk_*.json` - Cutoff records in 10 chunks (~105 MB total)

#### Quick Test Import

First, set your PocketBase admin credentials:

```powershell
# PowerShell
$env:POCKETBASE_ADMIN_EMAIL="your-admin@email.com"
$env:POCKETBASE_ADMIN_PASSWORD="your-password"
```

Then run the quick test:

```bash
npx ts-node scripts/quick-import-josaa.ts
```

This imports just 10 institutes to verify connectivity and permissions.

#### Full Data Import

Once the test passes, run the full import:

```bash
npx ts-node --esm scripts/import-josaa-data.ts
```

The import script features:

- **Batch processing**: 100 records per batch
- **Progress tracking**: Real-time import progress
- **Deduplication**: Skips existing records
- **Error handling**: Continues on individual record errors

Expected output:

```
JoSAA Data Import Script
============================================================
Connecting to PocketBase at https://api.deetnuts.com...
✓ Authenticated as admin

Importing Institutes
============================================================
Found 109 institutes
✓ Institutes: 109 created, 0 skipped

Importing Branches
============================================================
Found 450 branches
✓ Branches: 450 created, 0 skipped

Importing Cutoffs
============================================================
Found 467,234 cutoff records
  Progress: 1,000 / 467,234 (0%)
  ...
✓ Cutoffs: 467,234 created, 0 errors

Import Complete!
```

#### Set Public Read Access

After importing, set API rules in PocketBase Admin UI for each collection:

1. Go to `https://api.deetnuts.com/_/`
2. For each collection (`josaa_institutes`, `josaa_branches`, `josaa_cutoffs`):
   - Click on the collection
   - Go to "API Rules"
   - Set "List/Search rule" to empty (public)
   - Set "View rule" to empty (public)
   - Save

### 6. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000/josaa` to see the application.

## 📊 Features

### Landing Page (`/josaa`)

- Quick stats dashboard (total records, institutes, years)
- Institute type cards (IIT, NIT, IIIT, GFTI)
- Quick action buttons for search, compare, trends

### Institutes Listing (`/josaa/institutes`)

- Filter by type, state
- Search by name/code
- NIRF ranking display
- Direct links to institute pages

### Institute Detail (`/josaa/institutes/[slug]`)

- Tabbed interface: Cutoffs | Trends | Compare
- Branch listing with seat count
- Interactive trend charts
- Filterable cutoffs table

### Branch Detail (`/josaa/institutes/[slug]/[branchCode]`)

- Historical trends (2018-2024)
- All category/gender combinations
- Year-wise cutoff breakdown

### Search Page (`/josaa/search`)

- Cascading filters (type → institute → branch)
- Rank input with results
- Grouped by institute
- CSV export

### Compare Page (`/josaa/compare`)

- Select up to 5 institutes
- Common branches comparison
- Horizontal bar chart
- Filter by category/gender/year

### Trends Page (`/josaa/trends`)

- Track multiple branches
- Multi-line chart (2018-2024)
- Cross-institute comparison
- Insights cards

## 🔧 API Routes

### GET `/api/josaa/cutoffs`

Query cutoffs with filters.

**Parameters:**

- `instituteSlug` - Institute slug
- `branchCode` - Branch code
- `year` - Year filter
- `category` - Category filter
- `gender` - Gender filter
- `page` - Pagination
- `perPage` - Items per page

### GET `/api/josaa/institutes`

List all institutes.

**Parameters:**

- `type` - Filter by type (IIT/NIT/IIIT/GFTI)
- `search` - Search query

### GET `/api/josaa/institutes/[slug]`

Get single institute with branches and cutoffs.

**Parameters:**

- `year` - Filter cutoffs by year

## 🎨 Design System

The JoSAA module follows the neobrutalist design pattern:

- `border-4 border-foreground` - Bold borders
- `shadow-[4px_4px_0_0_#000]` - Hard shadows
- Monospace fonts for numbers
- High contrast colors
- Card-based layouts

## 📈 Performance Optimizations

1. **Server Components**: All listing pages use RSC
2. **Parallel Data Fetching**: `Promise.all` for concurrent requests
3. **URL State**: nuqs preserves filters in URL
4. **Caching**: API routes have 1-hour cache headers
5. **Static Generation**: `generateStaticParams` for institutes
6. **Sitemap**: Auto-generated for SEO

## 🐛 Troubleshooting

### Import fails with "Too many requests"

Reduce batch concurrency in `batch-import-josaa.ts`:

```typescript
const CONCURRENCY = 3; // Reduce from 5
```

### Charts not rendering

Ensure Recharts is installed:

```bash
npm install recharts
```

### Type errors in client

Rebuild types:

```bash
npm run build
```

### PocketBase connection issues

Check if PocketBase is running:

```powershell
curl http://127.0.0.1:8090/api/health
```

## 📁 Data Schema

### Institutes

| Field          | Type   | Description               |
| -------------- | ------ | ------------------------- |
| name           | text   | Full institute name       |
| code           | text   | Short code (e.g., "IITD") |
| slug           | text   | URL-friendly identifier   |
| institute_type | select | IIT/NIT/IIIT/GFTI/CFTI    |
| state          | text   | State name                |
| city           | text   | City name                 |
| nirf_rank      | number | NIRF ranking              |

### Branches

| Field       | Type   | Description        |
| ----------- | ------ | ------------------ |
| name        | text   | Full branch name   |
| code        | text   | Branch code        |
| degree_type | select | B.Tech/M.Tech/etc. |
| duration    | number | Program duration   |

### Cutoffs

| Field        | Type     | Description                |
| ------------ | -------- | -------------------------- |
| institute    | relation | Link to institute          |
| branch       | relation | Link to branch             |
| branch_code  | text     | Branch code (denormalized) |
| year         | number   | Year (2018-2024)           |
| round        | number   | Counseling round (1-6)     |
| category     | select   | OPEN/EWS/OBC-NCL/SC/ST     |
| gender       | select   | Gender-Neutral/Female-only |
| opening_rank | number   | Opening rank               |
| closing_rank | number   | Closing rank               |

## 🔐 Security

- Public read access for all collections
- Admin-only write access
- Rate limiting via PocketBase
- Input validation on API routes

## 📝 License

This implementation is part of the DeetNuts project.
