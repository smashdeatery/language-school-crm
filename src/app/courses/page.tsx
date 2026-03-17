import { AppShell } from '@/components/layout/AppShell'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
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
  const { data: courses } = await supabase
    .from('courses')
    .select('id, name, level, type, schedule_time, schedule_days, start_date, total_sessions, is_active')
    .order('is_active', { ascending: false })
    .order('start_date', { ascending: false })

  const active = courses?.filter((c) => c.is_active) ?? []
  const inactive = courses?.filter((c) => !c.is_active) ?? []

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Courses</h1>
          <Link href="/courses/new">
            <Button><Plus size={16} /> New Course</Button>
          </Link>
        </div>

        <CourseSection title="Active" courses={active} />
        {inactive.length > 0 && <CourseSection title="Inactive" courses={inactive} />}

        {(!courses || courses.length === 0) && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <p className="text-slate-500 text-sm mb-4">No courses yet.</p>
            <Link href="/courses/new">
              <Button><Plus size={16} /> Create first course</Button>
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  )
}

function CourseSection({ title, courses }: { title: string; courses: any[] }) {
  if (courses.length === 0) return null
  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">{title}</h2>
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {courses.map((course) => (
          <Link
            key={course.id}
            href={`/courses/${course.id}`}
            className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <span
                className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ${levelColors[course.level] ?? 'bg-slate-100 text-slate-700'}`}
              >
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
        ))}
      </div>
    </div>
  )
}
