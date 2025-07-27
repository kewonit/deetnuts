import { NextRequest, NextResponse } from 'next/server';
import { getPocketBase } from '@/lib/pocketbaseClient';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Pagination
        const page = parseInt(searchParams.get('page') || '1', 10) || 1;
        const perPage = parseInt(searchParams.get('perPage') || '50', 10) || 50;
        const sort = searchParams.get('sort') || 'rank';

        // Filters
        const search = searchParams.get('search') || '';
        const branches = searchParams.get('branches') || '';
        const maxPercentileStr = searchParams.get('maxPercentile') || '';
        const minRankStr = searchParams.get('minRank') || '';
        const maxRankStr = searchParams.get('maxRank') || '';
        const collegeName = searchParams.get('collegeName') || '';

        const filters = [];

        // General search filter
        if (search) {
            const safeSearch = search.replace(/"/g, '""');
            filters.push(`(course_name ~ "${safeSearch}" || college_name ~ "${safeSearch}" || choice_code ~ "${safeSearch}")`);
        }

        // Branch filter (supports multiple, comma-separated)
        if (branches) {
            const branchList = branches.split(',').map(b => b.trim()).filter(b => b);
            if (branchList.length > 0) {
                const branchFilters = branchList.map(b => `course_name ~ "${b.replace(/"/g, '""')}"`).join(' || ');
                filters.push(`(${branchFilters})`);
            }
        }

        // Percentile filter (handles the "at or below" case)
        const maxPercentile = parseFloat(maxPercentileStr);
        if (!isNaN(maxPercentile)) {
            filters.push(`percentile <= ${maxPercentile}`);
        }

        // Rank filters
        const minRank = parseInt(minRankStr, 10);
        if (!isNaN(minRank)) {
            filters.push(`rank >= ${minRank}`);
        }
        const maxRank = parseInt(maxRankStr, 10);
        if (!isNaN(maxRank)) {
            filters.push(`rank <= ${maxRank}`);
        }

        // College name filter
        if (collegeName) {
            filters.push(`college_name ~ "${collegeName.replace(/"/g, '""')}"`);
        }

        const filterString = filters.join(' && ');

        const pb = getPocketBase();

        const result = await pb.collection('2024_all_india_rounds_one').getList(page, perPage, {
            filter: filterString,
            sort: sort,
            fields: 'id,sr_no,rank,percentile,choice_code,institute_code,merit_exam,type,seat_type,college_code,course_name,college_name,created,updated'
        });

        return NextResponse.json({
            success: true,
            data: result.items,
            pagination: {
                page: result.page,
                perPage: result.perPage,
                totalPages: result.totalPages,
                totalItems: result.totalItems
            }
        });
    } catch (error) {
        console.error('Error fetching 2024 All India Round One data:', error);
        // Ensure a consistent error response format
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch data from the server.',
                details: errorMessage,
                data: [],
                pagination: { page: 1, perPage: 50, totalPages: 0, totalItems: 0 }
            },
            { status: 500 }
        );
    }
}
