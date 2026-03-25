'use client'

import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { generateSessionDates } from '@/lib/utils/session-generator'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Calendar } from 'lucide-react'
import type { DayOfWeek } from '@/types/database'
import { syncSessionsToCalendar } from '@/actions/calendar-sync'

const LEVELS = ['A1.1','A1.2','A2.1','A2.2','B1.1','B1.2','B2.1','B2.2','C1','C2']
const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' },
]

export default function NewCoursePage() {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState('')
  const [level, setLevel] = useState('A1.2')
  const [type, setType] = useState('extensive')
  const [scheduleDays, setScheduleDays] = useState<DayOfWeek[]>([])
  const [scheduleTime, setScheduleTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [startDate, setStartDate] = useState('')
  const [totalSessions, setTotalSessions] = useState('24')
  const [durationWeeks, setDurationWeeks] = useState('12')
  const [materials, setMaterials] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function toggleDay(day: DayOfWeek) {
    setScheduleDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  // Preview generated sessions
  const previewSessions =
    startDate && scheduleDays.length > 0 && parseInt(totalSessions) > 0
      ? generateSessionDates(new Date(startDate), scheduleDays, parseInt(totalSessions))
      : []

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) return setError('Course name is required.')
    if (scheduleDays.length === 0) return setError('Select at least one day.')
    if (!startDate) return setError('Start date is required.')
    if (!scheduleTime) return setError('Schedule time is required.')

    setSaving(true)
    const start = new Date(startDate)
    const total = parseInt(totalSessions)
    const dates = generateSessionDates(start, scheduleDays, total)

    const { data: course, error: courseErr } = await supabase
      .from('courses')
      .insert({
        name: name.trim(),
        level,
        type,
        total_sessions: total,
        duration_weeks: durationWeeks ? parseInt(durationWeeks) : null,
        schedule_days: scheduleDays,
        schedule_time: scheduleTime,
        end_time: endTime.trim() || null,
        start_date: format(start, 'yyyy-MM-dd'),
        materials: materials.trim() || null,
      })
      .select()
      .single()

    if (courseErr || !course) {
      setError('Failed to create course. Please try again.')
      setSaving(false)
      return
    }

    const sessionRows = dates.map((date, i) => ({
      course_id: course.id,
      session_number: i + 1,
      session_date: format(date, 'yyyy-MM-dd'),
    }))

    const { data: insertedSessions } = await supabase
      .from('sessions')
      .insert(sessionRows)
      .select('id, session_date')

    // Sync to Google Calendar before navigating away
    if (insertedSessions?.length) {
      await syncSessionsToCalendar(
        insertedSessions,
        course.name,
        course.level,
        course.schedule_time,
        null,
        course.end_time ?? null
      ).catch(() => {/* silently ignore if Google sync fails */})
    }

    router.push(`/courses/${course.id}`)
  }

  return (
    <AppShell>
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/courses" className="text-slate-400 hover:text-slate-700">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">New Course</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Course Info</h2>

            <Input
              label="Group Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. The Ex-Moras"
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Level *"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                options={LEVELS.map((l) => ({ value: l, label: l }))}
              />
              <Select
                label="Type *"
                value={type}
                onChange={(e) => setType(e.target.value)}
                options={[
                  { value: 'extensive', label: 'Extensive' },
                  { value: 'intensive', label: 'Intensive' },
                  { value: 'private', label: 'Private' },
                ]}
              />
            </div>

            <Textarea
              label="Materials"
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              placeholder="e.g. DAF Leicht A1.2 / Grammatik Aktiv Neu"
              rows={2}
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Schedule</h2>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Days *</label>
              <div className="flex gap-2 flex-wrap">
                {DAYS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleDay(value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      scheduleDays.includes(value)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Time *"
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />
              <Input
                label="End Time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Input
                  label="Start Date *"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <Input
                label="Duration (weeks)"
                type="number"
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(e.target.value)}
                min="1"
              />
            </div>

            <Input
              label="Total Sessions *"
              type="number"
              value={totalSessions}
              onChange={(e) => setTotalSessions(e.target.value)}
              min="1"
            />

            {previewSessions.length > 0 && (
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={14} className="text-slate-500" />
                  <p className="text-xs font-medium text-slate-600">
                    {previewSessions.length} sessions will be generated
                  </p>
                </div>
                <p className="text-xs text-slate-500">
                  First: {format(previewSessions[0], 'dd.MM.yyyy')} · Last:{' '}
                  {format(previewSessions[previewSessions.length - 1], 'dd.MM.yyyy')}
                </p>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
          )}

          <div className="flex justify-end gap-3">
            <Link href="/courses">
              <Button variant="secondary" type="button">Cancel</Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? 'Creating...' : `Create Course & Generate ${totalSessions || 0} Sessions`}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  )
}
