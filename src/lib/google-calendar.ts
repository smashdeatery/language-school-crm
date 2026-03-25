import { google } from 'googleapis'

function getAuthClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n')
  const calendarId = process.env.GOOGLE_CALENDAR_ID

  if (!email || !key || !calendarId) return null

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  })

  return { auth, calendarId }
}

export async function createCalendarEvent(params: {
  sessionDate: string     // 'yyyy-MM-dd'
  scheduleTime: string    // 'HH:mm'
  endTime?: string | null // 'HH:mm' — if omitted, defaults to +90 min
  courseName: string
  courseLevel: string
  teacherName: string | null
  notes: string | null
}): Promise<string | null> {
  const client = getAuthClient()
  if (!client) {
    console.warn('Google Calendar env vars not set — skipping calendar sync')
    return null
  }

  try {
    const { auth, calendarId } = client
    const calendar = google.calendar({ version: 'v3', auth })

    // Compute end time using pure string/number math to avoid UTC/timezone issues
    let endTimeStr: string
    if (params.endTime) {
      endTimeStr = params.endTime
    } else {
      const [h, m] = params.scheduleTime.split(':').map(Number)
      const totalMinutes = h * 60 + m + 90
      const endH = Math.floor(totalMinutes / 60) % 24
      const endM = totalMinutes % 60
      endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
    }

    const descriptionParts: string[] = []
    if (params.teacherName) descriptionParts.push(`Teacher: ${params.teacherName}`)
    if (params.notes) descriptionParts.push(params.notes)

    const event = {
      summary: `${params.courseLevel} ${params.courseName}`,
      description: descriptionParts.join('\n') || undefined,
      start: {
        dateTime: `${params.sessionDate}T${params.scheduleTime}:00`,
        timeZone: 'Europe/Berlin',
      },
      end: {
        dateTime: `${params.sessionDate}T${endTimeStr}:00`,
        timeZone: 'Europe/Berlin',
      },
    }

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    })

    return response.data.id ?? null
  } catch (err) {
    console.error('Failed to create Google Calendar event:', err)
    return null
  }
}

export async function deleteCalendarEvent(googleEventId: string): Promise<void> {
  const client = getAuthClient()
  if (!client) return

  try {
    const { auth, calendarId } = client
    const calendar = google.calendar({ version: 'v3', auth })
    await calendar.events.delete({ calendarId, eventId: googleEventId })
  } catch (err) {
    console.error('Failed to delete Google Calendar event:', err)
  }
}
