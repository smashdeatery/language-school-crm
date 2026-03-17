'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getSession(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sessions')
    .select('*, teacher:teachers(id, name, color), course:courses(id, name, level)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function updateSession(id: string, formData: FormData) {
  const supabase = await createClient()
  const teacherId = formData.get('teacher_id') as string

  const { error } = await supabase
    .from('sessions')
    .update({
      teacher_id: teacherId || null,
      topic: (formData.get('topic') as string) || null,
      content_notes: (formData.get('content_notes') as string) || null,
      homework: (formData.get('homework') as string) || null,
      notes: (formData.get('notes') as string) || null,
    })
    .eq('id', id)

  if (error) throw error

  // Get course_id to revalidate course page
  const { data } = await supabase
    .from('sessions')
    .select('course_id')
    .eq('id', id)
    .single()

  if (data) revalidatePath(`/courses/${data.course_id}`)
  revalidatePath(`/courses/[id]/sessions/${id}`)
}

export async function getSessionAttendance(sessionId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('attendance')
    .select('*, student:students(id, name)')
    .eq('session_id', sessionId)
  if (error) throw error
  return data
}
