'use client'

import { AppShell } from '@/components/layout/AppShell'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, addWeeks, subWeeks,
  format, isSameMonth, isToday, isSameDay,
} from 'date-fns'

type View = 'month' | 'week' | 'day'

interface CalendarSession {
  id: string
  session_date: string
  course: { id: string; name: string; level: string; schedule_time: string } | null
  teacher: { id: string; name: string; color: string | null } | null
}

export default function CalendarPage() {
  const [view, setView] = useState<View>('month')
  const [current, setCurrent] = useState(() => new Date())
  const [sessions, setSessions] = useState<CalendarSession[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => { loadSessions() }, [current, view])

  function getRange() {
    if (view === 'month') {
      const ms = startOfMonth(current)
      return { from: format(ms, 'yyyy-MM-dd'), to: format(endOfMonth(current), 'yyyy-MM-dd') }
    }
    if (view === 'week') {
      const ws = startOfWeek(current, { weekStartsOn: 1 })
      return { from: format(ws, 'yyyy-MM-dd'), to: format(endOfWeek(current, { weekStartsOn: 1 }), 'yyyy-MM-dd') }
    }
    const d = format(current, 'yyyy-MM-dd')
    return { from: d, to: d }
  }

  async function loadSessions() {
    setLoading(true)
    const { from, to } = getRange()
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

  function navigate(dir: 1 | -1) {
    if (view === 'month') setCurrent(m => dir === 1 ? addMonths(m, 1) : subMonths(m, 1))
    if (view === 'week') setCurrent(d => dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1))
    if (view === 'day') setCurrent(d => addDays(d, dir))
  }

  function headerLabel() {
    if (view === 'month') return format(current, 'MMMM yyyy')
    if (view === 'week') {
      const ws = startOfWeek(current, { weekStartsOn: 1 })
      const we = endOfWeek(current, { weekStartsOn: 1 })
      return `${format(ws, 'd MMM')} – ${format(we, 'd MMM yyyy')}`
    }
    return format(current, 'EEEE, d MMMM yyyy')
  }

  const sessionsByDate: Record<string, CalendarSession[]> = {}
  sessions.forEach((s) => {
    if (!sessionsByDate[s.session_date]) sessionsByDate[s.session_date] = []
    sessionsByDate[s.session_date].push(s)
  })

  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  // Month view days
  const monthGridStart = startOfWeek(startOfMonth(current), { weekStartsOn: 1 })
  const monthGridEnd = endOfWeek(endOfMonth(current), { weekStartsOn: 1 })
  const monthDays: Date[] = []
  let cur = monthGridStart
  while (cur <= monthGridEnd) { monthDays.push(cur); cur = addDays(cur, 1) }

  // Week view days
  const weekStart = startOfWeek(current, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  function SessionChip({ s }: { s: CalendarSession }) {
    const color = s.teacher?.color ?? '#94a3b8'
    return (
      <button
        onClick={() => s.course && router.push(`/courses/${s.course.id}`)}
        className="w-full text-left rounded-md px-2 py-1 hover:opacity-80 transition-opacity"
        style={{ backgroundColor: color + '20', borderLeft: `3px solid ${color}` }}
      >
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-xs font-bold shrink-0 px-1 rounded" style={{ color, backgroundColor: color + '30' }}>
            {s.course?.level ?? '—'}
          </span>
          <span className="text-xs text-slate-700 font-medium truncate">{s.course?.name ?? '—'}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-slate-400 font-mono">{s.course?.schedule_time ?? ''}</span>
          {s.teacher && <span className="text-xs text-slate-400 truncate">· {s.teacher.name}</span>}
        </div>
      </button>
    )
  }

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-bold text-slate-900">{headerLabel()}</h1>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm">
              {(['month', 'week', 'day'] as View[]).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 capitalize transition-colors ${
                    view === v ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <button onClick={() => navigate(-1)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setCurrent(new Date())}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Today
            </button>
            <button onClick={() => navigate(1)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Month View */}
        {view === 'month' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-7 border-b border-slate-100">
              {DAY_LABELS.map(d => (
                <div key={d} className="px-3 py-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 divide-x divide-slate-100">
              {monthDays.map((day, i) => {
                const iso = format(day, 'yyyy-MM-dd')
                const daySessions = sessionsByDate[iso] ?? []
                const isCurrentMonth = isSameMonth(day, current)
                return (
                  <div key={iso} className={`min-h-[110px] p-2 border-b border-slate-100 ${!isCurrentMonth ? 'bg-slate-50/60' : ''} ${i % 7 >= 5 ? 'bg-slate-50/40' : ''}`}>
                    <div className="flex justify-end mb-1">
                      <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday(day) ? 'bg-blue-600 text-white' : isCurrentMonth ? 'text-slate-700' : 'text-slate-300'
                      }`}>{format(day, 'd')}</span>
                    </div>
                    <div className="space-y-1">
                      {daySessions.map(s => <SessionChip key={s.id} s={s} />)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Week View */}
        {view === 'week' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-7 border-b border-slate-100">
              {weekDays.map(day => (
                <div key={day.toISOString()} className={`px-3 py-3 text-center border-r last:border-r-0 border-slate-100 ${isToday(day) ? 'bg-blue-50' : ''}`}>
                  <p className="text-xs font-semibold text-slate-400 uppercase">{format(day, 'EEE')}</p>
                  <p className={`text-lg font-bold mt-0.5 w-8 h-8 mx-auto flex items-center justify-center rounded-full ${isToday(day) ? 'bg-blue-600 text-white' : 'text-slate-800'}`}>
                    {format(day, 'd')}
                  </p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 divide-x divide-slate-100">
              {weekDays.map(day => {
                const iso = format(day, 'yyyy-MM-dd')
                const daySessions = sessionsByDate[iso] ?? []
                return (
                  <div key={iso} className={`min-h-[200px] p-2 ${isToday(day) ? 'bg-blue-50/30' : ''}`}>
                    <div className="space-y-1.5">
                      {daySessions.length === 0
                        ? <p className="text-xs text-slate-300 text-center mt-4">—</p>
                        : daySessions.map(s => <SessionChip key={s.id} s={s} />)
                      }
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Day View */}
        {view === 'day' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className={`px-6 py-4 border-b border-slate-100 ${isToday(current) ? 'bg-blue-50' : ''}`}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{format(current, 'EEEE')}</p>
              <p className={`text-3xl font-bold mt-0.5 ${isToday(current) ? 'text-blue-600' : 'text-slate-900'}`}>
                {format(current, 'd MMMM yyyy')}
              </p>
            </div>
            <div className="p-4">
              {(sessionsByDate[format(current, 'yyyy-MM-dd')] ?? []).length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">No sessions on this day.</p>
              ) : (
                <div className="space-y-3 max-w-lg">
                  {(sessionsByDate[format(current, 'yyyy-MM-dd')] ?? []).map(s => {
                    const color = s.teacher?.color ?? '#94a3b8'
                    return (
                      <button
                        key={s.id}
                        onClick={() => s.course && router.push(`/courses/${s.course.id}`)}
                        className="w-full text-left rounded-xl px-5 py-4 hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: color + '15', border: `2px solid ${color}40` }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold px-2 py-0.5 rounded-lg" style={{ color, backgroundColor: color + '30' }}>
                            {s.course?.level ?? '—'}
                          </span>
                          <span className="font-semibold text-slate-900">{s.course?.name ?? '—'}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                          <span className="font-mono">{s.course?.schedule_time ?? ''}</span>
                          {s.teacher && <span>· {s.teacher.name}</span>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {loading && <p className="text-center text-sm text-slate-400">Loading...</p>}
      </div>
    </AppShell>
  )
}
