import { NextResponse } from 'next/server';
import { getPocketBase, ensureAuthenticatedServer } from '@/lib/pocketbaseClient';
import { ClientResponseError } from 'pocketbase';

export async function GET() {
  try {
    const pb = getPocketBase();
    // The collection is public, so no need for admin auth
    // await ensureAuthenticatedServer(); 

    const records = await pb.collection('2024_mht_cet_colleges').getFullList({
      sort: 'college_name',
    });

    return NextResponse.json(records);
  } catch (error) {
    if (error instanceof ClientResponseError) {
      return NextResponse.json(
        { message: 'Failed to fetch colleges', error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { message: 'An unexpected error occurred', error: (error as Error).message },
      { status: 500 }
    );
  }
}
