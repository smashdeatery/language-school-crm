export const dynamic = 'force-dynamic'

import { AppShell } from '@/components/layout/AppShell'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'

const levelColors: Record<string, string> = {
  'A1.1': 'bg-green-100 text-green-700',
  'A1.2': 'bg-green-100 text-green-700',
  'A2.1': 'bg-teal-100 text-teal-700',
  'A2.2': 'bg-teal-100 text-teal-700',
  'B1.1': 'bg-blue-100 text-blue-700',
  'B1.2': 'bg-blue-100 text-blue-700',
  'B2.1': 'bg-purple-100 text-purple-700',
  'B2.2': 'bg-purple-100 text-purple-700',
  'C1': 'bg-amber-100 text-amber-700',
  'C2': 'bg-red-100 text-red-700',
}

export default async function CoursesPage() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const [{ data: courses }, { data: futureSessions }] = await Promise.all([
    supabase
      .from('courses')
      .select('id, name, level, type, schedule_time, schedule_days, start_date, total_sessions, is_active')
      .order('start_date', { ascending: false }),
    supabase
      .from('sessions')
      .select('course_id')
      .gte('session_date', today),
  ])

  const courseIdsWithFuture = new Set(futureSessions?.map((s) => s.course_id) ?? [])
  const upcoming = courses?.filter((c) => courseIdsWithFuture.has(c.id)) ?? []
  const past = courses?.filter((c) => !courseIdsWithFuture.has(c.id)) ?? []

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Courses</h1>
          <Link href="/courses/new">
            <Button><Plus size={16} /> New Course</Button>
          </Link>
        </div>

        {(!courses || courses.length === 0) && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <p className="text-slate-500 text-sm mb-4">No courses yet.</p>
            <Link href="/courses/new">
              <Button><Plus size={16} /> Create first course</Button>
            </Link>
          </div>
        )}

        {/* Upcoming / active courses */}
        {upcoming.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Current & Upcoming
              <span className="ml-2 text-xs bg-slate-100 text-slate-500 rounded-full px-2 py-0.5 font-mono normal-case">{upcoming.length}</span>
            </h2>
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              {upcoming.map((course) => <CourseRow key={course.id} course={course} />)}
            </div>
          </div>
        )}

        {/* Past courses — collapsed */}
        {past.length > 0 && (
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer list-none select-none text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3 hover:text-slate-600 transition-colors">
              <span className="transition-transform group-open:rotate-90 inline-block">›</span>
              Past Courses
              <span className="text-xs bg-slate-100 text-slate-400 rounded-full px-2 py-0.5 font-mono normal-case">{past.length}</span>
            </summary>
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              {past.map((course) => <CourseRow key={course.id} course={course} />)}
            </div>
          </details>
        )}
      </div>
    </AppShell>
  )
}

function CourseRow({ course }: { course: any }) {
  return (
    <Link
      href={`/courses/${course.id}`}
      className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors group"
    >
      <div className="flex items-center gap-4">
        <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ${levelColors[course.level] ?? 'bg-slate-100 text-slate-700'}`}>
          {course.level}
        </span>
        <div>
          <p className="font-medium text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
            {course.name}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {course.schedule_time} · {course.total_sessions} sessions · <span className="capitalize">{course.type}</span>
          </p>
        </div>
      </div>
      <span className="text-xs text-slate-400 group-hover:text-blue-500">Open →</span>
    </Link>
  )
}
