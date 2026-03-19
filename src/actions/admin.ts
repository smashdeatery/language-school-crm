'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function serverClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
}

// ── PIN ───────────────────────────────────────────────────────────────────────

export async function verifyAdminPin(pin: string): Promise<boolean> {
  return pin === process.env.ADMIN_PIN
}

// ── Admin field definitions ───────────────────────────────────────────────────

export interface AdminFieldDef {
  id: string
  label: string
  field_type: 'text' | 'textarea' | 'number' | 'date'
  sort_order: number
  is_active: boolean
}

export async function getAdminFieldDefs(): Promise<AdminFieldDef[]> {
  const supabase = await serverClient()
  const { data, error } = await supabase
    .from('admin_field_definitions')
    .select('id, label, field_type, sort_order, is_active')
    .order('sort_order', { ascending: true })
  if (error) return [] // table may not exist yet (pending migration)
  return (data ?? []) as AdminFieldDef[]
}

export async function createAdminField(label: string, field_type: string): Promise<void> {
  const supabase = await serverClient()
  const { data: existing } = await supabase
    .from('admin_field_definitions')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
  const next_order = existing && existing.length > 0 ? existing[0].sort_order + 1 : 1
  await supabase.from('admin_field_definitions').insert({ label, field_type, sort_order: next_order })
}

export async function updateAdminField(id: string, updates: Partial<Pick<AdminFieldDef, 'label' | 'field_type' | 'sort_order' | 'is_active'>>): Promise<void> {
  const supabase = await serverClient()
  await supabase.from('admin_field_definitions').update(updates).eq('id', id)
}

export async function deleteAdminField(id: string): Promise<void> {
  const supabase = await serverClient()
  await supabase.from('admin_field_definitions').delete().eq('id', id)
}

// ── Student admin data ────────────────────────────────────────────────────────

export async function saveAdminData(studentId: string, adminData: Record<string, string>): Promise<void> {
  const supabase = await serverClient()
  await supabase.from('students').update({ admin_data: adminData }).eq('id', studentId)
  // Silently fails if admin_data column doesn't exist yet (pending migration)
}
