import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface AllIndiaRoundRecord {
    id?: string;
    sr_no: number;
    rank: number;
    percentile: number;
    choice_code: string;
    institute_code: string;
    college_code: string;
    course_code: string;
    course_name: string;
    college_name: string;
    mapping_status: string;
    created?: string;
    updated?: string;
}

class AllIndiaRoundsAPITester {
    private pb: PocketBase;

    constructor() {
        const pbUrl = process.env.POCKETBASE_URL || 'https://api.deetnuts.com';
        this.pb = new PocketBase(pbUrl);
        this.pb.autoCancellation(false);
    }

    async authenticate(): Promise<boolean> {
        // Try token first
        const token = process.env.POCKETBASE_AUTH_TOKEN;
        if (token) {
            console.log('🔑 Using auth token...');
            this.pb.authStore.save(token);
            return true;
        }

        // Fallback to credentials
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

    async testCollectionOperations(collectionName: string): Promise<void> {
        console.log(`\n🧪 Testing collection: ${collectionName}`);
        console.log('='.repeat(50));

        try {
            // Test 1: Get paginated list
            console.log('📄 Test 1: Fetching paginated records list...');
            const resultList = await this.pb.collection(collectionName).getList(1, 10, {
                sort: '-sr_no'
            });
            console.log(`✅ Found ${resultList.totalItems} total records, showing ${resultList.items.length} on page 1`);
            if (resultList.items.length > 0) {
                const firstRecord = resultList.items[0] as any;
                console.log(`   First record: SR ${firstRecord.sr_no}, Rank ${firstRecord.rank}, College: ${firstRecord.college_name}`);
            }

            // Test 2: Get records with filtering
            console.log('\n🔍 Test 2: Fetching records with filter (rank < 50000)...');
            const filteredResults = await this.pb.collection(collectionName).getList(1, 5, {
                filter: 'rank < 50000',
                sort: 'rank'
            });
            console.log(`✅ Found ${filteredResults.totalItems} records with rank < 50000`);
            filteredResults.items.forEach((record: any, index) => {
                console.log(`   ${index + 1}. Rank ${record.rank}, Percentile ${record.percentile}, Course: ${record.course_name}`);
            });

            // Test 3: Search by college name
            console.log('\n🏫 Test 3: Searching by college name (contains "Engineering")...');
            const collegeResults = await this.pb.collection(collectionName).getList(1, 5, {
                filter: 'college_name ~ "Engineering"',
                sort: 'rank'
            });
            console.log(`✅ Found ${collegeResults.totalItems} records with "Engineering" in college name`);
            collegeResults.items.forEach((record: any, index) => {
                console.log(`   ${index + 1}. ${record.college_name.substring(0, 60)}...`);
            });

            // Test 4: Get specific record by choice_code
            console.log('\n🎯 Test 4: Fetching first record to get a choice_code...');
            if (resultList.items.length > 0) {
                const sampleRecord = resultList.items[0] as any;
                const specificRecord = await this.pb.collection(collectionName).getFirstListItem(
                    `choice_code="${sampleRecord.choice_code}"`
                );
                console.log(`✅ Found specific record with choice_code: ${specificRecord.choice_code}`);
                console.log(`   College: ${specificRecord.college_name}`);
                console.log(`   Course: ${specificRecord.course_name}`);
                console.log(`   Rank: ${specificRecord.rank}, Percentile: ${specificRecord.percentile}`);
            }

            // Test 5: Get records sorted by percentile (highest first)
            console.log('\n📊 Test 5: Fetching top 5 records by percentile...');
            const topPercentileRecords = await this.pb.collection(collectionName).getList(1, 5, {
                sort: '-percentile'
            });
            console.log(`✅ Top 5 records by percentile:`);
            topPercentileRecords.items.forEach((record: any, index) => {
                console.log(`   ${index + 1}. Percentile ${record.percentile}, Rank ${record.rank}, Course: ${record.course_name}`);
            });

            // Test 6: Test field selection
            console.log('\n🎯 Test 6: Fetching records with specific fields only...');
            const fieldResults = await this.pb.collection(collectionName).getList(1, 3, {
                fields: 'id,sr_no,rank,percentile,college_name,course_name',
                sort: 'rank'
            });
            console.log(`✅ Fetched ${fieldResults.items.length} records with selected fields only`);
            fieldResults.items.forEach((record: any, index) => {
                console.log(`   ${index + 1}. SR ${record.sr_no}, Rank ${record.rank}, College: ${record.college_name.substring(0, 40)}...`);
            });

        } catch (error) {
            console.error(`❌ Error testing collection ${collectionName}:`, error);
        }
    }

    async testAllCollections(): Promise<void> {
        console.log('🚀 Starting All India Rounds API Tests...');

        // Authenticate
        const authenticated = await this.authenticate();
        if (!authenticated) {
            throw new Error('Authentication failed');
        }

        // Test all three collections
        const collections = [
            '2024_all_india_rounds_one',
            '2024_all_india_rounds_two',
            '2024_all_india_rounds_three'
        ];

        for (const collection of collections) {
            await this.testCollectionOperations(collection);
        }

        console.log('\n🎉 All API tests completed!');
    }
}

// Command line interface
async function main() {
    const tester = new AllIndiaRoundsAPITester();

    const collectionName = process.argv[2];

    if (collectionName) {
        console.log(`🧪 Testing specific collection: ${collectionName}`);
        await tester.authenticate();
        await tester.testCollectionOperations(collectionName);
    } else {
        console.log('🧪 Testing all All India rounds collections...');
        await tester.testAllCollections();
    }
}

if (require.main === module) {
    main().catch(console.error);
}

export default AllIndiaRoundsAPITester;
