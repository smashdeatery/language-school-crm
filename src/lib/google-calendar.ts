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

    const [hour, minute] = params.scheduleTime.split(':').map(Number)
    const startDateTime = new Date(`${params.sessionDate}T${params.scheduleTime}:00`)
    const endDateTime = new Date(startDateTime.getTime() + 90 * 60 * 1000)

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
        dateTime: endDateTime.toISOString().replace('Z', '').split('.')[0],
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
