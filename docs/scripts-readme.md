# Scripts Documentation

This folder contains utility scripts for data management and database operations.

## Upload MHT-CET Cutoffs Script

### Overview
The `upload-mht-cet-cutoffs.ts` script reads the `combined_cutoffs.csv` file and uploads all records to the PocketBase `2024_mht_cet_round_one_cutoffs` collection.

### Prerequisites

1. **Environment Variables**: Set up your PocketBase admin credentials
   ```bash
   # Add to your .env file:
   POCKETBASE_URL=https://api.deetnuts.com
   POCKETBASE_ADMIN_EMAIL=your-admin-email@example.com
   POCKETBASE_ADMIN_PASSWORD=your-admin-password
   ```

2. **PocketBase Collection**: Ensure the `2024_mht_cet_round_one_cutoffs` collection exists with the following fields:
   - `college_code` (String)
   - `college_name` (String)
   - `course_code` (String)
   - `course_name` (String)
   - `category` (String)
   - `seat_allocation_section` (String)
   - `cutoff_score` (String)
   - `last_rank` (String)
   - `total_admitted` (Number)

### Usage

1. **Install dependencies** (if not already installed):
   ```bash
   npm install
   ```

2. **Run the upload script**:
   ```bash
   npx tsx scripts/upload-mht-cet-cutoffs.ts
   ```

   Or add to package.json scripts:
   ```bash
   npm run upload-cutoffs
   ```

### Features

- **Batch Processing**: Uploads records in batches of 100 to avoid overwhelming the server
- **Progress Tracking**: Shows upload progress and statistics
- **Error Handling**: Continues processing even if individual records fail
- **Authentication**: Automatically authenticates with PocketBase admin credentials
- **Data Validation**: Converts string numbers to proper numeric types
- **Rate Limiting**: Includes small delays between batches to be server-friendly

### Sample Output

```
🚀 Starting MHT-CET Cutoffs Upload Process...

🔐 Authenticating...
✅ Successfully authenticated as admin

🔍 Checking collection...
✅ Collection '2024_mht_cet_round_one_cutoffs' found

📖 Reading CSV file...
📊 Read 31794 records from CSV

⬆️  Starting upload...
🚀 Starting upload of 31794 records...
📦 Processing batch 1 (records 1-100)
✅ Uploaded 500 records...
✅ Uploaded 1000 records...
...

📈 Upload Summary:
✅ Successfully uploaded: 31794 records
❌ Failed uploads: 0 records
📊 Total processed: 31794 records

🎉 Upload process completed!
```

### Troubleshooting

1. **Authentication Error**: Verify your admin email and password in the environment variables
2. **Collection Not Found**: Ensure the collection exists in PocketBase with the correct name
3. **CSV File Not Found**: Verify the `combined_cutoffs.csv` file is in the project root
4. **Network Errors**: Check your internet connection and PocketBase server availability

### Data Format

The script expects CSV data with the following columns:
- college_code
- college_name
- course_code
- course_name
- category
- seat_allocation_section
- cutoff_score
- last_rank
- total_admitted
