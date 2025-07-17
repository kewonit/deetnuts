import { NextResponse } from 'next/server';
import { getPocketBase, ensureAuthenticatedServer } from '@/lib/pocketbaseClient';
import { ClientResponseError } from 'pocketbase';
import { parseCollegeSlug } from '@/lib/slugify';

// Type definitions
interface SeatMatrixRecord {
    id: string;
    page_number: string;
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
    EWS_seat: number;
    TFWS_choice_code: string;
    TFWS_seats: number;
    created: string;
    updated: string;
}

interface College {
    id: string;
    college_id: number;
    college_name: string;
    status: string;
    home_university: string;
    created: string;
    updated: string;
}

// Function to normalize college codes for comparison
function normalizeCollegeCode(code: string | number): string {
    return String(code).padStart(4, '0');
}

export async function GET(request: Request, { params }: any) {
    const resolvedParams = await params;

    try {
        const pb = getPocketBase();

        // Try to authenticate for seat matrix access (required by PocketBase)
        try {
            await ensureAuthenticatedServer();
        } catch (authError) {
            // If authentication fails, return a more user-friendly message
            return NextResponse.json(
                {
                    message: 'Seat matrix data requires authentication. This data may not be publicly available.',
                    error: 'Authentication required'
                },
                { status: 401 }
            );
        }

        const { id } = parseCollegeSlug(resolvedParams.id);

        // First get the college by college_id field (not the record ID)
        let college: College;
        try {
            const colleges = await pb.collection('2024_mht_cet_colleges').getFullList({
                filter: `college_id=${id}`,
            }) as College[];

            if (colleges.length === 0) {
                return NextResponse.json(
                    { message: 'College not found' },
                    { status: 404 }
                );
            }

            college = colleges[0];
        } catch (collegeError) {
            if (collegeError instanceof ClientResponseError && collegeError.status === 404) {
                return NextResponse.json(
                    { message: 'College not found' },
                    { status: 404 }
                );
            }
            throw collegeError;
        }

        const normalizedCollegeId = normalizeCollegeCode(college.college_id);

        // Try multiple filter strategies to find seat matrix data
        let seatMatrixRecords: SeatMatrixRecord[] = [];
        // Always match seat matrix by normalized college code (ignore leading zeros)
        try {
            seatMatrixRecords = await pb.collection('2024_mht_cet_colleges_seat_matrix').getFullList({
                // Use a filter that matches college_code numerically, ignoring leading zeros
                filter: `college_code="${normalizedCollegeId}" || college_code="${parseInt(normalizedCollegeId, 10)}"`,
                sort: 'course_name,choice_code',
            }) as SeatMatrixRecord[];
        } catch (error) {
            console.warn('Seat matrix fetch by normalized college_code failed:', error);
        }

        // If still no results, try to match manually by normalizing all codes
        if (seatMatrixRecords.length === 0) {
            try {
                const allRecords = await pb.collection('2024_mht_cet_colleges_seat_matrix').getFullList({
                    sort: 'course_name,choice_code',
                }) as SeatMatrixRecord[];
                seatMatrixRecords = allRecords.filter((record: SeatMatrixRecord) => {
                    if (record.college_code) {
                        // Compare as numbers to ignore leading zeros
                        return parseInt(record.college_code, 10) === parseInt(normalizedCollegeId, 10);
                    }
                    return false;
                });
            } catch (error) {
                console.warn('Manual seat matrix mapping failed:', error);
            }
        }

        return NextResponse.json({
            seatMatrix: seatMatrixRecords,
            college: college,
            matchInfo: {
                totalRecords: seatMatrixRecords.length,
                collegeId: college.college_id,
                normalizedCollegeId: normalizedCollegeId,
                collegeName: college.college_name
            }
        });
    } catch (error: any) {
        if (error instanceof ClientResponseError) {
            return NextResponse.json(
                { message: 'Failed to fetch seat matrix', error: error.message },
                { status: error.status }
            );
        }
        return NextResponse.json(
            { message: 'An unexpected error occurred', error: (error as Error).message },
            { status: 500 }
        );
    }
}
