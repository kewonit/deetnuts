import PocketBase from 'pocketbase';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface AllIndiaRoundRecord {
    sr_no: number;
    rank: number;
    percentile: string;
    choice_code: string;
    institute_code: string;
    merit_exam: string;
    type: string;
    seat_type: string;
    college_code: string;
    course_name: string;
    college_name: string;
}

class BatchAllIndiaRoundsUploader {
    private pb: PocketBase;
    private csvFilePath: string;
    private collectionName = '2024_all_india_rounds_one';
    private batchSize = 500; // Reduced batch size for better reliability
    private maxConcurrentBatches = 5; // Reduced concurrent batches to prevent auto-cancellation issues

    constructor(csvFileName: string = 'all-india-2024-round-one.csv') {
        // Initialize PocketBase
        const pbUrl = process.env.POCKETBASE_URL || 'https://api.deetnuts.com';
        this.pb = new PocketBase(pbUrl);

        // Disable auto-cancellation to prevent concurrent batch requests from being cancelled
        this.pb.autoCancellation(false);

        // Set CSV file path
        this.csvFilePath = path.join(__dirname, csvFileName);
    }

    async authenticateWithToken(): Promise<boolean> {
        const token = process.env.POCKETBASE_AUTH_TOKEN;
        if (token) {
            console.log('🔑 Using auth token...');
            this.pb.authStore.save(token);
            return true;
        }
        return false;
    }

    async authenticateWithCredentials(): Promise<boolean> {
        const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
        const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            console.error('❌ Missing admin credentials in environment variables');
            return false;
        }

        try {
            console.log('🔑 Authenticating with credentials...');
            await this.pb.admins.authWithPassword(adminEmail, adminPassword);
            console.log('✅ Successfully authenticated as admin');
            return true;
        } catch (error) {
            console.error('❌ Authentication failed:', error);
            return false;
        }
    }

    async readCSVData(): Promise<AllIndiaRoundRecord[]> {
        return new Promise((resolve, reject) => {
            const records: AllIndiaRoundRecord[] = [];

            createReadStream(this.csvFilePath)
                .pipe(parse({
                    columns: true,
                    skip_empty_lines: true,
                    trim: true
                }))
                .on('data', (row) => {
                    const record: AllIndiaRoundRecord = {
                        sr_no: parseFloat(row.sr_no.replace(/,/g, '')) || 0,
                        rank: parseFloat(row.rank) || 0,
                        percentile: row.percentile?.toString() || '',
                        choice_code: row.choice_code?.toString() || '',
                        institute_code: row.institute_code?.toString() || '',
                        merit_exam: row.merit_exam?.toString() || '',
                        type: row.type?.toString() || '',
                        seat_type: row.seat_type?.toString() || '',
                        college_code: row.college_code?.toString() || '',
                        course_name: row.course_name?.toString() || '',
                        college_name: row.college_name?.toString() || '',
                    };
                    records.push(record);
                })
                .on('end', () => {
                    console.log(`📊 Read ${records.length} records from CSV`);
                    resolve(records);
                })
                .on('error', reject);
        });
    }

    async createBatch(records: AllIndiaRoundRecord[], batchId: string): Promise<any> {
        const batch = this.pb.createBatch();

        for (const record of records) {
            batch.collection(this.collectionName).create(record);
        }

        // Add unique request key to prevent auto-cancellation
        return await batch.send({ requestKey: `batch_create_${batchId}` });
    }

    async upsertBatch(records: AllIndiaRoundRecord[], batchId: string): Promise<any> {
        const batch = this.pb.createBatch();

        for (const record of records) {
            // For upsert, we use sr_no as the unique identifier
            const upsertRecord = {
                ...record,
                id: `${record.sr_no}_${record.choice_code}`
            };
            batch.collection(this.collectionName).upsert(upsertRecord);
        }

        // Add unique request key to prevent auto-cancellation
        return await batch.send({ requestKey: `batch_upsert_${batchId}` });
    }

    async processBatchesConcurrently(batches: AllIndiaRoundRecord[][], operation: 'create' | 'upsert' = 'create'): Promise<void> {
        const batchPromises: Promise<any>[] = [];
        let completedBatches = 0;

        for (let i = 0; i < batches.length; i += this.maxConcurrentBatches) {
            const concurrentBatches = batches.slice(i, i + this.maxConcurrentBatches);

            const concurrentPromises = concurrentBatches.map(async (batch, index) => {
                const actualIndex = i + index;
                const batchId = `${Date.now()}_${actualIndex}`;
                try {
                    const startTime = Date.now();

                    let result;
                    if (operation === 'upsert') {
                        result = await this.upsertBatch(batch, batchId);
                    } else {
                        result = await this.createBatch(batch, batchId);
                    }

                    const endTime = Date.now();
                    const duration = endTime - startTime;

                    completedBatches++;
                    console.log(`✅ Batch ${actualIndex + 1} completed in ${duration}ms (${batch.length} records) - ${completedBatches}/${batches.length} batches done`);

                    return result;
                } catch (error) {
                    console.error(`❌ Batch ${actualIndex + 1} failed:`, error);
                    throw error;
                }
            });

            await Promise.all(concurrentPromises);
        }
    }

    async uploadData(operation: 'create' | 'upsert' = 'create'): Promise<void> {
        try {
            console.log('🚀 Starting All India rounds batch upload process...');
            console.log(`📁 Reading from: ${this.csvFilePath}`);

            // Authenticate
            const authenticated = await this.authenticateWithToken() || await this.authenticateWithCredentials();
            if (!authenticated) {
                throw new Error('Authentication failed');
            }

            // Read CSV data
            const records = await this.readCSVData();

            if (records.length === 0) {
                console.log('⚠️  No records found in CSV file');
                return;
            }

            // Split records into batches
            const batches: AllIndiaRoundRecord[][] = [];
            for (let i = 0; i < records.length; i += this.batchSize) {
                batches.push(records.slice(i, i + this.batchSize));
            }

            console.log(`📦 Created ${batches.length} batches of ${this.batchSize} records each`);
            console.log(`⚡ Processing ${this.maxConcurrentBatches} batches concurrently for maximum speed`);

            const startTime = Date.now();

            // Process batches concurrently
            await this.processBatchesConcurrently(batches, operation);

            const endTime = Date.now();
            const totalDuration = endTime - startTime;
            const recordsPerSecond = Math.round((records.length / totalDuration) * 1000);

            console.log(`🎉 Successfully ${operation === 'upsert' ? 'upserted' : 'created'} ${records.length} records!`);
            console.log(`⏱️  Total time: ${totalDuration}ms (${Math.round(totalDuration / 1000)}s)`);
            console.log(`🚀 Speed: ${recordsPerSecond} records/second`);

        } catch (error) {
            console.error('❌ Upload failed:', error);
            throw error;
        }
    }

    async clearCollection(): Promise<void> {
        try {
            console.log('🧹 Clearing existing records...');

            // Authenticate
            const authenticated = await this.authenticateWithToken() || await this.authenticateWithCredentials();
            if (!authenticated) {
                throw new Error('Authentication failed');
            }

            // Get all records in batches and delete them
            let page = 1;
            let hasMore = true;
            let totalDeleted = 0;

            while (hasMore) {
                const result = await this.pb.collection(this.collectionName).getList(page, 500);

                if (result.items.length === 0) {
                    hasMore = false;
                    break;
                }

                // Create batch delete operation
                const batch = this.pb.createBatch();
                for (const record of result.items) {
                    batch.collection(this.collectionName).delete(record.id);
                }

                await batch.send({ requestKey: `batch_delete_${page}_${Date.now()}` });
                totalDeleted += result.items.length;
                console.log(`🗑️  Deleted ${result.items.length} records (${totalDeleted} total)`);

                page++;
                hasMore = result.items.length === 500; // Continue if we got a full page
            }

            console.log(`✅ Successfully deleted ${totalDeleted} records`);
        } catch (error) {
            console.error('❌ Clear collection failed:', error);
            throw error;
        }
    }

    // Update collection name for different rounds
    setCollectionName(collectionName: string): void {
        this.collectionName = collectionName;
    }

    // Update CSV file path
    setCsvFilePath(csvFileName: string): void {
        this.csvFilePath = path.join(__dirname, csvFileName);
    }
}

// Command line interface
async function main() {
    const csvFileName = process.argv[3] || 'all-india-2024-round-one.csv';
    const collectionSuffix = process.argv[4] || 'one';

    const uploader = new BatchAllIndiaRoundsUploader(csvFileName);
    uploader.setCollectionName(`2024_all_india_rounds_${collectionSuffix}`);

    const command = process.argv[2];

    console.log(`📊 Processing: ${csvFileName}`);
    console.log(`🗄️  Collection: 2024_all_india_rounds_${collectionSuffix}`);

    switch (command) {
        case 'create':
            console.log('📝 Creating new records...');
            await uploader.uploadData('create');
            break;

        case 'upsert':
            console.log('🔄 Upserting records...');
            await uploader.uploadData('upsert');
            break;

        case 'clear':
            console.log('🧹 Clearing collection...');
            await uploader.clearCollection();
            break;

        case 'replace':
            console.log('🔄 Replacing all records (clear + create)...');
            await uploader.clearCollection();
            await uploader.uploadData('create');
            break;

        default:
            console.log('📋 Usage:');
            console.log('  npm run upload-all-india create [csv-file] [collection-suffix]');
            console.log('  npm run upload-all-india upsert [csv-file] [collection-suffix]');
            console.log('  npm run upload-all-india clear [csv-file] [collection-suffix]');
            console.log('  npm run upload-all-india replace [csv-file] [collection-suffix]');
            console.log('');
            console.log('Examples:');
            console.log('  npm run upload-all-india create all-india-2024-round-one.csv one');
            console.log('  npm run upload-all-india create all-india-2024-round-two.csv two');
            console.log('  npm run upload-all-india create all-india-2024-round-three.csv three');
            break;
    }
}

if (require.main === module) {
    main().catch(console.error);
}

export default BatchAllIndiaRoundsUploader;
