// Berlin public holidays — calculated for any year

function easterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month, day)
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function toISO(date: Date): string {
  return date.toISOString().split('T')[0]
}

export interface PublicHoliday {
  date: string   // YYYY-MM-DD
  name: string
}

export function getBerlinPublicHolidays(year: number): PublicHoliday[] {
  const easter = easterSunday(year)
  return [
    { date: `${year}-01-01`, name: 'Neujahr' },
    { date: toISO(addDays(easter, -2)), name: 'Karfreitag' },
    { date: toISO(easter), name: 'Ostersonntag' },
    { date: toISO(addDays(easter, 1)), name: 'Ostermontag' },
    { date: `${year}-05-01`, name: 'Tag der Arbeit' },
    { date: toISO(addDays(easter, 39)), name: 'Christi Himmelfahrt' },
    { date: toISO(addDays(easter, 49)), name: 'Pfingstsonntag' },
    { date: toISO(addDays(easter, 50)), name: 'Pfingstmontag' },
    { date: `${year}-10-03`, name: 'Tag der Deutschen Einheit' },
    { date: `${year}-12-25`, name: '1. Weihnachtstag' },
    { date: `${year}-12-26`, name: '2. Weihnachtstag' },
  ].sort((a, b) => a.date.localeCompare(b.date))
}

export function getHolidaysForRange(startDate: string, endDate: string): PublicHoliday[] {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const startYear = start.getFullYear()
  const endYear = end.getFullYear()
  const holidays: PublicHoliday[] = []
  for (let y = startYear; y <= endYear; y++) {
    holidays.push(...getBerlinPublicHolidays(y))
  }
  return holidays.filter(h => h.date >= startDate && h.date <= endDate)
}
