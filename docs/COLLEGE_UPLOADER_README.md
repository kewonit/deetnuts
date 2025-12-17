# College Information Batch Uploader

This script uploads college information from a CSV file to the PocketBase `2024_mht_cet_colleges` collection.

## CSV Format

The CSV file should have the following columns:
- `college_id` (number): Unique identifier for the college
- `college_name` (string): Full name of the college
- `status` (string): College status (e.g., "Government Autonomous", "Un-Aided", etc.)
- `home_university` (string): The university the college belongs to

Example CSV format:
```csv
college_id,college_name,status,home_university
1002,Government College Of Engineering Amravati,Government Autonomous,Autonomous Institute
1005,Sant Gadge Baba Amravati University Amravati,University Department,Sant Gadge Baba Amravati University
```

## Prerequisites

1. Ensure you have the required environment variables set in your `.env` file:
   ```
   POCKETBASE_URL=https://api.deetnuts.com
   POCKETBASE_AUTH_TOKEN=your_auth_token
   # OR
   POCKETBASE_ADMIN_EMAIL=your_admin_email
   POCKETBASE_ADMIN_PASSWORD=your_admin_password
   ```

2. Place your CSV file at `scripts/college_information.csv`

## Usage

### Upload Commands

```bash
# Create new college records (will fail if records already exist)
npm run batch-upload-colleges create

# Upsert college records (create new or update existing)
npm run batch-upload-colleges upsert

# Clear all existing college records
npm run batch-upload-colleges clear

# Replace all records (clear + create)
npm run batch-upload-colleges replace
```

### Utility Commands

```bash
# List first 10 college records
npm run batch-upload-colleges list

# List first 20 college records
npm run batch-upload-colleges list 20

# Test the uploader (just lists existing records)
npx tsx scripts/test-college-uploader.ts
```

## Features

- **Batch Processing**: Processes records in batches of 500 for optimal performance
- **Concurrent Upload**: Processes up to 5 batches concurrently
- **Error Handling**: Comprehensive error handling and logging
- **Data Validation**: Validates required fields before upload
- **Progress Tracking**: Real-time progress updates with performance metrics
- **Flexible Authentication**: Supports both token and credential-based auth
- **Auto-cancellation Protection**: Prevents request cancellation issues

## PocketBase Collection Schema

The `2024_mht_cet_colleges` collection should have the following fields:
- `college_id` (Number, Required): Unique college identifier
- `college_name` (Text, Required): College name
- `status` (Text): College status/type
- `home_university` (Text): Associated university

## Performance

The uploader is optimized for large datasets:
- Batch size: 500 records per batch
- Concurrent batches: 5 simultaneous uploads
- Typical speed: 1000+ records per second (depending on network)

## Error Handling

- Authentication failures are clearly reported
- Invalid data records are identified and logged
- Batch failures are retried and logged individually
- Network timeouts and connection issues are handled gracefully

## Examples

### Basic Upload
```bash
npm run batch-upload-colleges create
```

### Update Existing Data
```bash
npm run batch-upload-colleges upsert
```

### Fresh Start (Clear and Upload)
```bash
npm run batch-upload-colleges replace
```

### Check Results
```bash
npm run batch-upload-colleges list 10
```

This will show you the first 10 uploaded college records to verify the upload was successful.
