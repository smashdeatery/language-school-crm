'use client'

import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { formatFullDate } from '@/lib/utils/session-generator'
import { cycleStatus, getStatusColor, getStatusIcon, getStatusLabel } from '@/lib/utils/attendance-helpers'
import type { AttendanceStatus } from '@/types/database'
import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Pencil, Check, MessageSquare } from 'lucide-react'

interface SessionData {
  id: string; session_number: number; session_date: string
  topic: string | null; content_notes: string | null
  homework: string | null; notes: string | null
  teacher: { id: string; name: string; color: string | null } | null
  course: { id: string; name: string; level: string }
}
interface AttendanceRecord {
  student_id: string; status: AttendanceStatus | null; note: string | null
  student: { id: string; name: string }
}
interface TeacherOption { id: string; name: string; color: string | null }

export default function SessionPage({
  params,
}: {
  params: Promise<{ id: string; sid: string }>
}) {
  const { id: courseId, sid } = use(params)
  const supabase = createClient()

  const [session, setSession] = useState<SessionData | null>(null)
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [loading, setLoading] = useState(true)
  const [editingInfo, setEditingInfo] = useState(false)
  const [topic, setTopic] = useState('')
  const [homework, setHomework] = useState('')
  const [contentNotes, setContentNotes] = useState('')
  const [sessionNotes, setSessionNotes] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [savingInfo, setSavingInfo] = useState(false)
  const [notePopover, setNotePopover] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  async function load() {
    const [{ data: s }, { data: t }] = await Promise.all([
      supabase
        .from('sessions')
        .select('*, teacher:teachers(id,name,color), course:courses(id,name,level)')
        .eq('id', sid)
        .single(),
      supabase.from('teachers').select('id,name,color').eq('is_active', true).order('name'),
    ])

    setSession(s)
    setTeachers(t ?? [])
    setTopic(s?.topic ?? '')
    setHomework(s?.homework ?? '')
    setContentNotes(s?.content_notes ?? '')
    setSessionNotes(s?.notes ?? '')
    setTeacherId(s?.teacher?.id ?? '')

    if (s) {
      // Load enrollments + attendance
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('student_id, student:students(id, name)')
        .eq('course_id', s.course.id)
        .eq('status', 'active')

      const studentIds = enrollments?.map((e: any) => e.student_id) ?? []

      const { data: attendanceData } = studentIds.length
        ? await supabase
            .from('attendance')
            .select('student_id, status, note')
            .eq('session_id', sid)
            .in('student_id', studentIds)
        : { data: [] }

      const attendanceMap = new Map(
        attendanceData?.map((a: any) => [a.student_id, a]) ?? []
      )

      const rows: AttendanceRecord[] = (enrollments ?? []).map((e: any) => ({
        student_id: e.student.id,
        student: e.student,
        status: (attendanceMap.get(e.student.id) as any)?.status ?? null,
        note: (attendanceMap.get(e.student.id) as any)?.note ?? null,
      }))

      setAttendance(rows)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [sid])

  async function toggleAttendance(studentId: string) {
    const current = attendance.find((a) => a.student_id === studentId)
    const nextStatus = cycleStatus(current?.status ?? null)

    // Optimistic update
    setAttendance((prev) =>
      prev.map((a) =>
        a.student_id === studentId ? { ...a, status: nextStatus } : a
      )
    )

    if (nextStatus === null) {
      await supabase
        .from('attendance')
        .delete()
        .eq('session_id', sid)
        .eq('student_id', studentId)
    } else {
      await supabase.from('attendance').upsert(
        { session_id: sid, student_id: studentId, status: nextStatus, note: current?.note ?? null },
        { onConflict: 'session_id,student_id' }
      )
    }
  }

  async function saveNote(studentId: string) {
    setSavingNote(true)
    await supabase
      .from('attendance')
      .update({ note: noteText.trim() || null })
      .eq('session_id', sid)
      .eq('student_id', studentId)
    setAttendance((prev) =>
      prev.map((a) =>
        a.student_id === studentId ? { ...a, note: noteText.trim() || null } : a
      )
    )
    setSavingNote(false)
    setNotePopover(null)
  }

  async function saveInfo() {
    setSavingInfo(true)
    await supabase
      .from('sessions')
      .update({
        teacher_id: teacherId || null,
        topic: topic.trim() || null,
        content_notes: contentNotes.trim() || null,
        homework: homework.trim() || null,
        notes: sessionNotes.trim() || null,
      })
      .eq('id', sid)
    setSavingInfo(false)
    setEditingInfo(false)
    load()
  }

  if (loading)
    return <AppShell><p className="text-slate-500">Loading...</p></AppShell>
  if (!session)
    return <AppShell><p className="text-slate-500">Session not found.</p></AppShell>

  const presentCount = attendance.filter((a) => a.status === 'present').length

  return (
    <AppShell>
      <div className="max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href={`/courses/${courseId}`} className="text-slate-400 hover:text-slate-700">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <p className="text-xs text-slate-500">{session.course.level} — {session.course.name}</p>
            <h1 className="text-xl font-bold text-slate-900">
              Session {session.session_number} · {formatFullDate(session.session_date)}
            </h1>
          </div>
        </div>

        {/* Teacher selector */}
        <div className="bg-white rounded-xl border border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">Teacher</label>
            <select
              value={teacherId}
              onChange={(e) => {
                setTeacherId(e.target.value)
                supabase.from('sessions').update({ teacher_id: e.target.value || null }).eq('id', sid)
                  .then(() => load())
              }}
              className="text-sm border-0 text-slate-900 font-medium focus:outline-none cursor-pointer bg-transparent"
            >
              <option value="">— Not assigned —</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          {session.teacher && (
            <div className="flex items-center gap-2 mt-2">
              <div
                className="w-5 h-5 rounded-full"
                style={{ backgroundColor: session.teacher.color ?? '#94a3b8' }}
              />
              <span className="text-sm text-slate-700">{session.teacher.name}</span>
            </div>
          )}
        </div>

        {/* Attendance */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Attendance</h2>
            <span className="text-sm text-slate-500">
              {presentCount} / {attendance.length} present
            </span>
          </div>

          {attendance.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-slate-400">No students enrolled yet.</p>
              <Link href={`/courses/${courseId}`} className="text-sm text-blue-600 hover:underline mt-1 block">
                Go to course to enroll students →
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {attendance.map((record) => (
                <li key={record.student_id} className="flex items-center gap-4 px-6 py-3.5">
                  {/* Toggle button */}
                  <button
                    onClick={() => toggleAttendance(record.student_id)}
                    className={`w-9 h-9 rounded-xl border font-bold text-sm flex items-center justify-center transition-all flex-shrink-0 ${getStatusColor(record.status)}`}
                    title={`Click to change: ${getStatusLabel(record.status)}`}
                  >
                    {getStatusIcon(record.status)}
                  </button>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium ${record.status === 'present' ? 'text-slate-900' : 'text-slate-600'}`}>
                      {record.student.name}
                    </span>
                    {record.note && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{record.note}</p>
                    )}
                  </div>

                  {/* Status label */}
                  <span className="text-xs text-slate-400 hidden sm:block">
                    {getStatusLabel(record.status)}
                  </span>

                  {/* Note button */}
                  <button
                    onClick={() => {
                      setNotePopover(record.student_id)
                      setNoteText(record.note ?? '')
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      record.note
                        ? 'text-blue-500 bg-blue-50'
                        : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
                    }`}
                    title="Add note"
                  >
                    <MessageSquare size={14} />
                  </button>

                  {/* Inline note editor */}
                  {notePopover === record.student_id && (
                    <div className="absolute right-6 mt-20 z-10 bg-white border border-slate-200 rounded-xl shadow-lg p-3 w-64">
                      <input
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="e.g. funeral :("
                        autoFocus
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => saveNote(record.student_id)}
                          disabled={savingNote}
                          className="flex items-center gap-1 text-xs text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg"
                        >
                          <Check size={12} /> Save
                        </button>
                        <button
                          onClick={() => setNotePopover(null)}
                          className="text-xs text-slate-500 hover:text-slate-700 px-2"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Session Info */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Session Info</h2>
            <button
              onClick={() => setEditingInfo(!editingInfo)}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
            >
              <Pencil size={15} />
            </button>
          </div>

          {editingInfo ? (
            <div className="px-6 py-5 space-y-4">
              <Input
                label="Topic (Thema)"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Modalverben + Perfekt"
              />
              <Textarea
                label="Homework (Hausaufgabe)"
                value={homework}
                onChange={(e) => setHomework(e.target.value)}
                placeholder="e.g. DaF S. 110/1 + S. 112/alles"
                rows={2}
              />
              <Input
                label="Content / Link (Inhalt)"
                value={contentNotes}
                onChange={(e) => setContentNotes(e.target.value)}
                placeholder="URL or description of session content"
              />
              <Textarea
                label="Admin Notes"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Reminders, announcements, test dates..."
                rows={2}
              />
              <div className="flex gap-3 pt-1">
                <Button onClick={saveInfo} disabled={savingInfo}>
                  {savingInfo ? 'Saving...' : 'Save'}
                </Button>
                <Button variant="secondary" onClick={() => setEditingInfo(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="px-6 py-5 space-y-3">
              <InfoRow label="Topic" value={session.topic} placeholder="No topic set" />
              <InfoRow label="Homework" value={session.homework} placeholder="No homework set" />
              <InfoRow label="Content" value={session.content_notes} placeholder="No content notes" />
              <InfoRow label="Notes" value={session.notes} placeholder="No admin notes" />
              {!session.topic && !session.homework && !session.content_notes && !session.notes && (
                <button
                  onClick={() => setEditingInfo(true)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Add session info →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}

function InfoRow({ label, value, placeholder }: { label: string; value: string | null; placeholder: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-xs text-slate-400 w-20 flex-shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm ${value ? 'text-slate-800' : 'text-slate-300 italic'}`}>
        {value ?? placeholder}
      </span>
    </div>
  )
}
