'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getStudents() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('is_active', true)
    .order('name')
  if (error) throw error
  return data
}

export async function getStudent(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createStudent(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from('students').insert({
    name: (formData.get('name') as string).trim(),
    email: (formData.get('email') as string) || null,
    phone: (formData.get('phone') as string) || null,
    notes: (formData.get('notes') as string) || null,
  })
  if (error) throw error
  revalidatePath('/students')
}

export async function updateStudent(id: string, formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('students')
    .update({
      name: (formData.get('name') as string).trim(),
      email: (formData.get('email') as string) || null,
      phone: (formData.get('phone') as string) || null,
      notes: (formData.get('notes') as string) || null,
    })
    .eq('id', id)
  if (error) throw error
  revalidatePath(`/students/${id}`)
  revalidatePath('/students')
}

export async function getStudentEnrollments(studentId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('enrollments')
    .select('*, course:courses(*)')
    .eq('student_id', studentId)
    .order('enrolled_at', { ascending: false })
  if (error) throw error
  return data
}

export async function updateEnrollment(
  enrollmentId: string,
  updates: { ue_balance?: number; status?: string; payment_notes?: string }
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('enrollments')
    .update(updates)
    .eq('id', enrollmentId)
  if (error) throw error
  revalidatePath('/students')
}

export async function enrollStudent(courseId: string, studentId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('enrollments').upsert(
    { student_id: studentId, course_id: courseId, status: 'active' },
    { onConflict: 'student_id,course_id' }
  )
  if (error) throw error
  revalidatePath(`/courses/${courseId}`)
}
