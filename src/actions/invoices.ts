'use server'

import { createClient } from '@supabase/supabase-js'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export interface Invoice {
  id: string
  student_id: string
  course_id: string | null
  invoice_number: string
  amount: number
  description: string | null
  status: 'unpaid' | 'paid'
  issued_date: string
  due_date: string | null
  sent_at: string | null
  paid_at: string | null
  notes: string | null
  created_at: string
  course?: { name: string; level: string } | null
}

export async function getStudentInvoices(studentId: string): Promise<Invoice[]> {
  const { data, error } = await serviceClient()
    .from('invoices')
    .select('*, course:courses(name, level)')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
  if (error) return []
  return (data ?? []) as Invoice[]
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const { data, error } = await serviceClient()
    .from('invoices')
    .select('*, course:courses(name, level)')
    .eq('id', id)
    .single()
  if (error) return null
  return data as Invoice
}

export async function createInvoice({
  studentId,
  courseId,
  amount,
  description,
  dueDate,
  notes,
}: {
  studentId: string
  courseId: string | null
  amount: number
  description: string
  dueDate: string
  notes: string
}): Promise<string | null> {
  const supabase = serviceClient()

  // Auto-generate invoice number as YYYY-NNN
  const year = new Date().getFullYear()
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${year}-01-01`)

  const seq = String((count ?? 0) + 1).padStart(3, '0')
  const invoiceNumber = `${year}-${seq}`

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      student_id: studentId,
      course_id: courseId || null,
      invoice_number: invoiceNumber,
      amount,
      description: description || null,
      due_date: dueDate || null,
      notes: notes || null,
      status: 'unpaid',
    })
    .select('id')
    .single()

  if (error) return null

  // Move student to "Invoiced - Waiting for Payment"
  await supabase
    .from('students')
    .update({ customer_type: 'Invoiced - Waiting for Payment' })
    .eq('id', studentId)
    .in('customer_type', ['Close, Place and Invoice', 'Pending Assessment'])

  return data?.id ?? null
}

export async function markPaid(id: string): Promise<void> {
  const supabase = serviceClient()

  // Get the student_id from the invoice first
  const { data: inv } = await supabase
    .from('invoices')
    .select('student_id')
    .eq('id', id)
    .single()

  await supabase
    .from('invoices')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', id)

  // Move student to Active
  if (inv?.student_id) {
    await supabase
      .from('students')
      .update({ customer_type: null, is_active: true })
      .eq('id', inv.student_id)
      .eq('customer_type', 'Invoiced - Waiting for Payment')
  }
}

export async function markUnpaid(id: string): Promise<void> {
  await serviceClient()
    .from('invoices')
    .update({ status: 'unpaid', paid_at: null })
    .eq('id', id)
}

export async function markSent(id: string): Promise<void> {
  await serviceClient()
    .from('invoices')
    .update({ sent_at: new Date().toISOString() })
    .eq('id', id)
}

export async function deleteInvoice(id: string): Promise<void> {
  await serviceClient()
    .from('invoices')
    .delete()
    .eq('id', id)
}
