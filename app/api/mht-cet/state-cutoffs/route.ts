import { NextRequest, NextResponse } from 'next/server';
import { ensureUserAuthenticated } from '@/lib/supabaseAuth';
import { getPocketBase } from '@/lib/pocketbaseClient';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('API Route called with body:', body);

        const page = parseInt(body.page || '1');
        const perPage = parseInt(body.perPage || '50');
        const search = body.search || '';
        const categories = body.categories || [];
        const seatAllocations = body.seatAllocations || [];
        const courses = body.courses || [];
        const statuses = body.statuses || [];
        const homeUniversities = body.homeUniversities || [];
        const percentileInput = body.percentileInput || '';
        const sortBy = body.sortBy || 'last_rank';
        const sortOrder = body.sortOrder || 'desc';

        const pb = getPocketBase();

        // Ensure user authentication using Supabase
        try {
            await ensureUserAuthenticated();
        } catch (authError) {
            console.error('User authentication failed:', authError);

            // Return user-friendly authentication error
            return NextResponse.json({
                success: false,
                error: 'Authentication required',
                message: 'Please log in to access cutoff data',
                details: 'User authentication failed'
            }, {
                status: 401,
                headers: {
                    'Cache-Control': 'no-cache',
                    'X-Content-Type-Options': 'nosniff'
                }
            });
        }

        // Helper function to build filter query parts
        const buildFilterParts = (courseChunk?: string[]) => {
            const filterParts: string[] = [];

            if (search) {
                filterParts.push(`(college_name ~ "${search}" || course_name ~ "${search}")`);
            }

            if (categories && Array.isArray(categories) && categories.length > 0) {
                const categoryFilter = categories.map((cat: string) => `category = "${cat}"`).join(' || ');
                filterParts.push(`(${categoryFilter})`);
            }

            // Use courseChunk if provided, otherwise use all courses
            const coursesToFilter = courseChunk || courses;
            if (coursesToFilter && Array.isArray(coursesToFilter) && coursesToFilter.length > 0) {
                const courseFilter = coursesToFilter.map((course: string) => `course_name = "${course}"`).join(' || ');
                filterParts.push(`(${courseFilter})`);
            }

            if (seatAllocations && Array.isArray(seatAllocations) && seatAllocations.length > 0) {
                const seatFilter = seatAllocations.map((seat: string) => `seat_allocation_section = "${seat}"`).join(' || ');
                filterParts.push(`(${seatFilter})`);
            }

            if (statuses && Array.isArray(statuses) && statuses.length > 0) {
                const statusFilter = statuses.map((status: string) => `status = "${status}"`).join(' || ');
                filterParts.push(`(${statusFilter})`);
            }

            if (homeUniversities && Array.isArray(homeUniversities) && homeUniversities.length > 0) {
                const homeUniversityFilter = homeUniversities.map((uni: string) => `home_university = "${uni}"`).join(' || ');
                filterParts.push(`(${homeUniversityFilter})`);
            }

            // Percentile-based filtering (from target down to 0%) - filtering cutoff_score directly
            if (percentileInput && !isNaN(parseFloat(percentileInput))) {
                const targetPercentile = parseFloat(percentileInput);
                // Use higher precision (10 decimal places) to avoid floating-point errors
                const minPercentile = 0; // Changed: show from 0% to target percentile
                const maxPercentile = Math.round(targetPercentile * 10000000000) / 10000000000;

                // Filter cutoff_score directly since cutoff_score = percentile
                // Show from 0% to target percentile (inclusive)
                filterParts.push(`(cutoff_score >= ${minPercentile} && cutoff_score <= ${maxPercentile})`);
            }

            return filterParts.length > 0 ? filterParts.join(' && ') : '';
        };

        // Build sort string - CRITICAL: Always sort by cutoff_score descending when percentile is provided
        // This ensures highest percentiles (closest to target) appear first
        let sortString;
        if (percentileInput && !isNaN(parseFloat(percentileInput))) {
            sortString = '-cutoff_score'; // Always sort by percentile descending for percentile searches
        } else {
            const sortPrefix = sortOrder === 'desc' ? '-' : '';
            sortString = `${sortPrefix}${sortBy}`;
        }

        // Check if we need to split the query due to large course lists
        const MAX_COURSES_PER_QUERY = 15; // Reduced from potentially 80+ to manageable chunks
        const shouldSplitQuery = courses && Array.isArray(courses) && courses.length > MAX_COURSES_PER_QUERY;

        console.log('Query strategy:', {
            totalCourses: courses?.length || 0,
            shouldSplitQuery,
            maxCoursesPerQuery: MAX_COURSES_PER_QUERY
        });

        try {
            let result;

            if (shouldSplitQuery) {
                // Split courses into chunks and execute multiple queries
                const courseChunks = [];
                for (let i = 0; i < courses.length; i += MAX_COURSES_PER_QUERY) {
                    courseChunks.push(courses.slice(i, i + MAX_COURSES_PER_QUERY));
                }

                console.log(`Splitting query into ${courseChunks.length} chunks`);

                // Execute all chunk queries in parallel using user's authentication
                const chunkPromises = courseChunks.map(async (courseChunk, index) => {
                    const chunkFilterQuery = buildFilterParts(courseChunk);
                    console.log(`Executing chunk ${index + 1}/${courseChunks.length} with ${courseChunk.length} courses`);

                    // This query uses the authenticated user's credentials and respects collection permissions
                    return pb.collection('2024_mht_cet_round_one_cutoffs_duplicate').getList(
                        1, // Always get page 1 for chunks
                        200, // Get more items per chunk to have enough for final pagination
                        {
                            filter: chunkFilterQuery,
                            sort: sortString,
                        }
                    );
                });

                // Wait for all chunk queries to complete
                const chunkResults = await Promise.all(chunkPromises);

                // Combine all results
                const allItems = chunkResults.flatMap(chunkResult => chunkResult.items);
                const totalItems = allItems.length;

                // Sort the combined results according to the sort criteria
                allItems.sort((a: any, b: any) => {
                    if (percentileInput && !isNaN(parseFloat(percentileInput))) {
                        // Sort by cutoff_score descending for percentile searches
                        return parseFloat(b.cutoff_score) - parseFloat(a.cutoff_score);
                    } else if (sortBy === 'cutoff_score') {
                        const aVal = parseFloat(a.cutoff_score);
                        const bVal = parseFloat(b.cutoff_score);
                        return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
                    } else if (sortBy === 'last_rank') {
                        const aVal = parseInt(a.last_rank);
                        const bVal = parseInt(b.last_rank);
                        return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
                    }
                    return 0;
                });

                // Apply pagination to the combined and sorted results
                const startIndex = (page - 1) * perPage;
                const endIndex = startIndex + perPage;
                const paginatedItems = allItems.slice(startIndex, endIndex);

                // Create a result object similar to PocketBase's format
                result = {
                    items: paginatedItems,
                    totalItems: totalItems,
                    totalPages: Math.ceil(totalItems / perPage),
                    page: page,
                    perPage: perPage
                };

                console.log('Combined query result:', {
                    chunksExecuted: chunkResults.length,
                    totalItemsFound: totalItems,
                    finalPaginatedItems: paginatedItems.length
                });
            } else {
                // Execute single query for smaller course lists
                const filterQuery = buildFilterParts();
                console.log('Executing single query:', {
                    filterQuery: filterQuery.substring(0, 200) + (filterQuery.length > 200 ? '...' : ''),
                    filterLength: filterQuery.length
                });

                // This query uses the authenticated user's credentials and respects collection permissions
                result = await pb.collection('2024_mht_cet_round_one_cutoffs_duplicate').getList(
                    page,
                    perPage,
                    {
                        filter: filterQuery,
                        sort: sortString,
                    }
                );
            }

            console.log('Database result:', {
                totalItems: result.totalItems,
                totalPages: result.totalPages,
                page: result.page,
                perPage: result.perPage,
                itemCount: result.items.length
            });

            return NextResponse.json({
                success: true,
                data: result.items,
                totalItems: result.totalItems,
                totalPages: result.totalPages,
                page: result.page,
                perPage: result.perPage
            }, {
                headers: {
                    'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
                    'X-Content-Type-Options': 'nosniff'
                }
            });
        } catch (dbError) {
            console.error('Database query failed:', dbError);

            // Check if it's an authentication error
            if (dbError instanceof Error && dbError.message.includes('authentication')) {
                return NextResponse.json({
                    success: false,
                    error: 'Authentication required',
                    message: 'Please log in to access cutoff data',
                    details: dbError.message
                }, {
                    status: 401,
                    headers: {
                        'Cache-Control': 'no-cache',
                        'X-Content-Type-Options': 'nosniff'
                    }
                });
            }

            // Return a generic database error
            return NextResponse.json({
                success: false,
                error: 'Database query failed',
                message: 'Unable to fetch cutoff data at this time',
                details: dbError instanceof Error ? dbError.message : 'Unknown database error'
            }, {
                status: 500,
                headers: {
                    'Cache-Control': 'no-cache',
                    'X-Content-Type-Options': 'nosniff'
                }
            });
        }

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch cutoff data',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            {
                status: 500,
                headers: {
                    'Cache-Control': 'no-cache',
                    'X-Content-Type-Options': 'nosniff'
                }
            }
        );
    }
}
