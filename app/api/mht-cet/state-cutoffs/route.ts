import { NextRequest, NextResponse } from 'next/server';
import { getCutoffRecords } from '../../../mht-cet/state-cutoffs/actions';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            page = 1,
            perPage = 25,
            search = '',
            categories = [],
            courses = [],
            statuses = [],
            homeUniversities = [],
            percentileInput = '',
            round = 1,
            sortBy = 'last_rank',
            sortOrder = 'desc'
        } = body;

        // Validate round parameter
        const sanitizedRound = Number.isInteger(round) && round >= 1 && round <= 3 ? round : 1;
        if (sanitizedRound !== round) {
            console.warn(`Invalid round ${round} provided in API, using round ${sanitizedRound}`);
        }

        // Call the server action
        const result = await getCutoffRecords(
            page,
            perPage,
            search,
            categories,
            courses,
            statuses,
            homeUniversities,
            percentileInput,
            sanitizedRound,
            sortBy,
            sortOrder
        );

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('API Route Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch cutoff data',
                details: error.message || 'Unknown error'
            },
            { status: 500 }
        );
    }
}
