import { AppShell } from '@/components/layout/AppShell'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { format } from 'date-fns'
import { BookOpen, GraduationCap, UserCheck, Calendar } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const today = format(new Date(), 'yyyy-MM-dd')

  const [{ data: courses }, { data: students }, { data: teachers }, { data: todaySessions }] =
    await Promise.all([
      supabase.from('courses').select('id').eq('is_active', true),
      supabase.from('students').select('id').eq('is_active', true),
      supabase.from('teachers').select('id').eq('is_active', true),
      supabase
        .from('sessions')
        .select('*, teacher:teachers(name, color), course:courses(id, name, level)')
        .eq('session_date', today)
        .order('session_number'),
    ])

  const stats = [
    { label: 'Active Courses', value: courses?.length ?? 0, icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
    { label: 'Students', value: students?.length ?? 0, icon: GraduationCap, color: 'text-green-600 bg-green-50' },
    { label: 'Teachers', value: teachers?.length ?? 0, icon: UserCheck, color: 'text-purple-600 bg-purple-50' },
    { label: "Today's Sessions", value: todaySessions?.length ?? 0, icon: Calendar, color: 'text-amber-600 bg-amber-50' },
  ]

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="flex items-center gap-4 py-5">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{value}</p>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Today's Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Sessions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!todaySessions || todaySessions.length === 0 ? (
              <p className="text-slate-500 text-sm px-6 py-8 text-center">No sessions scheduled for today.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {todaySessions.map((session: any) => (
                  <li key={session.id}>
                    <Link
                      href={`/courses/${session.course.id}/sessions/${session.id}`}
                      className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: session.teacher?.color ?? '#94a3b8' }}
                        />
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {session.course.level} — {session.course.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            Session {session.session_number}
                            {session.teacher && ` · ${session.teacher.name}`}
                          </p>
                        </div>
                      </div>
                      <Badge variant="info">Open →</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Active Courses */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Active Courses</h2>
            <Link href="/courses" className="text-sm text-blue-600 hover:underline">View all →</Link>
          </div>
          <ActiveCoursesList />
        </div>
      </div>
    </AppShell>
  )
}

async function ActiveCoursesList() {
  const supabase = await createClient()
  const { data: courses } = await supabase
    .from('courses')
    .select('id, name, level, type, schedule_time')
    .eq('is_active', true)
    .order('start_date', { ascending: false })
    .limit(6)

  if (!courses || courses.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-slate-500 text-sm">
          No active courses.{' '}
          <Link href="/courses/new" className="text-blue-600 hover:underline">Create one →</Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {courses.map((course: any) => (
        <Link key={course.id} href={`/courses/${course.id}`}>
          <Card className="hover:border-blue-200 hover:shadow-md transition-all cursor-pointer h-full">
            <CardContent className="py-5">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-slate-900 text-sm">{course.name}</p>
                <Badge variant="info">{course.level}</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">{course.schedule_time}</p>
              <Badge variant="outline" className="mt-3 capitalize">{course.type}</Badge>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
