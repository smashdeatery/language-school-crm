'use server'

import { createCalendarEvent, deleteCalendarEvent } from '@/lib/google-calendar'
import { createClient } from '@supabase/supabase-js'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function syncSessionsToCalendar(
  sessions: Array<{ id: string; session_date: string }>,
  courseName: string,
  courseLevel: string,
  scheduleTime: string,
  teacherName: string | null
): Promise<void> {
  const supabase = serviceClient()

  await Promise.allSettled(
    sessions.map(async (s) => {
      const eventId = await createCalendarEvent({
        sessionDate: s.session_date,
        scheduleTime,
        courseName,
        courseLevel,
        teacherName,
        notes: null,
      })
      if (eventId) {
        await supabase
          .from('sessions')
          .update({ google_event_id: eventId })
          .eq('id', s.id)
      }
    })
  )
}

export async function deleteSessionsFromCalendar(courseId: string): Promise<void> {
  const supabase = serviceClient()
  const { data } = await supabase
    .from('sessions')
    .select('google_event_id')
    .eq('course_id', courseId)
    .not('google_event_id', 'is', null)

  if (!data?.length) return

  await Promise.allSettled(
    data.map((s) => deleteCalendarEvent(s.google_event_id!))
  )
}
