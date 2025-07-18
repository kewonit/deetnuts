import { getPocketBase } from '@/lib/pocketbaseClient';
import { unstable_cache as cache } from 'next/cache';
import { RecordModel } from 'pocketbase';

export interface College {
    id: string;
    college_id: string;
    college_name: string;
    status: string;
    home_university: string;
}

export const getCollegesData = cache(async (): Promise<College[]> => {
  const pb = getPocketBase();
  const records: RecordModel[] = await pb.collection('2024_mht_cet_colleges').getFullList({
    sort: 'college_name',
  });
  
  // The records from PocketBase are RecordModel, we need to cast them.
  // This is safe if the collection schema matches the College interface.
  return records as unknown as College[];
}, ['colleges'], { revalidate: 60 });
