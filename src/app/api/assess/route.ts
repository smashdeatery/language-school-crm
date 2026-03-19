import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Assessment service not configured yet. Please contact the school.' },
      { status: 503 }
    )
  }

  const body = await req.json()

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  })

  const data = await response.json()

  if (!response.ok) {
    return NextResponse.json(
      { error: data.error?.message ?? 'Assessment failed. Please try again.' },
      { status: response.status }
    )
  }

  return NextResponse.json(data)
}
