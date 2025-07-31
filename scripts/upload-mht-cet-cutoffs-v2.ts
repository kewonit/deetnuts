import PocketBase from 'pocketbase';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface CutoffRecord {
    college_code: string;
    college_name: string;
    course_code: string;
    course_name: string;
    category: string;
    seat_allocation_section: string;
    cutoff_score: string;
    last_rank: string;
    total_admitted: number;
}

class MHTCETCutoffUploader {
    private pb: PocketBase;
    private csvFilePath: string;
    private collectionName = '2025_mht_cet_round_one_cutoffs';
    private authToken: string | null = null;

    constructor() {
        // Initialize PocketBase - adjust URL as needed
        const pbUrl = process.env.POCKETBASE_URL || 'https://api.deetnuts.com';
        this.pb = new PocketBase(pbUrl);
        this.pb.autoCancellation(false); // Disable auto-cancellation for bulk uploads

        // Set CSV file path - the CSV is in the scripts folder
        this.csvFilePath = path.join(__dirname, 'combined_cutoffs_with_status.csv');
    }

    async authenticateWithToken() {
        const token = process.env.POCKETBASE_AUTH_TOKEN;
        if (token) {
            console.log('🔑 Using auth token...');
            this.pb.authStore.save(token);
            return true;
        }
        return false;
    }

    async authenticateWithCredentials() {
        const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
        const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD;

        console.log('🔍 Debug info:');
        console.log(`   Email: ${adminEmail ? adminEmail.substring(0, 3) + '***' : 'NOT SET'}`);
        console.log(`   Password: ${adminPassword ? '***' + adminPassword.substring(adminPassword.length - 3) : 'NOT SET'}`);
        console.log(`   PocketBase URL: ${this.pb.baseUrl}`);

        if (!adminEmail || !adminPassword) {
            throw new Error(
                'POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD must be set in environment variables'
            );
        }

        // Try different authentication methods
        const authMethods = [
            { name: 'Admin', method: () => this.pb.admins.authWithPassword(adminEmail, adminPassword) },
            { name: 'Users collection', method: () => this.pb.collection('users').authWithPassword(adminEmail, adminPassword) },
            { name: 'Superusers collection', method: () => this.pb.collection('_superusers').authWithPassword(adminEmail, adminPassword) }
        ];

        for (const authMethod of authMethods) {
            try {
                console.log(`🔑 Attempting ${authMethod.name} authentication...`);
                await authMethod.method();
                console.log(`✅ Successfully authenticated via ${authMethod.name}`);
                return true;
            } catch (error: any) {
                console.log(`❌ ${authMethod.name} authentication failed:`, error.response?.message || error.message);
            }
        }

        return false;
    }

    async authenticate() {
        // Try token authentication first
        if (await this.authenticateWithToken()) {
            return;
        }

        // Fallback to credentials
        const success = await this.authenticateWithCredentials();
        if (!success) {
            throw new Error('All authentication methods failed. Please check your credentials.');
        }
    }

    async readCSVFile(): Promise<CutoffRecord[]> {
        console.log(`📂 Reading CSV file: ${this.csvFilePath}`);

        return new Promise((resolve, reject) => {
            const records: CutoffRecord[] = [];

            createReadStream(this.csvFilePath)
                .pipe(parse({
                    columns: true,
                    skip_empty_lines: true,
                    trim: true
                }))
                .on('data', (row) => {
                    // Convert total_admitted to number
                    const record: CutoffRecord = {
                        ...row,
                        total_admitted: parseInt(row.total_admitted) || 0
                    };
                    records.push(record);
                })
                .on('end', () => {
                    console.log(`📊 Read ${records.length} records from CSV`);
                    resolve(records);
                })
                .on('error', (error) => {
                    console.error('❌ Error reading CSV file:', error);
                    reject(error);
                });
        });
    }

    async uploadRecords(records: CutoffRecord[]) {
        console.log(`🚀 Starting upload of ${records.length} records...`);

        let successCount = 0;
        let errorCount = 0;
        const batchSize = 500; // Increased batch size for performance.

        for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);
            console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1} (records ${i + 1}-${Math.min(i + batchSize, records.length)})`);

            const uploadPromises = batch.map((record, j) => {
                const recordIndex = i + j;
                return this.pb.collection(this.collectionName).create(record)
                    .then(() => {
                        successCount++;
                        if (successCount % 100 === 0) {
                            console.log(`✅ Uploaded ${successCount} records...`);
                        }
                    })
                    .catch((error: any) => {
                        errorCount++;
                        console.error(`❌ Error uploading record ${recordIndex + 1}:`, error.response?.message || error.message);

                        // Log the problematic record for debugging
                        if (errorCount <= 5) { // Only log first 5 errors to avoid spam
                            console.error('Record data:', record);
                        }
                    });
            });

            // Process batch concurrently without any delay
            await Promise.all(uploadPromises);
        }

        console.log(`\n📈 Upload Summary:`);
        console.log(`✅ Successfully uploaded: ${successCount} records`);
        console.log(`❌ Failed uploads: ${errorCount} records`);
        console.log(`📊 Total processed: ${records.length} records`);

        if (errorCount > 0) {
            console.log(`\n💡 If there were errors, they might be due to:`);
            console.log(`   - Duplicate records (if unique constraints exist)`);
            console.log(`   - Invalid data format`);
            console.log(`   - Network timeouts`);
            console.log(`   - Collection schema mismatches`);
        }
    }

    async checkCollectionExists(): Promise<boolean> {
        try {
            await this.pb.collection(this.collectionName).getList(1, 1);
            return true;
        } catch (error: any) {
            console.error(`Collection check failed:`, error.response?.message || error.message);
            return false;
        }
    }

    async testCollectionAccess() {
        console.log(`🔍 Testing collection "${this.collectionName}" access...`);

        try {
            // Try to get collection info
            const result = await this.pb.collection(this.collectionName).getList(1, 1);
            console.log(`✅ Collection accessible - found ${result.totalItems} existing records`);
            return true;
        } catch (error: any) {
            console.error(`❌ Collection access failed:`, error.response?.message || error.message);

            // Try to list all collections to see what's available
            try {
                const collections = await this.pb.collections.getList();
                console.log(`📋 Available collections:`);
                collections.items.forEach(c => {
                    console.log(`   - ${c.name} (${c.id})`);
                });
            } catch (listError: any) {
                console.error(`Cannot list collections:`, listError.response?.message || listError.message);
            }

            return false;
        }
    }

    async run() {
        try {
            console.log('🚀 Starting MHT-CET Cutoffs Upload Process...\n');

            // Step 1: Authenticate
            console.log('🔐 Authenticating...');
            await this.authenticate();

            // Step 2: Test collection access
            console.log('🔍 Testing collection access...');
            const canAccess = await this.testCollectionAccess();
            if (!canAccess) {
                console.error(`❌ Cannot access collection '${this.collectionName}'. Please ensure:`);
                console.error(`   1. The collection exists`);
                console.error(`   2. You have proper permissions`);
                console.error(`   3. The collection name is correct`);
                return;
            }

            // Step 3: Read CSV file
            console.log('📖 Reading CSV file...');
            const records = await this.readCSVFile();

            // Step 4: Upload records
            console.log('⬆️  Starting upload...');
            await this.uploadRecords(records);

            console.log('\n🎉 Upload process completed!');

        } catch (error) {
            console.error('💥 Fatal error during upload process:', error);
            process.exit(1);
        }
    }
}

// Run the uploader if this file is executed directly
if (require.main === module) {
    const uploader = new MHTCETCutoffUploader();
    uploader.run();
}