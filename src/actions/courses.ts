'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateSessionDates } from '@/lib/utils/session-generator'
import { format } from 'date-fns'
import type { DayOfWeek } from '@/types/database'

export async function getCourses() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('start_date', { ascending: false })
  if (error) throw error
  return data
}

export async function getCourse(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createCourse(formData: FormData) {
  const supabase = await createClient()

  const scheduleDays = formData.getAll('schedule_days') as DayOfWeek[]
  const totalSessions = parseInt(formData.get('total_sessions') as string)
  const startDate = new Date(formData.get('start_date') as string)

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .insert({
      name: (formData.get('name') as string).trim(),
      level: formData.get('level') as string,
      type: formData.get('type') as string,
      total_sessions: totalSessions,
      duration_weeks: formData.get('duration_weeks')
        ? parseInt(formData.get('duration_weeks') as string)
        : null,
      schedule_days: scheduleDays,
      schedule_time: formData.get('schedule_time') as string,
      start_date: format(startDate, 'yyyy-MM-dd'),
      materials: (formData.get('materials') as string) || null,
    })
    .select()
    .single()

  if (courseError) throw courseError

  // Auto-generate sessions
  const dates = generateSessionDates(startDate, scheduleDays, totalSessions)
  const sessionRows = dates.map((date, i) => ({
    course_id: course.id,
    session_number: i + 1,
    session_date: format(date, 'yyyy-MM-dd'),
  }))

  const { error: sessionsError } = await supabase
    .from('sessions')
    .insert(sessionRows)

  if (sessionsError) throw sessionsError

  revalidatePath('/courses')
  return { courseId: course.id }
}

export async function updateCourse(id: string, formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('courses')
    .update({
      name: (formData.get('name') as string).trim(),
      level: formData.get('level') as string,
      type: formData.get('type') as string,
      schedule_time: formData.get('schedule_time') as string,
      materials: (formData.get('materials') as string) || null,
      is_active: formData.get('is_active') === 'true',
    })
    .eq('id', id)
  if (error) throw error
  revalidatePath(`/courses/${id}`)
  revalidatePath('/courses')
}

export async function getCourseSessions(courseId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sessions')
    .select('*, teacher:teachers(id, name, color)')
    .eq('course_id', courseId)
    .order('session_number')
  if (error) throw error
  return data
}

export async function getCourseEnrollments(courseId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('enrollments')
    .select('*, student:students(*)')
    .eq('course_id', courseId)
    .order('enrolled_at')
  if (error) throw error
  return data
}
