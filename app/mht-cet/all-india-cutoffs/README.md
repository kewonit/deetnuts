# MHT-CET All India Cutoffs 2024

A comprehensive, high-performance web application for exploring MHT-CET 2024 All India quota cutoff data across all three rounds.

## Features

### 🚀 Performance
- **Server-side API routes** with optimized PocketBase queries
- **Debounced search** (300ms) to prevent excessive API calls
- **Request cancellation** to avoid race conditions
- **Smart caching** and state management
- **Efficient pagination** with server-side filtering

### 🎯 Advanced Filtering
- **Multi-field search** across colleges, courses, and choice codes
- **Engineering branch filter** with 90+ predefined branches
- **Percentile range filter** for finding seats within score range
- **Rank range filter** for targeted search
- **College name filter** for institution-specific searches
- **Real-time filter state** with visual indicators

### 📊 Data Visualization
- **TanStack Table** with sorting, filtering, and column visibility
- **Responsive design** optimized for all screen sizes
- **Loading states** with skeleton loaders
- **Error handling** with retry mechanisms
- **Export to CSV** functionality

### 🎨 Modern UI/UX
- **Tabs interface** for easy round switching
- **Statistics dashboard** showing total records per round
- **Filter expansion** with active filter badges
- **Visual feedback** for all user interactions
- **Accessible design** following best practices

## API Endpoints

### Round 1
```
GET /api/mht-cet/all-india-cutoffs/2024-round-one
```

### Round 2
```
GET /api/mht-cet/all-india-cutoffs/2024-round-two
```

### Round 3
```
GET /api/mht-cet/all-india-cutoffs/2024-round-three
```

### Query Parameters
- `page` - Page number (default: 1)
- `perPage` - Records per page (default: 50)
- `sort` - Sort field with direction (e.g., `-rank`, `percentile`)
- `search` - Global search across multiple fields
- `branch` - Engineering branch filter
- `minPercentile` / `maxPercentile` - Percentile range
- `minRank` / `maxRank` - Rank range
- `collegeName` - College name filter

### Response Format
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "sr_no": "string",
      "rank": number,
      "percentile": "string",
      "choice_code": "string",
      "institute_code": "string",
      "college_code": "string",
      "course_code": "string",
      "course_name": "string",
      "college_name": "string",
      "mapping_status": "string",
      "created": "string",
      "updated": "string"
    }
  ],
  "pagination": {
    "page": number,
    "perPage": number,
    "totalPages": number,
    "totalItems": number
  }
}
```

## File Structure

```
app/mht-cet/all-india-cutoffs/
├── page.tsx                     # Main page component
├── data-table.tsx              # TanStack Table component
├── filters.tsx                 # Advanced filters component
├── types.ts                    # TypeScript type definitions
├── constants.ts                # Engineering branches constants
├── use-all-india-cutoffs.ts    # Custom hook for data fetching
└── unique_branches.txt         # Source list of branches

app/api/mht-cet/all-india-cutoffs/
├── 2024-round-one/route.ts     # Round 1 API endpoint
├── 2024-round-two/route.ts     # Round 2 API endpoint
└── 2024-round-three/route.ts   # Round 3 API endpoint
```

## Key Components

### 1. Custom Hook (`use-all-india-cutoffs.ts`)
- Manages data fetching with abort controllers
- Implements debouncing for search operations
- Handles loading states and error management
- Provides automatic cleanup on unmount

### 2. Data Table (`data-table.tsx`)
- Built with TanStack Table v8
- Server-side pagination and sorting
- Column visibility controls
- CSV export functionality
- Responsive design with mobile optimization

### 3. Advanced Filters (`filters.tsx`)
- Expandable filter panel
- Real-time filter state indicators
- Branch dropdown with 90+ engineering branches
- Range filters for percentile and rank
- Filter clearing and reset functionality

### 4. API Routes
- Optimized PocketBase queries
- Server-side filtering and sorting
- Error handling and validation
- Consistent response format

## Performance Optimizations

1. **Debounced Search**: Prevents excessive API calls during typing
2. **Request Cancellation**: Cancels previous requests when new ones are made
3. **Efficient Queries**: Uses PocketBase field selection and filtering
4. **Smart State Management**: Only re-renders when necessary
5. **Pagination**: Server-side pagination reduces data transfer
6. **Error Boundaries**: Graceful error handling with retry options

## Engineering Branches Supported

The application supports 90+ engineering branches including:
- Computer Science and Engineering variations
- Artificial Intelligence and Machine Learning
- Electronics and Communication Engineering
- Mechanical Engineering variants
- Chemical and Biotechnology
- Civil Engineering specializations
- And many more...

## Usage

1. **Browse by Round**: Switch between Round 1, 2, and 3 using tabs
2. **Search**: Use the global search to find specific colleges or courses
3. **Filter by Branch**: Select from 90+ engineering branches
4. **Set Range Filters**: Define percentile or rank ranges
5. **Sort Data**: Click column headers to sort
6. **Export Data**: Download filtered results as CSV
7. **Navigate**: Use pagination controls to browse through results

## Technical Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Components**: Custom UI library with Radix UI primitives
- **Table**: TanStack Table v8
- **Styling**: Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: PocketBase
- **State Management**: React hooks with optimizations

## Error Handling

- Network error recovery with retry buttons
- Loading states with skeleton loaders
- Graceful degradation when data is unavailable
- User-friendly error messages
- Automatic request cancellation

This implementation provides a robust, scalable, and user-friendly interface for exploring MHT-CET cutoff data with enterprise-grade performance and reliability.
