'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { AttendanceStatus } from '@/types/database'

export async function upsertAttendance({
  sessionId,
  studentId,
  status,
  note,
  courseId,
}: {
  sessionId: string
  studentId: string
  status: AttendanceStatus | null
  note?: string
  courseId: string
}) {
  const supabase = await createClient()

  if (status === null) {
    // Delete the record (no attendance mark)
    await supabase
      .from('attendance')
      .delete()
      .eq('session_id', sessionId)
      .eq('student_id', studentId)
  } else {
    await supabase.from('attendance').upsert(
      {
        session_id: sessionId,
        student_id: studentId,
        status,
        note: note ?? null,
      },
      { onConflict: 'session_id,student_id' }
    )
  }

  revalidatePath(`/courses/${courseId}/sessions/${sessionId}`)
}

export async function updateAttendanceNote({
  sessionId,
  studentId,
  note,
  courseId,
}: {
  sessionId: string
  studentId: string
  note: string
  courseId: string
}) {
  const supabase = await createClient()
  await supabase
    .from('attendance')
    .update({ note })
    .eq('session_id', sessionId)
    .eq('student_id', studentId)

  revalidatePath(`/courses/${courseId}/sessions/${sessionId}`)
}

export async function getStudentAttendanceStats(studentId: string, courseId: string) {
  const supabase = await createClient()

  // Get all sessions for the course
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id')
    .eq('course_id', courseId)

  if (!sessions || sessions.length === 0) return { present: 0, total: 0, rate: 0 }

  const sessionIds = sessions.map((s) => s.id)

  const { data: attendance } = await supabase
    .from('attendance')
    .select('status')
    .eq('student_id', studentId)
    .in('session_id', sessionIds)
    .not('status', 'is', null)

  const present = attendance?.filter((a) => a.status === 'present').length ?? 0
  const total = attendance?.length ?? 0

  return {
    present,
    total,
    rate: total > 0 ? Math.round((present / total) * 100) : 0,
  }
}
