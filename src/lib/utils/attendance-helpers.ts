import type { AttendanceStatus } from '@/types/database'

export function cycleStatus(current: AttendanceStatus | null): AttendanceStatus | null {
  const cycle: (AttendanceStatus | null)[] = [
    null,
    'present',
    'absent_unexcused',
    'absent_excused',
    'credit',
  ]
  const idx = cycle.indexOf(current)
  return cycle[(idx + 1) % cycle.length]
}

export function getStatusLabel(status: AttendanceStatus | null): string {
  switch (status) {
    case 'present': return 'Present'
    case 'absent_unexcused': return 'Absent'
    case 'absent_excused': return 'Excused'
    case 'credit': return 'Credit'
    case 'special': return 'Note'
    default: return '—'
  }
}

export function getStatusIcon(status: AttendanceStatus | null): string {
  switch (status) {
    case 'present': return '✓'
    case 'absent_unexcused': return '✗'
    case 'absent_excused': return 'E'
    case 'credit': return 'C'
    case 'special': return '!'
    default: return '·'
  }
}

export function getStatusColor(status: AttendanceStatus | null): string {
  switch (status) {
    case 'present': return 'bg-green-100 text-green-700 border-green-200'
    case 'absent_unexcused': return 'bg-red-100 text-red-700 border-red-200'
    case 'absent_excused': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'credit': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'special': return 'bg-purple-100 text-purple-700 border-purple-200'
    default: return 'bg-slate-50 text-slate-400 border-slate-200'
  }
}

export function calculateAttendanceRate(records: Array<{ status: AttendanceStatus | null }>): number {
  const marked = records.filter((r) => r.status !== null)
  if (marked.length === 0) return 0
  const present = marked.filter((r) => r.status === 'present').length
  return Math.round((present / marked.length) * 100)
}
