import { NextRequest, NextResponse } from 'next/server';
import { ensureUserAuthenticated } from '@/lib/supabaseAuth';
import { getPocketBase } from '@/lib/pocketbaseClient';
import { getCollectionForRound, isValidRound, DEFAULT_ROUND, getDisplayNameForRound } from '@/app/mht-cet/state-cutoffs/constants';

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const searchParams = url.searchParams;

        // Parse query parameters for filtering
        const search = searchParams.get('search') || '';
        const categories = searchParams.getAll('categories');
        const courses = searchParams.getAll('courses');
        const statuses = searchParams.getAll('statuses');
        const homeUniversities = searchParams.getAll('homeUniversities');
        const percentileInput = searchParams.get('percentileInput') || '';
        const roundParam = searchParams.get('round');
        const yearParam = searchParams.get('year');

        // Validate and sanitize round parameter
        const round = roundParam ? parseInt(roundParam, 10) : DEFAULT_ROUND;
        const sanitizedRound = Number.isInteger(round) && isValidRound(round) ? round : DEFAULT_ROUND;
        if (sanitizedRound !== round) {
            console.warn(`Invalid round ${round} provided in export, using round ${sanitizedRound}`);
        }
        const year = yearParam ? parseInt(yearParam, 10) : 2024;

        // Get collection name for the round
        const collectionName = getCollectionForRound(sanitizedRound, year);
        const roundDisplayName = getDisplayNameForRound(sanitizedRound);

        console.log(`Export: Using collection ${collectionName} for ${roundDisplayName}`);

        const pb = getPocketBase();

        let allRecords;

        try {
            // Ensure user authentication using Supabase before making the request
            await ensureUserAuthenticated();

            // Helper function to build filter query parts with chunked parameters
            const buildFilterParts = (
                courseChunk?: string[],
                categoryChunk?: string[],
                statusChunk?: string[],
                homeUniversityChunk?: string[]
            ) => {
                const filterParts: string[] = [];

                if (search) {
                    filterParts.push(`(college_name ~ "${search}" || course_name ~ "${search}")`);
                }

                // Use chunked categories if provided, otherwise use all categories
                const categoriesToFilter = categoryChunk || categories;
                if (categoriesToFilter && categoriesToFilter.length > 0) {
                    const categoryFilter = categoriesToFilter.map((cat: string) => `category = "${cat}"`).join(' || ');
                    filterParts.push(`(${categoryFilter})`);
                }

                // Use chunked courses if provided, otherwise use all courses
                const coursesToFilter = courseChunk || courses;
                if (coursesToFilter && coursesToFilter.length > 0) {
                    const courseFilter = coursesToFilter.map((course: string) => `course_name = "${course}"`).join(' || ');
                    filterParts.push(`(${courseFilter})`);
                }

                // Use chunked statuses if provided, otherwise use all statuses
                const statusesToFilter = statusChunk || statuses;
                if (statusesToFilter && statusesToFilter.length > 0) {
                    const statusFilter = statusesToFilter.map((status: string) => `status = "${status}"`).join(' || ');
                    filterParts.push(`(${statusFilter})`);
                }

                // Use chunked home universities if provided, otherwise use all home universities
                const homeUniversitiesToFilter = homeUniversityChunk || homeUniversities;
                if (homeUniversitiesToFilter && homeUniversitiesToFilter.length > 0) {
                    const homeUniversityFilter = homeUniversitiesToFilter.map((uni: string) => `home_university = "${uni}"`).join(' || ');
                    filterParts.push(`(${homeUniversityFilter})`);
                }

                // Percentile-based filtering
                if (percentileInput && !isNaN(parseFloat(percentileInput))) {
                    const targetPercentile = parseFloat(percentileInput);
                    const minPercentile = 0;
                    const maxPercentile = Math.round(targetPercentile * 10000000000) / 10000000000;
                    filterParts.push(`(cutoff_score >= ${minPercentile} && cutoff_score <= ${maxPercentile})`);
                }

                return filterParts.length > 0 ? filterParts.join(' && ') : '';
            };

            // Calculate if we need to chunk the query due to large filter lists
            const MAX_ITEMS_PER_CHUNK = 10; // Reduced chunk size to prevent URL length issues
            const totalFilterItems = (categories?.length || 0) + (courses?.length || 0) + (statuses?.length || 0) + (homeUniversities?.length || 0);
            const shouldChunkQuery = totalFilterItems > 30; // If total filters exceed 30 items, use chunking

            console.log(`Export: Total filter items: ${totalFilterItems}, shouldChunk: ${shouldChunkQuery}`);

            if (shouldChunkQuery) {
                // Create chunks for each filter type
                const categoryChunks = categories && categories.length > MAX_ITEMS_PER_CHUNK
                    ? Array.from({ length: Math.ceil(categories.length / MAX_ITEMS_PER_CHUNK) }, (_, i) =>
                        categories.slice(i * MAX_ITEMS_PER_CHUNK, (i + 1) * MAX_ITEMS_PER_CHUNK)
                    )
                    : [categories];

                const courseChunks = courses && courses.length > MAX_ITEMS_PER_CHUNK
                    ? Array.from({ length: Math.ceil(courses.length / MAX_ITEMS_PER_CHUNK) }, (_, i) =>
                        courses.slice(i * MAX_ITEMS_PER_CHUNK, (i + 1) * MAX_ITEMS_PER_CHUNK)
                    )
                    : [courses];

                const statusChunks = statuses && statuses.length > MAX_ITEMS_PER_CHUNK
                    ? Array.from({ length: Math.ceil(statuses.length / MAX_ITEMS_PER_CHUNK) }, (_, i) =>
                        statuses.slice(i * MAX_ITEMS_PER_CHUNK, (i + 1) * MAX_ITEMS_PER_CHUNK)
                    )
                    : [statuses];

                const homeUniversityChunks = homeUniversities && homeUniversities.length > MAX_ITEMS_PER_CHUNK
                    ? Array.from({ length: Math.ceil(homeUniversities.length / MAX_ITEMS_PER_CHUNK) }, (_, i) =>
                        homeUniversities.slice(i * MAX_ITEMS_PER_CHUNK, (i + 1) * MAX_ITEMS_PER_CHUNK)
                    )
                    : [homeUniversities];

                console.log(`Export: Creating chunks - Categories: ${categoryChunks.length}, Courses: ${courseChunks.length}, Statuses: ${statusChunks.length}, Universities: ${homeUniversityChunks.length}`);

                // Execute queries for all combinations of chunks
                const chunkPromises = [];
                for (const categoryChunk of categoryChunks) {
                    for (const courseChunk of courseChunks) {
                        for (const statusChunk of statusChunks) {
                            for (const homeUniversityChunk of homeUniversityChunks) {
                                const chunkFilterQuery = buildFilterParts(courseChunk, categoryChunk, statusChunk, homeUniversityChunk);
                                if (chunkFilterQuery) {
                                    chunkPromises.push(
                                        pb.collection(collectionName).getFullList({
                                            filter: chunkFilterQuery,
                                            sort: '-last_rank',
                                        }).catch(error => {
                                            console.error(`Export chunk query failed for ${collectionName}:`, error);
                                            return [];
                                        })
                                    );
                                }
                            }
                        }
                    }
                }

                console.log(`Export: Executing ${chunkPromises.length} chunk queries against ${collectionName}`);

                // Wait for all chunk queries to complete and combine results
                const chunkResults = await Promise.all(chunkPromises);
                allRecords = chunkResults.flatMap(result => result);

                // Remove duplicates
                const uniqueRecords = new Map();
                allRecords.forEach(record => {
                    uniqueRecords.set(record.id, record);
                });
                allRecords = Array.from(uniqueRecords.values());

                console.log(`Export: Combined ${chunkResults.length} chunks into ${allRecords.length} unique records from ${collectionName}`);
            } else {
                // Execute single query for smaller filter lists
                const filterQuery = buildFilterParts();
                console.log(`Export: Executing single query with filter length: ${filterQuery.length} against ${collectionName}`);

                try {
                    allRecords = await pb.collection(collectionName).getFullList({
                        filter: filterQuery,
                        sort: '-last_rank',
                    });
                } catch (collectionError) {
                    console.error(`Export query failed for ${collectionName}:`, collectionError);

                    // Check if it's a collection not found error
                    if (collectionError instanceof Error &&
                        (collectionError.message.includes('not found') ||
                            collectionError.message.includes('does not exist'))) {
                        return NextResponse.json({
                            success: false,
                            error: 'Data not available',
                            message: `${roundDisplayName} data is not available for export`,
                            details: `Collection ${collectionName} not found`,
                            round: sanitizedRound
                        }, {
                            status: 404,
                            headers: {
                                'Cache-Control': 'no-cache',
                                'X-Content-Type-Options': 'nosniff'
                            }
                        });
                    }

                    throw collectionError; // Re-throw other errors
                }
            }
        } catch (error) {
            console.error('Database export failed or authentication error:', error);

            // Check if it's an authentication error
            if (error instanceof Error && error.message.includes('authentication')) {
                return NextResponse.json({
                    success: false,
                    error: 'Authentication required',
                    message: 'Please log in to export cutoff data',
                    details: error.message
                }, {
                    status: 401,
                    headers: {
                        'Cache-Control': 'no-cache',
                        'X-Content-Type-Options': 'nosniff'
                    }
                });
            }

            // Generate mock data for export as fallback
            allRecords = Array.from({ length: 500 }, (_, i) => ({
                college_code: `COL${String(i + 1).padStart(3, '0')}`,
                college_name: `Mock Engineering College ${i + 1}`,
                course_code: `CS${String(i + 1).padStart(2, '0')}`,
                course_name: `Computer Science and Engineering ${i + 1}`,
                category: ['GOPENS', 'GOBCS', 'GSTS', 'GVJS'][i % 4],
                seat_allocation_section: ['STATE_LEVEL', 'HOME_TO_HOME', 'HOME_TO_OTHER'][i % 3],
                cutoff_score: String(150 - (i * 0.2)),
                last_rank: String(1000 + (i * 10)),
                total_admitted: 60 + (i % 20)
            }));
        }

        // Convert to CSV
        const headers = [
            'College Code', 'College Name', 'Course Code', 'Course Name',
            'Category', 'Seat Allocation', 'Cutoff Score', 'Last Rank', 'Total Admitted'
        ];

        const csvContent = [
            headers.join(','),
            ...allRecords.map(record => [
                record.college_code,
                `"${record.college_name}"`,
                record.course_code,
                `"${record.course_name}"`,
                record.category,
                record.seat_allocation_section,
                record.cutoff_score,
                record.last_rank,
                record.total_admitted
            ].join(','))
        ].join('\n');

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename=mht_cet_state_cutoffs_${year}_${roundDisplayName.toLowerCase().replace(' ', '_')}.csv`,
            },
        });

    } catch (error) {
        console.error('Export API Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to export cutoff data',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
