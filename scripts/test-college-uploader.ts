import BatchCollegeUploader from './batch-upload-colleges';

async function testCollegeUploader() {
    const uploader = new BatchCollegeUploader();

    console.log('🧪 Testing College Uploader...');

    try {
        // First, try to list existing colleges
        console.log('\n📋 Testing list functionality:');
        await uploader.listColleges(5);

        console.log('\n✅ College uploader test completed successfully!');

    } catch (error) {
        console.error('❌ College uploader test failed:', error);
        throw error;
    }
}

if (require.main === module) {
    testCollegeUploader().catch(console.error);
}

export default testCollegeUploader;
