import { addDays, format, getDay } from 'date-fns'
import type { DayOfWeek } from '@/types/database'

const DAY_MAP: Record<DayOfWeek, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

export function generateSessionDates(
  startDate: Date,
  scheduleDays: DayOfWeek[],
  totalSessions: number
): Date[] {
  const dayNumbers = scheduleDays.map((d) => DAY_MAP[d])
  const dates: Date[] = []
  let current = new Date(startDate)

  while (dates.length < totalSessions) {
    if (dayNumbers.includes(getDay(current))) {
      dates.push(new Date(current))
    }
    current = addDays(current, 1)
  }

  return dates
}

export function formatSessionDate(dateStr: string): string {
  return format(new Date(dateStr), 'dd.MM.yy')
}

export function formatFullDate(dateStr: string): string {
  return format(new Date(dateStr), 'EEEE, dd.MM.yyyy')
}

export function getDayLabel(day: DayOfWeek): string {
  return {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun',
  }[day]
}
