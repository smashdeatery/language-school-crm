'use server'

import { createClient } from '@supabase/supabase-js'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export interface AssessmentResult {
  placement: string
  confidence: number
  score_pct: number
  gate_fail: boolean
  gate_fail_topics: string[]
  section_scores: Record<string, number>
  question_results: Array<{
    n: number
    correct: boolean
    student_ans: string
    correct_ans: string
    note?: string
  }>
  reasoning: string
  recommendation: string
  focus_areas: string
}

export async function createPendingStudent(
  name: string,
  phone: string,
  email: string,
  result: AssessmentResult
): Promise<string | null> {
  const supabase = serviceClient()

  const parts = name.trim().split(/\s+/)
  const first_name = parts[0] ?? null
  const last_name = parts.length > 1 ? parts.slice(1).join(' ') : null

  const adminData: Record<string, string> = {
    assessment_result: JSON.stringify(result),
    assessment_date: new Date().toISOString(),
    placement: result.placement,
    score: `${result.score_pct}%`,
    confidence: `${result.confidence}%`,
    recommendation: result.recommendation,
    focus_areas: result.focus_areas,
    reasoning: result.reasoning,
  }

  const { data, error } = await supabase
    .from('students')
    .insert({
      name: name.trim(),
      first_name,
      last_name,
      mobile: phone.trim() || null,
      email: email.trim() || null,
      customer_type: 'Close, Place and Invoice',
      is_active: true,
      admin_data: adminData,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Failed to create pending student:', error)
    return null
  }

  return data?.id ?? null
}
