import { NextResponse } from 'next/server';
import { getPocketBase } from '@/lib/pocketbaseClient';
import { ClientResponseError } from 'pocketbase';
import { parseCollegeSlug, normalizeCollegeCode } from '@/lib/slugify';

interface College {
  id: string;
  college_id: number;
  college_name: string;
  status: string;
  home_university: string;
  created: string;
  updated: string;
}

export async function GET(request: Request, { params }: any) {
  const resolvedParams = await params;

  try {
    const pb = getPocketBase();

    // Parse the slug to extract the college ID
    const { id, normalizedId } = parseCollegeSlug(resolvedParams.id);

    let college: College | null = null;

    // Strategy 1: Try to get college by the extracted ID directly
    try {
      college = await pb.collection('2024_mht_cet_colleges').getOne(id) as College;
    } catch (error) {
      if (error instanceof ClientResponseError && error.status === 404) {
        // Strategy 2: Try to find by college_id field matching the normalized ID
        try {
          const colleges = await pb.collection('2024_mht_cet_colleges').getFullList({
            filter: `college_id=${parseInt(normalizedId || id, 10)}`,
          }) as College[];

          if (colleges.length > 0) {
            college = colleges[0];
          }
        } catch (searchError) {
          console.warn('College search by college_id failed:', searchError);
        }

        // Strategy 3: If still no results, try searching by normalized college_id
        if (!college && normalizedId) {
          try {
            const colleges = await pb.collection('2024_mht_cet_colleges').getFullList({
              filter: `college_id=${parseInt(id, 10)} || college_id=${parseInt(normalizedId, 10)}`,
            }) as College[];

            if (colleges.length > 0) {
              college = colleges[0];
            }
          } catch (searchError) {
            console.warn('College search by multiple IDs failed:', searchError);
          }
        }
      } else {
        throw error;
      }
    }

    if (!college) {
      return NextResponse.json(
        { message: 'College not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(college);
  } catch (error: any) {
    if (error instanceof ClientResponseError) {
      return NextResponse.json(
        { message: 'Failed to fetch college', error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { message: 'An unexpected error occurred', error: (error as Error).message },
      { status: 500 }
    );
  }
}
