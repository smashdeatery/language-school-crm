'use client'

import { AppShell } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { formatSessionDate } from '@/lib/utils/session-generator'
import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, ChevronRight, Plus, Search, UserPlus } from 'lucide-react'

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
  const [loading, setLoading] = useState(true)
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false)
  const [allStudents, setAllStudents] = useState<{ id: string; name: string }[]>([])
  const [studentSearch, setStudentSearch] = useState('')
  const [enrolling, setEnrolling] = useState(false)

  async function load() {
    const [{ data: c }, { data: s }, { data: e }] = await Promise.all([
      supabase.from('courses').select('*').eq('id', id).single(),
      supabase.from('sessions').select('*, teacher:teachers(id,name,color)').eq('course_id', id).order('session_number'),
      supabase.from('enrollments').select('id, student_id, status, student:students(id,name)').eq('course_id', id),
    ])
    setCourse(c)
    setSessions(s ?? [])
    // Normalise Supabase's join result (student may come back as array or object)
    setEnrollments(
      (e ?? []).map((row: any) => ({
        ...row,
        student: Array.isArray(row.student) ? row.student[0] : row.student,
      })) as Enrollment[]
    )
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const today = new Date().toISOString().split('T')[0]
  const nextSession = sessions.find((s) => s.session_date >= today)
  const pastSessions = sessions.filter((s) => s.session_date < today).reverse()

  async function openEnrollDialog() {
    const { data } = await supabase.from('students').select('id, name').eq('is_active', true).order('name')
    setAllStudents(data ?? [])
    setStudentSearch('')
    setEnrollDialogOpen(true)
  }

  const enrolledIds = new Set(enrollments.map((e) => e.student_id))
  const availableStudents = allStudents.filter(
    (s) => !enrolledIds.has(s.id) && s.name.toLowerCase().includes(studentSearch.toLowerCase())
  )

  async function handleEnroll(studentId: string) {
    setEnrolling(true)
    await supabase.from('enrollments').upsert(
      { student_id: studentId, course_id: id, status: 'active' },
      { onConflict: 'student_id,course_id' }
    )
    setEnrolling(false)
    setEnrollDialogOpen(false)
    load()
  }

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
          <Button size="sm" variant="outline" onClick={openEnrollDialog}>
            <UserPlus size={14} /> Enroll Student
          </Button>
        </div>

        {/* Enrolled students */}
        {enrollments.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 px-6 py-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Students ({enrollments.filter((e) => e.status === 'active').length} active)
            </p>
            <div className="flex flex-wrap gap-2">
              {enrollments.map((e) => (
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
              ))}
            </div>
          </div>
        )}

        {/* Next Session CTA */}
        {nextSession && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Next Session</p>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900">
                  Session {nextSession.session_number} · {formatSessionDate(nextSession.session_date)}
                  {nextSession.teacher && (
                    <span className="ml-2 font-normal text-slate-600">· {nextSession.teacher.name}</span>
                  )}
                </p>
                {nextSession.topic && (
                  <p className="text-sm text-slate-600 mt-0.5">{nextSession.topic}</p>
                )}
              </div>
              <Link href={`/courses/${id}/sessions/${nextSession.id}`}>
                <Button size="sm">
                  Open & Take Attendance <ChevronRight size={14} />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Past Sessions */}
        {pastSessions.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3">Past Sessions</p>
            <div className="space-y-2">
              {pastSessions.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  courseId={id}
                  enrollments={enrollments}
                  expanded={expandedSession === session.id}
                  onToggle={() =>
                    setExpandedSession(expandedSession === session.id ? null : session.id)
                  }
                />
              ))}
            </div>
          </div>
        )}

        {sessions.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <p className="text-slate-500 text-sm">No sessions yet for this course.</p>
          </div>
        )}
      </div>

      {/* Enroll Student Dialog */}
      <Dialog open={enrollDialogOpen} onClose={() => setEnrollDialogOpen(false)} title="Enroll Student">
        <div className="space-y-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Search students..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {availableStudents.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">
                {studentSearch ? 'No students match.' : 'All students are already enrolled.'}
              </p>
            ) : (
              availableStudents.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleEnroll(s.id)}
                  disabled={enrolling}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-blue-50 text-left transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-600">
                      {s.name.charAt(0)}
                    </div>
                    <span className="text-sm text-slate-900">{s.name}</span>
                  </div>
                  <Plus size={14} className="text-slate-300 group-hover:text-blue-600" />
                </button>
              ))
            )}
          </div>
          <div className="pt-2 border-t border-slate-100">
            <Link href="/students">
              <Button variant="ghost" size="sm">
                <Plus size={14} /> Add new student first
              </Button>
            </Link>
          </div>
        </div>
      </Dialog>
    </AppShell>
  )
}

function SessionRow({
  session, courseId, enrollments, expanded, onToggle,
}: {
  session: Session; courseId: string; enrollments: Enrollment[]
  expanded: boolean; onToggle: () => void
}) {
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string | null>>({})
  const supabase = createClient()

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
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
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
