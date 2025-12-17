# Batch Upload MHT-CET Cutoffs

This script provides super-fast batch upload functionality for MHT-CET cutoff data using PocketBase's batch API. It's optimized for high-performance uploads with concurrent processing.

## Features

- **Ultra-fast uploads**: Processes 1000 records per batch with 10 concurrent batches
- **Flexible operations**: Create, upsert, clear, or replace records
- **Progress tracking**: Real-time progress updates with timing information
- **Error handling**: Robust error handling and recovery
- **Memory efficient**: Streams CSV data to handle large files
- **Concurrent processing**: Maximizes throughput with controlled concurrency

## CSV Format

The script expects a CSV file with the following columns:

```csv
college_code,college_name,course_code,course_name,category,seat_allocation_section,cutoff_score,last_rank,total_admitted,status,home_university
01002,"Government College of Engineering, Amravati",0100219110,Civil Engineering,DEFOBCS,STATE_LEVEL,47.9842799,124882,1,Government Autonomous,Autonomous Institute
```

## Environment Variables

Set these environment variables in your `.env` file:

```env
POCKETBASE_URL=https://api.deetnuts.com
POCKETBASE_AUTH_TOKEN=your_auth_token_here
# OR use admin credentials
POCKETBASE_ADMIN_EMAIL=admin@example.com
POCKETBASE_ADMIN_PASSWORD=your_password_here
```

## Usage

### 1. Test the Batch API

First, test that the batch API is working correctly:

```bash
npm run test-batch-api
```

### 2. Upload Operations

#### Create New Records
```bash
npm run batch-upload create
```

#### Upsert Records (Create or Update)
```bash
npm run batch-upload upsert
```

#### Clear All Records
```bash
npm run batch-upload clear
```

#### Replace All Records (Clear + Create)
```bash
npm run batch-upload replace
```

## Performance Optimization

The script is configured for maximum performance:

- **Batch Size**: 1000 records per batch
- **Concurrent Batches**: 10 batches processed simultaneously
- **Target Speed**: 10,000+ records/second on elite servers

### Tuning Parameters

You can adjust these parameters in the script:

```typescript
private batchSize = 1000; // Records per batch
private maxConcurrentBatches = 10; // Concurrent batches
```

## PocketBase Configuration

Ensure your PocketBase instance has:

1. **Batch API enabled** in Dashboard settings
2. **Proper timeout settings** for large uploads
3. **Sufficient body size limits** for batch requests
4. **Authentication** properly configured

## CSV File Location

The script looks for `combined_cutoffs.csv` in the same directory. Make sure your CSV file is:

- Named `combined_cutoffs.csv`
- Located in the `scripts/` directory
- Has the correct column headers
- Contains valid data

## Error Handling

The script includes comprehensive error handling:

- **Authentication errors**: Clear messages for auth failures
- **CSV parsing errors**: Detailed error information
- **Batch processing errors**: Individual batch error reporting
- **Network errors**: Automatic retry logic (planned)

## Expected Output

```
🚀 Starting batch upload process...
🔑 Using auth token...
📊 Read 31793 records from CSV
📦 Created 32 batches of 1000 records each
⚡ Processing 10 batches concurrently for maximum speed
✅ Batch 1 completed in 1234ms (1000 records) - 1/32 batches done
✅ Batch 2 completed in 1156ms (1000 records) - 2/32 batches done
...
🎉 Successfully created 31793 records!
⏱️  Total time: 15432ms (15s)
🚀 Speed: 2059 records/second
```

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check your environment variables
   - Verify token/credentials are correct
   - Ensure admin permissions

2. **CSV Parsing Errors**
   - Check CSV format and encoding
   - Verify column headers match expected format
   - Look for special characters or malformed data

3. **Slow Performance**
   - Check network connection
   - Verify PocketBase server capacity
   - Consider reducing batch size or concurrency

4. **Memory Issues**
   - The script streams data to minimize memory usage
   - If issues persist, reduce batch size

### Performance Tips

- Run on a server with good network connection to PocketBase
- Monitor PocketBase server resources during upload
- Use `replace` operation for clean data replacement
- Use `upsert` for incremental updates

## Technical Details

### Batch API Structure

The script uses PocketBase's batch API with this structure:

```typescript
const batch = pb.createBatch();
batch.collection('collection_name').create(record);
batch.collection('collection_name').update(id, record);
batch.collection('collection_name').delete(id);
batch.collection('collection_name').upsert(record);
const result = await batch.send();
```

### Concurrency Control

The script processes batches in groups to prevent overwhelming the server:

```typescript
for (let i = 0; i < batches.length; i += maxConcurrentBatches) {
    const concurrentBatches = batches.slice(i, i + maxConcurrentBatches);
    await Promise.all(concurrentBatches.map(processBatch));
}
```

This ensures controlled concurrency while maximizing throughput.
