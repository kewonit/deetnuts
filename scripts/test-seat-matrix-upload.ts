import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testSeatMatrixConnection() {
    const pb = new PocketBase(process.env.POCKETBASE_URL || 'https://api.deetnuts.com');

    try {
        console.log('🔑 Testing authentication...');

        // Try token authentication first
        const token = process.env.POCKETBASE_AUTH_TOKEN;
        if (token) {
            pb.authStore.save(token);
            console.log('✅ Using auth token');
        } else {
            // Try credentials
            const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
            const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD;

            if (!adminEmail || !adminPassword) {
                throw new Error('No authentication credentials found');
            }

            await pb.admins.authWithPassword(adminEmail, adminPassword);
            console.log('✅ Authenticated with credentials');
        }

        console.log('📊 Testing collection access...');

        // Test if collection exists and is accessible
        const result = await pb.collection('2024_mht_cet_colleges_seat_matrix').getList(1, 1);
        console.log(`✅ Collection exists with ${result.totalItems} records`);

        // Test create permission with a sample record
        console.log('🧪 Testing create permission...');
        const testRecord = {
            page_number: 9999,
            college_code: 'TEST999',
            college_name: 'Test College',
            choice_code: 'TEST99999',
            course_name: 'Test Course',
            SI: 60,
            MS_seats: 60,
            minority_seats: 0,
            all_india: 0,
            institute_seats: 0,
            orphan: 1,
            CAP_seats: 60,
            seat_type: 'Test',
            OPEN_General: 15,
            OPEN_Ladies: 7,
            SC_General: 6,
            SC_Ladies: 2,
            ST_General: 3,
            ST_Ladies: 1,
            VJ_DT_General: 1,
            VJ_DT_Ladies: 1,
            NTB_General: 1,
            NTB_Ladies: 0,
            NTC_General: 1,
            NTC_Ladies: 1,
            NTD_General: 1,
            NTD_Ladies: 0,
            OBC_General: 6,
            OBC_Ladies: 3,
            SEBC_General: 4,
            SEBC_Ladies: 2,
            Total: 55,
            PWD_total: 2,
            PWD_common_reserved: 1,
            DEF_total: 2,
            DEF_common_reserved: 1,
            EWS_seats: 6,
            TFWS_choice_code: 'TEST99999T',
            TFWS_seats: 3
        };

        const created = await pb.collection('2024_mht_cet_colleges_seat_matrix').create(testRecord);
        console.log(`✅ Test record created with ID: ${created.id}`);

        // Clean up test record
        await pb.collection('2024_mht_cet_colleges_seat_matrix').delete(created.id);
        console.log('✅ Test record deleted');

        console.log('🎉 All tests passed! Ready to upload seat matrix data.');

    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    }
}

if (require.main === module) {
    testSeatMatrixConnection().catch(console.error);
}
