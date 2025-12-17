# Seat Matrix Batch Uploader

This script uploads the 2024 MHT-CET colleges seat matrix data from CSV to PocketBase.

## Prerequisites

1. Ensure the CSV file `2024_seat_matrix_complete.csv` is in the `/scripts` directory
2. Set up environment variables in `.env` file:
   ```
   POCKETBASE_URL=https://api.deetnuts.com
   POCKETBASE_AUTH_TOKEN=your_token_here
   # OR use admin credentials:
   POCKETBASE_ADMIN_EMAIL=your_email@example.com
   POCKETBASE_ADMIN_PASSWORD=your_password
   ```

## Usage

### Validate CSV file (recommended first step)
```bash
npm run batch-upload-seat-matrix validate
```

### Upload data
```bash
# Create new records (fails if records already exist)
npm run batch-upload-seat-matrix create

# Upsert records (create or update)
npm run batch-upload-seat-matrix upsert

# Clear all existing records and create new ones
npm run batch-upload-seat-matrix replace
```

### Manage data
```bash
# Clear all records
npm run batch-upload-seat-matrix clear

# List first 10 records
npm run batch-upload-seat-matrix list

# List first 50 records
npm run batch-upload-seat-matrix list 50

# Show collection statistics
npm run batch-upload-seat-matrix stats
```

## CSV Structure

The CSV file should have the following columns:
- `page_number`: Page number in the original document
- `college_code`: Unique college identifier
- `college_name`: Full college name
- `choice_code`: Unique course choice identifier
- `course_name`: Course name
- `SI`: Sanctioned Intake
- `MS_seats`: Management/Minority seats
- `minority_seats`: Minority seats
- `all_india`: All India quota seats
- `institute_seats`: Institute quota seats
- `orphan`: Orphan seats
- `CAP_seats`: CAP (Centralized Admission Process) seats
- `seat_type`: Type of seat (e.g., "State_Level")
- Category-wise seat distribution:
  - `OPEN_General`, `OPEN_Ladies`
  - `SC_General`, `SC_Ladies`
  - `ST_General`, `ST_Ladies`
  - `VJ_DT_General`, `VJ_DT_Ladies`
  - `NTB_General`, `NTB_Ladies`
  - `NTC_General`, `NTC_Ladies`
  - `NTD_General`, `NTD_Ladies`
  - `OBC_General`, `OBC_Ladies`
  - `SEBC_General`, `SEBC_Ladies`
- `Total`: Total seats
- `PWD_total`: PWD total seats
- `PWD_common_reserved`: PWD common reserved seats
- `DEF_total`: DEF total seats
- `DEF_common_reserved`: DEF common reserved seats
- `EWS_seats`: EWS (Economically Weaker Section) seats
- `TFWS_choice_code`: TFWS choice code
- `TFWS_seats`: TFWS (Tuition Fee Waiver Scheme) seats

## Performance

The script uses:
- Batch processing (500 records per batch)
- Concurrent batch processing (5 batches at a time)
- Auto-cancellation disabled to prevent request conflicts
- Unique request keys for each batch

## Error Handling

- Invalid records are skipped with warnings
- Missing required fields are logged
- Batch failures are logged with details
- Authentication errors are handled gracefully

## Collection Name

The data is uploaded to the PocketBase collection: `2024_mht_cet_colleges_seat_matrix`

## Notes

- The script uses `choice_code` as the unique identifier for upsert operations
- All numeric fields default to 0 if empty or invalid
- String fields are trimmed and default to empty string if null/undefined
- The script validates required fields: `college_code`, `college_name`, `choice_code`, `course_name`
