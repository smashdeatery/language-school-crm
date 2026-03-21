'use server'

import { createClient } from '@supabase/supabase-js'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export interface SchoolClosure {
  id: string
  date: string       // YYYY-MM-DD (start date)
  end_date?: string  // YYYY-MM-DD (end date, if a range)
  name: string
  type: 'custom'
}

export async function getClosures(): Promise<SchoolClosure[]> {
  const { data, error } = await serviceClient()
    .from('school_closures')
    .select('id, date, end_date, name, type')
    .order('date', { ascending: true })
  if (error) return []   // table may not exist yet
  return (data ?? []) as SchoolClosure[]
}

export async function addClosure(date: string, name: string, endDate?: string): Promise<void> {
  await serviceClient()
    .from('school_closures')
    .insert({ date, end_date: endDate ?? null, name, type: 'custom' })
}

export async function deleteClosure(id: string): Promise<void> {
  await serviceClient()
    .from('school_closures')
    .delete()
    .eq('id', id)
}
