import { NextRequest, NextResponse } from 'next/server';
import { getInstitute, getInstituteCutoffs, getBranchesForInstitute } from '@/lib/josaa-client';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    
    const institute = await getInstitute(slug);
    
    if (!institute) {
      return NextResponse.json(
        { error: 'Institute not found' },
        { status: 404 }
      );
    }
    
    // Get branches and cutoffs in parallel
    const [branches, cutoffs] = await Promise.all([
      getBranchesForInstitute(institute.id, year ? parseInt(year) : undefined),
      getInstituteCutoffs(institute.id, year ? parseInt(year) : undefined),
    ]);
    
    return NextResponse.json({
      institute,
      branches,
      cutoffs,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('Error fetching institute:', error);
    return NextResponse.json(
      { error: 'Failed to fetch institute data' },
      { status: 500 }
    );
  }
}
