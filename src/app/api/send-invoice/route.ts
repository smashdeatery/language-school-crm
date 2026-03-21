import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'RESEND_API_KEY is not configured. Add it in Vercel environment variables.' },
      { status: 503 }
    )
  }

  const { invoiceId } = await req.json()
  const supabase = serviceClient()

  const [{ data: invoice }, { data: settings }] = await Promise.all([
    supabase
      .from('invoices')
      .select('*, student:students(name, email, address, plz, city), course:courses(name, level)')
      .eq('id', invoiceId)
      .single(),
    supabase.from('school_settings').select('key, value'),
  ])

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 })
  }

  const student = Array.isArray(invoice.student) ? invoice.student[0] : invoice.student
  if (!student?.email) {
    return NextResponse.json({ error: 'Student has no email address on their profile.' }, { status: 400 })
  }

  const s: Record<string, string> = {}
  ;(settings ?? []).forEach(({ key, value }: { key: string; value: string }) => { s[key] = value })

  const schoolName = s.school_name || 'Language School'
  const course = Array.isArray(invoice.course) ? invoice.course[0] : invoice.course

  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; padding: 40px; color: #1e293b;">
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px;">
      <div>
        <h1 style="font-size: 24px; font-weight: bold; margin: 0 0 6px;">${schoolName}</h1>
        ${s.school_address ? `<p style="color: #64748b; margin: 2px 0; font-size: 14px;">${s.school_address}</p>` : ''}
        ${s.school_email ? `<p style="color: #64748b; margin: 2px 0; font-size: 14px;">${s.school_email}</p>` : ''}
        ${s.school_phone ? `<p style="color: #64748b; margin: 2px 0; font-size: 14px;">${s.school_phone}</p>` : ''}
      </div>
      <div style="text-align: right;">
        <div style="background: #1e40af; color: white; display: inline-block; padding: 6px 16px; border-radius: 6px; font-size: 13px; font-weight: bold; letter-spacing: 1px; margin-bottom: 8px;">INVOICE</div>
        <p style="margin: 4px 0; font-size: 15px; font-weight: 600;">${invoice.invoice_number}</p>
        <p style="color: #64748b; font-size: 13px; margin: 2px 0;">Issued: ${new Date(invoice.issued_date + 'T12:00:00').toLocaleDateString('de-DE')}</p>
        ${invoice.due_date ? `<p style="color: #64748b; font-size: 13px; margin: 2px 0;">Due: ${new Date(invoice.due_date + 'T12:00:00').toLocaleDateString('de-DE')}</p>` : ''}
      </div>
    </div>

    <div style="background: #f8fafc; border-radius: 8px; padding: 16px 20px; margin-bottom: 30px;">
      <p style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Bill To</p>
      <p style="font-size: 16px; font-weight: 600; margin: 0 0 4px;">${student.name}</p>
      ${student.address ? `<p style="color: #64748b; margin: 2px 0; font-size: 14px;">${student.address}</p>` : ''}
      ${(student.plz || student.city) ? `<p style="color: #64748b; margin: 2px 0; font-size: 14px;">${[student.plz, student.city].filter(Boolean).join(' ')}</p>` : ''}
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
      <thead>
        <tr style="background: #f1f5f9; border-bottom: 2px solid #e2e8f0;">
          <th style="text-align: left; padding: 12px 16px; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Description</th>
          <th style="text-align: right; padding: 12px 16px; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 16px; font-size: 14px;">
            ${invoice.description || (course ? `${course.level} — ${course.name}` : 'Language Course')}
            ${course ? `<div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">${course.level} · ${course.name}</div>` : ''}
            ${invoice.notes ? `<div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">${invoice.notes}</div>` : ''}
          </td>
          <td style="padding: 16px; text-align: right; font-size: 15px; font-weight: 600;">€${Number(invoice.amount).toFixed(2)}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr style="background: #f8fafc; border-top: 2px solid #e2e8f0;">
          <td style="padding: 16px; font-weight: 700; font-size: 15px;">Total Due</td>
          <td style="padding: 16px; text-align: right; font-weight: 700; font-size: 20px; color: #1e40af;">€${Number(invoice.amount).toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>

    ${(s.bank_name || s.iban) ? `
    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-top: 30px;">
      <p style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px;">Payment Details</p>
      ${s.bank_name ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Bank:</strong> ${s.bank_name}</p>` : ''}
      ${s.iban ? `<p style="margin: 4px 0; font-size: 14px;"><strong>IBAN:</strong> ${s.iban}</p>` : ''}
      ${s.bic ? `<p style="margin: 4px 0; font-size: 14px;"><strong>BIC:</strong> ${s.bic}</p>` : ''}
      ${s.tax_number ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Tax No.:</strong> ${s.tax_number}</p>` : ''}
    </div>
    ` : ''}

    <p style="color: #94a3b8; font-size: 12px; margin-top: 40px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px;">
      Please use invoice number <strong>${invoice.invoice_number}</strong> as your payment reference.
    </p>
  </div>`

  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: student.email,
      replyTo: s.school_email || undefined,
      subject: `Invoice ${invoice.invoice_number} — ${schoolName}`,
      html,
    })

    await supabase
      .from('invoices')
      .update({ sent_at: new Date().toISOString() })
      .eq('id', invoiceId)

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
