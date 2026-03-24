'use client'

import { AppShell } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { formatSessionDate, generateSessionDates } from '@/lib/utils/session-generator'
import { getHolidaysForRange, type PublicHoliday } from '@/lib/utils/holidays'
import { getClosures, type SchoolClosure } from '@/actions/closures'
import { syncSessionsToCalendar, deleteSessionsFromCalendar } from '@/actions/calendar-sync'
import { addDays, format } from 'date-fns'
import type { DayOfWeek } from '@/types/database'
import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, ChevronRight, Pencil, Plus, RefreshCw, Search, UserPlus, X } from 'lucide-react'

const LEVELS = ['A1.1','A1.2','A2.1','A2.2','B1.1','B1.2','B2.1','B2.2','C1','C2']
const TYPES = ['extensive','intensive','private']
const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']

interface Course {
  id: string; name: string; level: string; type: string
  schedule_time: string; schedule_days: string[]; total_sessions: number
  start_date: string; materials: string | null; is_active: boolean
}
interface Session {
  id: string; session_number: number; session_date: string
  topic: string | null; homework: string | null; notes: string | null
  teacher: { id: string; name: string; color: string | null } | null
}
interface Enrollment {
  id: string; student_id: string; status: string
  student: { id: string; name: string }
}

function AttendancePip({ status }: { status: string | null }) {
  const cls =
    status === 'present' ? 'bg-green-500' :
    status === 'absent_unexcused' ? 'bg-red-400' :
    status === 'absent_excused' ? 'bg-amber-400' :
    status === 'credit' ? 'bg-blue-400' : 'bg-slate-200'
  return <span className={`inline-block w-2 h-2 rounded-full ${cls}`} />
}

export default function CourseOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()

  const [course, setCourse] = useState<Course | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [attendanceBySession, setAttendanceBySession] = useState<Record<string, Record<string, string | null>>>({})
  const [loading, setLoading] = useState(true)
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false)
  const [editingStudents, setEditingStudents] = useState(false)
  const [allStudents, setAllStudents] = useState<{ id: string; name: string }[]>([])
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set())
  const [enrolling, setEnrolling] = useState(false)

  // Holiday/closure data
  const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>([])
  const [customClosures, setCustomClosures] = useState<SchoolClosure[]>([])

  // Edit course state
  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editLevel, setEditLevel] = useState('')
  const [editType, setEditType] = useState('')
  const [editDays, setEditDays] = useState<string[]>([])
  const [editTime, setEditTime] = useState('')
  const [editStartDate, setEditStartDate] = useState('')
  const [editTotalSessions, setEditTotalSessions] = useState('')
  const [editMaterials, setEditMaterials] = useState('')
  const [editIsActive, setEditIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  async function load() {
    const [{ data: c }, { data: s }, { data: e }] = await Promise.all([
      supabase.from('courses').select('*').eq('id', id).single(),
      supabase.from('sessions').select('*, teacher:teachers(id,name,color)').eq('course_id', id).order('session_number'),
      supabase.from('enrollments').select('id, student_id, status, student:students(id,name)').eq('course_id', id),
    ])
    setCourse(c)
    setSessions(s ?? [])
    setEnrollments(
      (e ?? []).map((row: any) => ({
        ...row,
        student: Array.isArray(row.student) ? row.student[0] : row.student,
      })) as Enrollment[]
    )

    // Load all attendance for the course upfront so counts are correct without expanding
    if (s && s.length > 0) {
      const sessionIds = s.map((x: any) => x.id)
      const { data: att } = await supabase
        .from('attendance')
        .select('session_id, student_id, status')
        .in('session_id', sessionIds)
      const bySession: Record<string, Record<string, string | null>> = {}
      att?.forEach((a: any) => {
        if (!bySession[a.session_id]) bySession[a.session_id] = {}
        bySession[a.session_id][a.student_id] = a.status
      })
      setAttendanceBySession(bySession)
    }

    setLoading(false)

    // Load holidays once we have the course date range
    if (c && s && s.length > 0) {
      const dates = s.map((x: any) => x.session_date).sort()
      const holidays = getHolidaysForRange(dates[0], dates[dates.length - 1])
      setPublicHolidays(holidays)
    }
  }

  useEffect(() => { load() }, [id])
  useEffect(() => {
    getClosures().then(setCustomClosures)
  }, [])

  // Build a combined map of closure dates for quick lookup (expand ranges)
  const closureDateMap = new Map<string, string>()
  publicHolidays.forEach(h => closureDateMap.set(h.date, h.name))
  customClosures.forEach(c => {
    const end = c.end_date && c.end_date > c.date ? c.end_date : c.date
    let d = new Date(c.date + 'T12:00:00')
    const endDate = new Date(end + 'T12:00:00')
    while (d <= endDate) {
      closureDateMap.set(format(d, 'yyyy-MM-dd'), c.name)
      d = addDays(d, 1)
    }
  })

  const today = new Date().toISOString().split('T')[0]
  const nextSession = sessions.find((s) => s.session_date >= today)
  const futureSessions = sessions.filter((s) => s.session_date >= today)
  const pastSessions = sessions.filter((s) => s.session_date < today).reverse()

  async function openEnrollDialog() {
    const { data } = await supabase.from('students').select('id, name').eq('is_active', true).order('name')
    setAllStudents(data ?? [])
    setStudentSearch('')
    setSelectedStudentIds(new Set())
    setEnrollDialogOpen(true)
  }

  function toggleStudentSelection(studentId: string) {
    setSelectedStudentIds(prev => {
      const next = new Set(prev)
      next.has(studentId) ? next.delete(studentId) : next.add(studentId)
      return next
    })
  }

  async function handleBulkEnroll() {
    if (selectedStudentIds.size === 0) return
    setEnrolling(true)
    await supabase.from('enrollments').upsert(
      [...selectedStudentIds].map(studentId => ({
        student_id: studentId,
        course_id: id,
        status: 'active',
      })),
      { onConflict: 'student_id,course_id' }
    )
    setEnrolling(false)
    setEnrollDialogOpen(false)
    load()
  }

  function openEdit() {
    if (!course) return
    setEditName(course.name)
    setEditLevel(course.level)
    setEditType(course.type)
    setEditDays(course.schedule_days ?? [])
    setEditTime(course.schedule_time)
    setEditStartDate(course.start_date)
    setEditTotalSessions(String(course.total_sessions))
    setEditMaterials(course.materials ?? '')
    setEditIsActive(course.is_active)
    setEditOpen(true)
  }

  async function handleSaveCourse() {
    if (!editName.trim()) return
    setSaving(true)

    const scheduleChanged =
      editStartDate !== course!.start_date ||
      parseInt(editTotalSessions) !== course!.total_sessions ||
      JSON.stringify([...editDays].sort()) !== JSON.stringify([...(course!.schedule_days ?? [])].sort())

    await supabase.from('courses').update({
      name: editName.trim(),
      level: editLevel,
      type: editType,
      schedule_days: editDays,
      schedule_time: editTime,
      start_date: editStartDate,
      total_sessions: parseInt(editTotalSessions) || 0,
      materials: editMaterials.trim() || null,
      is_active: editIsActive,
    }).eq('id', id)

    setSaving(false)
    setEditOpen(false)

    if (scheduleChanged) {
      // Reload course state first so regenerate uses the new values
      await load()
      await regenerateSessions(editStartDate, editDays as DayOfWeek[], parseInt(editTotalSessions) || 0)
    } else {
      load()
    }
  }

  async function regenerateSessions(startDate: string, scheduleDays: DayOfWeek[], totalSessions: number) {
    setRegenerating(true)
    const endDate = new Date(startDate)
    endDate.setFullYear(endDate.getFullYear() + 2)
    const endIso = endDate.toISOString().split('T')[0]
    const holidays = getHolidaysForRange(startDate, endIso)
    const closures = await getClosures()
    const closedDates = new Set<string>()
    holidays.forEach(h => closedDates.add(h.date))
    closures.forEach(c => {
      const end = c.end_date && c.end_date > c.date ? c.end_date : c.date
      let d = new Date(c.date + 'T12:00:00')
      const endD = new Date(end + 'T12:00:00')
      while (d <= endD) {
        closedDates.add(format(d, 'yyyy-MM-dd'))
        d = addDays(d, 1)
      }
    })
    const dates = generateSessionDates(new Date(startDate), scheduleDays, totalSessions, closedDates)

    // Delete old Google Calendar events before removing sessions
    await deleteSessionsFromCalendar(id)

    await supabase.from('sessions').delete().eq('course_id', id)
    const { data: newSessions } = await supabase.from('sessions').insert(
      dates.map((date, i) => ({
        course_id: id,
        session_number: i + 1,
        session_date: format(date, 'yyyy-MM-dd'),
      }))
    ).select('id, session_date')

    setRegenerating(false)
    load()

    // Fire-and-forget Google Calendar sync for new sessions
    if (newSessions?.length && course) {
      syncSessionsToCalendar(
        newSessions,
        course.name,
        course.level,
        course.schedule_time,
        null
      ).catch(() => {/* silently ignore */})
    }
  }

  async function handleRegenerateSessions() {
    if (!course) return
    if (!window.confirm(
      `This will delete all ${sessions.length} existing sessions for "${course.name}" and regenerate them, skipping holidays and closures. Continue?`
    )) return
    await regenerateSessions(course.start_date, course.schedule_days as DayOfWeek[], course.total_sessions)
  }

  function toggleDay(day: string) {
    setEditDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])
  }

  const enrolledIds = new Set(enrollments.map((e) => e.student_id))
  const availableStudents = allStudents.filter(
    (s) => !enrolledIds.has(s.id) && s.name.toLowerCase().includes(studentSearch.toLowerCase())
  )


  if (loading) return <AppShell><p className="text-slate-500">Loading...</p></AppShell>
  if (!course) return <AppShell><p className="text-slate-500">Course not found.</p></AppShell>

  return (
    <AppShell>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Link href="/courses" className="text-slate-400 hover:text-slate-700 mt-1">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">{course.name}</h1>
              <Badge variant="info">{course.level}</Badge>
              <Badge variant="outline" className="capitalize">{course.type}</Badge>
              {!course.is_active && <Badge variant="default">Inactive</Badge>}
            </div>
            <p className="text-slate-500 text-sm mt-1">
              {course.schedule_time} · {course.total_sessions} sessions
              {course.materials && ` · ${course.materials}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={openEdit}>
              <Pencil size={14} /> Edit
            </Button>
            <Button size="sm" variant="outline" onClick={handleRegenerateSessions} disabled={regenerating}>
              <RefreshCw size={14} className={regenerating ? 'animate-spin' : ''} />
              {regenerating ? 'Regenerating...' : 'Regenerate Sessions'}
            </Button>
            <Button size="sm" variant="outline" onClick={openEnrollDialog}>
              <UserPlus size={14} /> Enroll Student
            </Button>
          </div>
        </div>

        {/* Enrolled students */}
        {enrollments.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Students ({enrollments.filter((e) => e.status === 'active').length} active)
              </p>
              <button
                onClick={() => setEditingStudents(!editingStudents)}
                className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                  editingStudents
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {editingStudents ? 'Done' : 'Edit'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {enrollments.map((e) =>
                editingStudents ? (
                  <span
                    key={e.id}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full border bg-red-50 border-red-200 text-red-700"
                  >
                    {e.student.name}
                    <button
                      onClick={async () => {
                        if (!confirm(`Remove ${e.student.name} from this course?`)) return
                        await supabase.from('enrollments').delete().eq('id', e.id)
                        load()
                      }}
                      className="ml-0.5 hover:text-red-900"
                    >
                      <X size={11} />
                    </button>
                  </span>
                ) : (
                  <Link
                    key={e.id}
                    href={`/students/${e.student.id}`}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      e.status === 'active'
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-700'
                        : 'bg-slate-50 border-slate-100 text-slate-400 line-through'
                    }`}
                  >
                    {e.student.name}
                  </Link>
                )
              )}
            </div>
          </div>
        )}

        {/* Upcoming Sessions */}
        {futureSessions.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3">
              Upcoming Sessions
              <span className="ml-2 text-xs font-mono bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">{futureSessions.length}</span>
            </p>
            <div className="space-y-2">
              {futureSessions.map((session) => {
                const isNext = session.id === nextSession?.id
                const closureName = closureDateMap.get(session.session_date)
                return (
                  <div key={session.id} className={`rounded-xl p-4 border flex items-center justify-between gap-4 ${
                    closureName ? 'bg-red-50 border-red-200' :
                    isNext ? 'bg-blue-50 border-blue-200' :
                    'bg-white border-slate-200'
                  }`}>
                    <div>
                      {isNext && (
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Next Session</p>
                      )}
                      <p className="font-semibold text-slate-900 text-sm">
                        Session {session.session_number} · {formatSessionDate(session.session_date)}
                        {session.teacher && (
                          <span className="ml-2 font-normal text-slate-600">· {session.teacher.name}</span>
                        )}
                      </p>
                      {closureName && (
                        <p className="text-xs text-red-600 mt-0.5">⚠ {closureName}</p>
                      )}
                      {session.topic && (
                        <p className="text-xs text-slate-500 mt-0.5">{session.topic}</p>
                      )}
                    </div>
                    {isNext && (
                      <Link href={`/courses/${id}/sessions/${session.id}`}>
                        <Button size="sm">
                          Open & Take Attendance <ChevronRight size={14} />
                        </Button>
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Past Sessions — collapsed */}
        {pastSessions.length > 0 && (
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer list-none select-none text-sm font-semibold text-slate-500 mb-3 hover:text-slate-700 transition-colors">
              <span className="transition-transform group-open:rotate-90 inline-block">›</span>
              Past Sessions
              <span className="text-xs font-mono bg-slate-100 text-slate-400 rounded-full px-2 py-0.5 normal-case font-normal">{pastSessions.length}</span>
            </summary>
            <div className="space-y-2">
              {pastSessions.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  courseId={id}
                  enrollments={enrollments}
                  expanded={expandedSession === session.id}
                  closureName={closureDateMap.get(session.session_date)}
                  initialAttendanceMap={attendanceBySession[session.id] ?? {}}
                  onToggle={() =>
                    setExpandedSession(expandedSession === session.id ? null : session.id)
                  }
                />
              ))}
            </div>
          </details>
        )}

        {sessions.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <p className="text-slate-500 text-sm">No sessions yet for this course.</p>
          </div>
        )}
      </div>

      {/* Edit Course Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} title="Edit Course" className="max-w-lg">
        <div className="space-y-4">
          <Input label="Course Name *" value={editName} onChange={e => setEditName(e.target.value)} placeholder="e.g. Montagsgruppe A2" autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Level</label>
              <select value={editLevel} onChange={e => setEditLevel(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
              <select value={editType} onChange={e => setEditType(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize">
                {TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Schedule Days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium capitalize transition-colors ${
                    editDays.includes(day)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {day.slice(0, 2).toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Time" type="time" value={editTime} onChange={e => setEditTime(e.target.value)} />
            <Input label="Start Date" type="date" value={editStartDate} onChange={e => setEditStartDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Total Sessions" type="number" value={editTotalSessions} onChange={e => setEditTotalSessions(e.target.value)} />
            <Input label="Materials" value={editMaterials} onChange={e => setEditMaterials(e.target.value)} placeholder="e.g. Schritte Plus A2" />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setEditIsActive(!editIsActive)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                editIsActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {editIsActive ? 'Active' : 'Inactive'}
            </button>
            <span className="text-xs text-slate-400">Toggle course status</span>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveCourse} disabled={saving || !editName.trim()}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Enroll Student Dialog */}
      <Dialog open={enrollDialogOpen} onClose={() => setEnrollDialogOpen(false)} title="Enroll Students">
        <div className="space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Search students..."
              autoFocus
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="max-h-72 overflow-y-auto space-y-0.5">
            {availableStudents.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">
                {studentSearch ? 'No students match.' : 'All students are already enrolled.'}
              </p>
            ) : (
              availableStudents.map((s) => {
                const selected = selectedStudentIds.has(s.id)
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleStudentSelection(s.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${
                      selected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                        selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {selected ? '✓' : s.name.charAt(0)}
                      </div>
                      <span className={`text-sm ${selected ? 'text-blue-800 font-medium' : 'text-slate-900'}`}>{s.name}</span>
                    </div>
                    {!selected && <Plus size={14} className="text-slate-300" />}
                  </button>
                )
              })
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
            <Link href="/students">
              <Button variant="ghost" size="sm">
                <Plus size={14} /> New student
              </Button>
            </Link>
            <Button
              onClick={handleBulkEnroll}
              disabled={enrolling || selectedStudentIds.size === 0}
            >
              {enrolling ? 'Enrolling...' : `Enroll ${selectedStudentIds.size > 0 ? selectedStudentIds.size : ''} student${selectedStudentIds.size !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </Dialog>
    </AppShell>
  )
}

function SessionRow({
  session, courseId, enrollments, expanded, closureName, initialAttendanceMap, onToggle,
}: {
  session: Session; courseId: string; enrollments: Enrollment[]
  expanded: boolean; closureName: string | undefined
  initialAttendanceMap: Record<string, string | null>; onToggle: () => void
}) {
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string | null>>(initialAttendanceMap)
  const supabase = createClient()

  useEffect(() => {
    setAttendanceMap(initialAttendanceMap)
  }, [initialAttendanceMap])

  useEffect(() => {
    if (!expanded) return
    const studentIds = enrollments.map((e) => e.student_id)
    if (studentIds.length === 0) return
    supabase
      .from('attendance')
      .select('student_id, status')
      .eq('session_id', session.id)
      .then(({ data }) => {
        const map: Record<string, string | null> = {}
        data?.forEach((a) => { map[a.student_id] = a.status })
        setAttendanceMap(map)
      })
  }, [expanded, session.id])

  const activeEnrollments = enrollments.filter((e) => e.status === 'active')
  const presentCount = activeEnrollments.filter(
    (e) => attendanceMap[e.student_id] === 'present'
  ).length

  return (
    <div className={`bg-white rounded-xl border overflow-hidden ${closureName ? 'border-red-200' : 'border-slate-200'}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: session.teacher?.color ?? '#94a3b8' }}
          />
          <div>
            <p className="text-sm font-medium text-slate-900">
              Session {session.session_number} · {formatSessionDate(session.session_date)}
              {session.teacher && <span className="font-normal text-slate-500"> · {session.teacher.name}</span>}
            </p>
            {session.topic && <p className="text-xs text-slate-500 mt-0.5">{session.topic}</p>}
            {closureName && (
              <p className="text-xs text-red-500 mt-0.5">⚠ {closureName}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {activeEnrollments.length > 0 && (
            <span className="text-xs text-slate-500">
              {presentCount}/{activeEnrollments.length} attended
            </span>
          )}
          <Link
            href={`/courses/${courseId}/sessions/${session.id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-blue-600 hover:underline"
          >
            Edit →
          </Link>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4 bg-slate-50 space-y-3">
          {session.homework && (
            <p className="text-xs text-slate-600">
              <span className="font-medium text-slate-700">Homework: </span>{session.homework}
            </p>
          )}
          {session.notes && (
            <p className="text-xs text-slate-600">
              <span className="font-medium text-slate-700">Notes: </span>{session.notes}
            </p>
          )}
          {activeEnrollments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeEnrollments.map((e) => (
                <span key={e.id} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <AttendancePip status={attendanceMap[e.student_id] ?? null} />
                  {e.student.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
