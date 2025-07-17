import PocketBase from 'pocketbase';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface SeatMatrixRecord {
    page_number: number;
    college_code: string;
    college_name: string;
    choice_code: string;
    course_name: string;
    SI: number;
    MS_seats: number;
    minority_seats: number;
    all_india: number;
    institute_seats: number;
    orphan: number;
    CAP_seats: number;
    seat_type: string;
    OPEN_General: number;
    OPEN_Ladies: number;
    SC_General: number;
    SC_Ladies: number;
    ST_General: number;
    ST_Ladies: number;
    VJ_DT_General: number;
    VJ_DT_Ladies: number;
    NTB_General: number;
    NTB_Ladies: number;
    NTC_General: number;
    NTC_Ladies: number;
    NTD_General: number;
    NTD_Ladies: number;
    OBC_General: number;
    OBC_Ladies: number;
    SEBC_General: number;
    SEBC_Ladies: number;
    Total: number;
    PWD_total: number;
    PWD_common_reserved: number;
    DEF_total: number;
    DEF_common_reserved: number;
    EWS_seats: number;
    TFWS_choice_code: string;
    TFWS_seats: number;
}

class BatchSeatMatrixUploader {
    private pb: PocketBase;
    private csvFilePath: string;
    private collectionName = '2024_mht_cet_colleges_seat_matrix';
    private batchSize = 500; // Reduced batch size for better reliability
    private maxConcurrentBatches = 5; // Reduced concurrent batches to prevent auto-cancellation issues

    constructor() {
        // Initialize PocketBase
        const pbUrl = process.env.POCKETBASE_URL || 'https://api.deetnuts.com';
        this.pb = new PocketBase(pbUrl);

        // Disable auto-cancellation to prevent concurrent batch requests from being cancelled
        this.pb.autoCancellation(false);

        // Set CSV file path
        this.csvFilePath = path.join(__dirname, '2024_seat_matrix_complete.csv');
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

    private parseIntegerField(value: any): number {
        if (value === null || value === undefined || value === '') {
            return 0;
        }
        const parsed = parseInt(value.toString().trim());
        return isNaN(parsed) ? 0 : parsed;
    }

    private parseStringField(value: any): string {
        if (value === null || value === undefined) {
            return '';
        }
        return value.toString().trim();
    }

    async readCSVData(): Promise<SeatMatrixRecord[]> {
        return new Promise((resolve, reject) => {
            const records: SeatMatrixRecord[] = [];
            let lineNumber = 0;
            let skippedRecords = 0;

            createReadStream(this.csvFilePath)
                .pipe(parse({
                    columns: true,
                    skip_empty_lines: true,
                    trim: true,
                    relax_column_count: true, // Allow inconsistent column count
                    relax_quotes: true // Allow inconsistent quoting
                }))
                .on('data', (row) => {
                    lineNumber++;
                    try {
                        // Validate required fields
                        if (!row.college_code || !row.college_name || !row.choice_code || !row.course_name) {
                            console.warn(`⚠️  Skipping line ${lineNumber}: Missing required fields`);
                            skippedRecords++;
                            return;
                        }

                        const record: SeatMatrixRecord = {
                            page_number: this.parseIntegerField(row.page_number),
                            college_code: this.parseStringField(row.college_code),
                            college_name: this.parseStringField(row.college_name),
                            choice_code: this.parseStringField(row.choice_code),
                            course_name: this.parseStringField(row.course_name),
                            SI: this.parseIntegerField(row.SI),
                            MS_seats: this.parseIntegerField(row.MS_seats),
                            minority_seats: this.parseIntegerField(row.minority_seats),
                            all_india: this.parseIntegerField(row.all_india),
                            institute_seats: this.parseIntegerField(row.institute_seats),
                            orphan: this.parseIntegerField(row.orphan),
                            CAP_seats: this.parseIntegerField(row.CAP_seats),
                            seat_type: this.parseStringField(row.seat_type),
                            OPEN_General: this.parseIntegerField(row.OPEN_General),
                            OPEN_Ladies: this.parseIntegerField(row.OPEN_Ladies),
                            SC_General: this.parseIntegerField(row.SC_General),
                            SC_Ladies: this.parseIntegerField(row.SC_Ladies),
                            ST_General: this.parseIntegerField(row.ST_General),
                            ST_Ladies: this.parseIntegerField(row.ST_Ladies),
                            VJ_DT_General: this.parseIntegerField(row.VJ_DT_General),
                            VJ_DT_Ladies: this.parseIntegerField(row.VJ_DT_Ladies),
                            NTB_General: this.parseIntegerField(row.NTB_General),
                            NTB_Ladies: this.parseIntegerField(row.NTB_Ladies),
                            NTC_General: this.parseIntegerField(row.NTC_General),
                            NTC_Ladies: this.parseIntegerField(row.NTC_Ladies),
                            NTD_General: this.parseIntegerField(row.NTD_General),
                            NTD_Ladies: this.parseIntegerField(row.NTD_Ladies),
                            OBC_General: this.parseIntegerField(row.OBC_General),
                            OBC_Ladies: this.parseIntegerField(row.OBC_Ladies),
                            SEBC_General: this.parseIntegerField(row.SEBC_General),
                            SEBC_Ladies: this.parseIntegerField(row.SEBC_Ladies),
                            Total: this.parseIntegerField(row.Total),
                            PWD_total: this.parseIntegerField(row.PWD_total),
                            PWD_common_reserved: this.parseIntegerField(row.PWD_common_reserved),
                            DEF_total: this.parseIntegerField(row.DEF_total),
                            DEF_common_reserved: this.parseIntegerField(row.DEF_common_reserved),
                            EWS_seats: this.parseIntegerField(row.EWS_seats),
                            TFWS_choice_code: this.parseStringField(row.TFWS_choice_code),
                            TFWS_seats: this.parseIntegerField(row.TFWS_seats)
                        };

                        // Additional validation
                        if (!record.college_code || !record.choice_code) {
                            console.warn(`⚠️  Skipping line ${lineNumber}: Invalid college_code or choice_code`);
                            skippedRecords++;
                            return;
                        }

                        records.push(record);
                    } catch (error) {
                        console.warn(`⚠️  Error processing line ${lineNumber}:`, error);
                        skippedRecords++;
                    }
                })
                .on('end', () => {
                    console.log(`📊 Read ${records.length} seat matrix records from CSV`);
                    if (skippedRecords > 0) {
                        console.log(`⚠️  Skipped ${skippedRecords} invalid records`);
                    }
                    resolve(records);
                })
                .on('error', (error) => {
                    console.error(`❌ CSV parsing error:`, error);
                    reject(error);
                });
        });
    }

    async createBatch(records: SeatMatrixRecord[], batchId: string): Promise<any> {
        const batch = this.pb.createBatch();

        for (const record of records) {
            batch.collection(this.collectionName).create(record);
        }

        // Add unique request key to prevent auto-cancellation
        return await batch.send({ requestKey: `batch_create_seat_matrix_${batchId}` });
    }

    async upsertBatch(records: SeatMatrixRecord[], batchId: string): Promise<any> {
        const batch = this.pb.createBatch();

        for (const record of records) {
            // For upsert, we use choice_code as the unique identifier
            const upsertRecord = {
                ...record,
                id: record.choice_code
            };
            batch.collection(this.collectionName).upsert(upsertRecord);
        }

        // Add unique request key to prevent auto-cancellation
        return await batch.send({ requestKey: `batch_upsert_seat_matrix_${batchId}` });
    }

    async processBatchesConcurrently(batches: SeatMatrixRecord[][], operation: 'create' | 'upsert' = 'create'): Promise<void> {
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
            console.log('🚀 Starting seat matrix batch upload process...');

            // Authenticate
            const authenticated = await this.authenticateWithToken() || await this.authenticateWithCredentials();
            if (!authenticated) {
                throw new Error('Authentication failed');
            }

            // Read CSV data
            const records = await this.readCSVData();

            if (records.length === 0) {
                console.log('⚠️  No seat matrix records found in CSV file');
                return;
            }

            // Validate data
            const invalidRecords = records.filter(r => !r.college_code || !r.choice_code);
            if (invalidRecords.length > 0) {
                console.warn(`⚠️  Found ${invalidRecords.length} records with missing college_code or choice_code`);
            }

            // Split records into batches
            const batches: SeatMatrixRecord[][] = [];
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

            console.log(`🎉 Successfully ${operation === 'upsert' ? 'upserted' : 'created'} ${records.length} seat matrix records!`);
            console.log(`⏱️  Total time: ${totalDuration}ms (${Math.round(totalDuration / 1000)}s)`);
            console.log(`🚀 Speed: ${recordsPerSecond} records/second`);

        } catch (error) {
            console.error('❌ Seat matrix upload failed:', error);
            throw error;
        }
    }

    async clearCollection(): Promise<void> {
        try {
            console.log('🧹 Clearing existing seat matrix records...');

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

                await batch.send({ requestKey: `batch_delete_seat_matrix_${page}_${Date.now()}` });
                totalDeleted += result.items.length;
                console.log(`🗑️  Deleted ${result.items.length} seat matrix records (${totalDeleted} total)`);

                page++;
                hasMore = result.items.length === 500; // Continue if we got a full page
            }

            console.log(`✅ Successfully deleted ${totalDeleted} seat matrix records`);
        } catch (error) {
            console.error('❌ Clear seat matrix collection failed:', error);
            throw error;
        }
    }

    async validateCSV(): Promise<void> {
        try {
            console.log('🔍 Validating CSV file...');

            // Check if file exists
            const fs = require('fs');
            if (!fs.existsSync(this.csvFilePath)) {
                throw new Error(`CSV file not found: ${this.csvFilePath}`);
            }

            // Read and validate data
            const records = await this.readCSVData();

            if (records.length === 0) {
                console.log('⚠️  No valid records found in CSV file');
                return;
            }

            // Show sample of data
            console.log(`✅ Validation successful! Found ${records.length} valid records`);
            console.log('\n📋 Sample records:');

            const sampleSize = Math.min(3, records.length);
            for (let i = 0; i < sampleSize; i++) {
                const record = records[i];
                console.log(`${i + 1}. College: ${record.college_code} - ${record.college_name}`);
                console.log(`   Course: ${record.choice_code} - ${record.course_name}`);
                console.log(`   Total Seats: ${record.Total}, CAP Seats: ${record.CAP_seats}`);
                console.log(`   Seat Type: ${record.seat_type}`);
                console.log('');
            }

            // Show statistics
            const collegeCounts = records.reduce((acc, record) => {
                acc[record.college_code] = (acc[record.college_code] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const seatTypeCounts = records.reduce((acc, record) => {
                acc[record.seat_type] = (acc[record.seat_type] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            console.log('📊 Statistics:');
            console.log(`   Total colleges: ${Object.keys(collegeCounts).length}`);
            console.log(`   Total courses: ${records.length}`);
            console.log(`   Total seats: ${records.reduce((sum, r) => sum + r.Total, 0)}`);

            console.log('\n📊 Seat type distribution:');
            Object.entries(seatTypeCounts).forEach(([type, count]) => {
                console.log(`   ${type}: ${count} courses`);
            });

            console.log('\n📊 Top 5 colleges by course count:');
            const topColleges = Object.entries(collegeCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5);

            topColleges.forEach(([collegeCode, count]) => {
                const collegeName = records.find(r => r.college_code === collegeCode)?.college_name || 'Unknown';
                console.log(`   ${collegeCode} - ${collegeName}: ${count} courses`);
            });

        } catch (error) {
            console.error('❌ CSV validation failed:', error);
            throw error;
        }
    }

    async listRecords(limit: number = 10): Promise<void> {
        try {
            console.log(`📋 Listing first ${limit} seat matrix records...`);

            // Authenticate
            const authenticated = await this.authenticateWithToken() || await this.authenticateWithCredentials();
            if (!authenticated) {
                throw new Error('Authentication failed');
            }

            const result = await this.pb.collection(this.collectionName).getList(1, limit, {
                sort: 'page_number,college_code,choice_code'
            });

            console.log(`📊 Found ${result.totalItems} total seat matrix records`);
            console.log(`📄 Showing first ${result.items.length} records:\n`);

            result.items.forEach((record, index) => {
                console.log(`${index + 1}. ${record.college_code} - ${record.college_name}`);
                console.log(`   Course: ${record.choice_code} - ${record.course_name}`);
                console.log(`   Total Seats: ${record.Total}, CAP Seats: ${record.CAP_seats}`);
                console.log(`   Seat Type: ${record.seat_type}`);
                console.log('');
            });

        } catch (error) {
            console.error('❌ List seat matrix records failed:', error);
            throw error;
        }
    }

    async getStatistics(): Promise<void> {
        try {
            console.log('📊 Getting seat matrix statistics...');

            // Authenticate
            const authenticated = await this.authenticateWithToken() || await this.authenticateWithCredentials();
            if (!authenticated) {
                throw new Error('Authentication failed');
            }

            // Get total count
            const totalResult = await this.pb.collection(this.collectionName).getList(1, 1);
            console.log(`📈 Total records: ${totalResult.totalItems}`);

            // Get sample of records for statistics
            const sampleResult = await this.pb.collection(this.collectionName).getList(1, 1000);
            const records = sampleResult.items;

            if (records.length === 0) {
                console.log('⚠️  No records found in collection');
                return;
            }

            // Calculate statistics
            const totalSeats = records.reduce((sum, r) => sum + (r.Total || 0), 0);
            const totalCAPSeats = records.reduce((sum, r) => sum + (r.CAP_seats || 0), 0);

            const uniqueColleges = new Set(records.map(r => r.college_code)).size;
            const uniqueCourses = records.length;

            const seatTypeStats = records.reduce((acc, record) => {
                acc[record.seat_type] = (acc[record.seat_type] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            console.log(`📊 Statistics (based on ${records.length} records):`);
            console.log(`   Total seats: ${totalSeats.toLocaleString()}`);
            console.log(`   Total CAP seats: ${totalCAPSeats.toLocaleString()}`);
            console.log(`   Unique colleges: ${uniqueColleges}`);
            console.log(`   Total courses: ${uniqueCourses}`);

            console.log('\n📊 Seat type distribution:');
            Object.entries(seatTypeStats).forEach(([type, count]) => {
                console.log(`   ${type}: ${count} courses`);
            });

        } catch (error) {
            console.error('❌ Get statistics failed:', error);
            throw error;
        }
    }
}

// Command line interface
async function main() {
    const uploader = new BatchSeatMatrixUploader();

    const command = process.argv[2];
    const limit = parseInt(process.argv[3]) || 10;

    switch (command) {
        case 'create':
            console.log('📝 Creating new seat matrix records...');
            await uploader.uploadData('create');
            break;

        case 'upsert':
            console.log('🔄 Upserting seat matrix records...');
            await uploader.uploadData('upsert');
            break;

        case 'clear':
            console.log('🧹 Clearing seat matrix collection...');
            await uploader.clearCollection();
            break;

        case 'replace':
            console.log('🔄 Replacing all seat matrix records (clear + create)...');
            await uploader.clearCollection();
            await uploader.uploadData('create');
            break;

        case 'list':
            await uploader.listRecords(limit);
            break;

        case 'validate':
            await uploader.validateCSV();
            break;

        case 'stats':
            await uploader.getStatistics();
            break;

        default:
            console.log('📋 Usage:');
            console.log('  npm run batch-upload-seat-matrix create    - Create new seat matrix records');
            console.log('  npm run batch-upload-seat-matrix upsert    - Upsert seat matrix records (create or update)');
            console.log('  npm run batch-upload-seat-matrix clear     - Clear all seat matrix records');
            console.log('  npm run batch-upload-seat-matrix replace   - Clear and create (full replace)');
            console.log('  npm run batch-upload-seat-matrix list [n]  - List first n seat matrix records (default: 10)');
            console.log('  npm run batch-upload-seat-matrix validate  - Validate CSV file without uploading');
            console.log('  npm run batch-upload-seat-matrix stats     - Show collection statistics');
            console.log('');
            console.log('Examples:');
            console.log('  npm run batch-upload-seat-matrix validate');
            console.log('  npm run batch-upload-seat-matrix create');
            console.log('  npm run batch-upload-seat-matrix list 20');
            console.log('  npm run batch-upload-seat-matrix stats');
            break;
    }
}

if (require.main === module) {
    main().catch(console.error);
}

export default BatchSeatMatrixUploader;
