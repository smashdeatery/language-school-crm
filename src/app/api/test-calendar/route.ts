import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n')
  const calendarId = process.env.GOOGLE_CALENDAR_ID

  if (!email || !key || !calendarId) {
    return NextResponse.json({
      error: 'Missing env vars',
      has_email: !!email,
      has_key: !!key,
      has_calendar_id: !!calendarId,
    }, { status: 500 })
  }

  try {
    const auth = new google.auth.JWT({ email, key, scopes: ['https://www.googleapis.com/auth/calendar'] })
    const calendar = google.calendar({ version: 'v3', auth })

    const result = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: 'CRM Test Event — safe to delete',
        start: { date: '2026-04-01' },
        end: { date: '2026-04-01' },
      },
    })

    return NextResponse.json({ success: true, event_id: result.data.id, event_link: result.data.htmlLink })
  } catch (err: any) {
    return NextResponse.json({ error: err.message, code: err.code, status: err.status }, { status: 500 })
  }
}
