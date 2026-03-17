'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getTeachers() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('is_active', true)
    .order('name')
  if (error) throw error
  return data
}

export async function createTeacher(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const color = formData.get('color') as string

  const { error } = await supabase
    .from('teachers')
    .insert({ name: name.trim(), color: color || null })

  if (error) throw error
  revalidatePath('/teachers')
}

export async function updateTeacher(id: string, formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const color = formData.get('color') as string

  const { error } = await supabase
    .from('teachers')
    .update({ name: name.trim(), color: color || null })
    .eq('id', id)

  if (error) throw error
  revalidatePath('/teachers')
}

export async function deleteTeacher(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('teachers')
    .update({ is_active: false })
    .eq('id', id)

  if (error) throw error
  revalidatePath('/teachers')
}
