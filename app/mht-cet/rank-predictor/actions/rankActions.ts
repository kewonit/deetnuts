// app/actions/rankActions.ts
'use server'

import { supabase } from '@/lib/supabaseClient'

export async function fetchRankData(percentile: number) {
  const { data, error } = await supabase
    .from('2023-mhtcet-rank-percentile')
    .select('rank, percentile')
    .lte('percentile', percentile)
    .order('percentile', { ascending: false })
    .limit(1)

  if (error) throw error
  return data[0] || null
}