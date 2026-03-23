'use client'

import { AppShell } from '@/components/layout/AppShell'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, format, isSameMonth, isToday,
} from 'date-fns'

interface CalendarSession {
  id: string
  session_date: string
  course: { id: string; name: string; level: string; schedule_time: string } | null
  teacher: { id: string; name: string; color: string | null } | null
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()))
  const [sessions, setSessions] = useState<CalendarSession[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadSessions()
  }, [currentMonth])

  async function loadSessions() {
    setLoading(true)
    const from = format(currentMonth, 'yyyy-MM-dd')
    const to = format(endOfMonth(currentMonth), 'yyyy-MM-dd')

    const { data } = await supabase
      .from('sessions')
      .select('id, session_date, course:courses(id, name, level, schedule_time), teacher:teachers(id, name, color)')
      .gte('session_date', from)
      .lte('session_date', to)
      .order('session_date')

    setSessions(
      (data ?? []).map((row: any) => ({
        ...row,
        course: Array.isArray(row.course) ? row.course[0] : row.course,
        teacher: Array.isArray(row.teacher) ? row.teacher[0] : row.teacher,
      })) as CalendarSession[]
    )
    setLoading(false)
  }

  // Build calendar grid: weeks starting Monday
  const gridStart = startOfWeek(currentMonth, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
  const days: Date[] = []
  let cur = gridStart
  while (cur <= gridEnd) {
    days.push(cur)
    cur = addDays(cur, 1)
  }

  const sessionsByDate: Record<string, CalendarSession[]> = {}
  sessions.forEach((s) => {
    if (!sessionsByDate[s.session_date]) sessionsByDate[s.session_date] = []
    sessionsByDate[s.session_date].push(s)
  })

  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentMonth(m => subMonths(m, 1))}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setCurrentMonth(startOfMonth(new Date()))}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentMonth(m => addMonths(m, 1))}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-slate-100">
            {DAY_LABELS.map(d => (
              <div key={d} className="px-3 py-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 divide-x divide-slate-100">
            {days.map((day, i) => {
              const iso = format(day, 'yyyy-MM-dd')
              const daySessions = sessionsByDate[iso] ?? []
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const todayCell = isToday(day)

              return (
                <div
                  key={iso}
                  className={`min-h-[110px] p-2 border-b border-slate-100 ${
                    !isCurrentMonth ? 'bg-slate-50/60' : ''
                  } ${i % 7 === 5 || i % 7 === 6 ? 'bg-slate-50/40' : ''}`}
                >
                  {/* Date number */}
                  <div className="flex justify-end mb-1">
                    <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                      todayCell
                        ? 'bg-blue-600 text-white'
                        : isCurrentMonth
                          ? 'text-slate-700'
                          : 'text-slate-300'
                    }`}>
                      {format(day, 'd')}
                    </span>
                  </div>

                  {/* Session chips */}
                  <div className="space-y-1">
                    {loading && isCurrentMonth && daySessions.length === 0 ? null : daySessions.map((s) => {
                      const color = s.teacher?.color ?? '#94a3b8'
                      return (
                        <button
                          key={s.id}
                          onClick={() => s.course && router.push(`/courses/${s.course.id}`)}
                          className="w-full text-left rounded-md px-2 py-1 hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: color + '20', borderLeft: `3px solid ${color}` }}
                        >
                          <div className="flex items-center gap-1 min-w-0">
                            <span
                              className="text-xs font-bold shrink-0 px-1 rounded"
                              style={{ color, backgroundColor: color + '30' }}
                            >
                              {s.course?.level ?? '—'}
                            </span>
                            <span className="text-xs text-slate-700 font-medium truncate">
                              {s.course?.name ?? '—'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs text-slate-400 font-mono">
                              {s.course?.schedule_time ?? ''}
                            </span>
                            {s.teacher && (
                              <span className="text-xs text-slate-400 truncate">· {s.teacher.name}</span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {loading && (
          <p className="text-center text-sm text-slate-400">Loading sessions...</p>
        )}
      </div>
    </AppShell>
  )
}
