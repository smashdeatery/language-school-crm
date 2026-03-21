'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getInvoice, markPaid, markUnpaid, deleteInvoice, type Invoice } from '@/actions/invoices'
import { getSchoolSettings, type SchoolSettings } from '@/actions/school-settings'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Printer, Mail, Check, RotateCcw, Trash2 } from 'lucide-react'

interface Student {
  id: string; name: string; email: string | null
  address: string | null; plz: string | null; city: string | null
}

function fmt(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [student, setStudent] = useState<Student | null>(null)
  const [settings, setSettings] = useState<SchoolSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<string | null>(null)
  const [toggling, setToggling] = useState(false)

  async function load() {
    const [inv, sch] = await Promise.all([getInvoice(id), getSchoolSettings()])
    setInvoice(inv)
    setSettings(sch)
    if (inv) {
      const { data } = await supabase
        .from('students')
        .select('id, name, email, address, plz, city')
        .eq('id', inv.student_id)
        .single()
      setStudent(data)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  async function handleTogglePaid() {
    if (!invoice) return
    setToggling(true)
    if (invoice.status === 'paid') {
      await markUnpaid(invoice.id)
    } else {
      await markPaid(invoice.id)
    }
    setToggling(false)
    load()
  }

  async function handleSendEmail() {
    setSending(true)
    setSendResult(null)
    const res = await fetch('/api/send-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId: id }),
    })
    const json = await res.json()
    setSendResult(res.ok ? 'Email sent!' : (json.error ?? 'Failed to send.'))
    setSending(false)
    if (res.ok) load()
  }

  async function handleDelete() {
    if (!invoice) return
    if (!confirm(`Delete invoice ${invoice.invoice_number}? This cannot be undone.`)) return
    await deleteInvoice(invoice.id)
    router.push(`/students/${invoice.student_id}`)
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-slate-400">Loading...</p>
    </div>
  )

  if (!invoice || !settings) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-slate-400">Invoice not found.</p>
    </div>
  )

  const course = invoice.course as { name: string; level: string } | null | undefined
  const isPaid = invoice.status === 'paid'

  return (
    <>
      {/* Print-hide toolbar */}
      <div className="no-print bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href={`/students/${invoice.student_id}`} className="text-slate-400 hover:text-slate-700 flex items-center gap-1.5 text-sm">
          <ArrowLeft size={16} /> Back to student
        </Link>
        <span className="text-slate-200">|</span>
        <span className="text-sm font-semibold text-slate-700">{invoice.invoice_number}</span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            <Printer size={14} /> Print / PDF
          </button>
          <button
            onClick={handleSendEmail}
            disabled={sending || !student?.email}
            title={!student?.email ? 'Student has no email' : ''}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 disabled:opacity-50"
          >
            <Mail size={14} /> {sending ? 'Sending...' : 'Send Email'}
          </button>
          <button
            onClick={handleTogglePaid}
            disabled={toggling}
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border font-medium ${
              isPaid
                ? 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
            }`}
          >
            {isPaid ? <><RotateCcw size={14} /> Mark Unpaid</> : <><Check size={14} /> Mark Paid</>}
          </button>
          <button onClick={handleDelete} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {sendResult && (
        <div className={`no-print mx-auto max-w-3xl mt-3 px-6 py-3 rounded-lg text-sm font-medium ${
          sendResult === 'Email sent!' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {sendResult}
          {invoice.sent_at && sendResult === 'Email sent!' && (
            <span className="font-normal text-green-600 ml-2">
              Sent {new Date(invoice.sent_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      )}

      {/* A4 Invoice */}
      <div className="bg-slate-100 min-h-screen py-8 print:bg-white print:py-0">
        <div className="invoice-page relative bg-white mx-auto max-w-3xl shadow-sm print:shadow-none print:max-w-none p-12 print:p-10">

          {/* PAID watermark */}
          {isPaid && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 rotate-[-25deg]">
              <span className="text-green-600 text-9xl font-black tracking-widest border-8 border-green-600 px-6 py-2">PAID</span>
            </div>
          )}

          {/* Header */}
          <div className="flex justify-between items-start mb-12">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{settings.school_name || 'Language School'}</h1>
              {settings.school_address && <p className="text-slate-500 text-sm mt-1">{settings.school_address}</p>}
              {settings.school_email && <p className="text-slate-500 text-sm">{settings.school_email}</p>}
              {settings.school_phone && <p className="text-slate-500 text-sm">{settings.school_phone}</p>}
            </div>
            <div className="text-right">
              <div className="inline-block bg-blue-700 text-white text-xs font-bold tracking-widest px-4 py-1.5 rounded mb-3">INVOICE</div>
              <p className="text-lg font-semibold text-slate-900">{invoice.invoice_number}</p>
              <p className="text-sm text-slate-500">Issued: {fmt(invoice.issued_date)}</p>
              {invoice.due_date && <p className="text-sm text-slate-500">Due: {fmt(invoice.due_date)}</p>}
              {isPaid && invoice.paid_at && (
                <p className="text-sm text-green-600 font-medium mt-1">Paid: {new Date(invoice.paid_at).toLocaleDateString('de-DE')}</p>
              )}
            </div>
          </div>

          {/* Bill To */}
          <div className="bg-slate-50 rounded-xl p-5 mb-10">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Bill To</p>
            <p className="text-base font-semibold text-slate-900">{student?.name ?? '—'}</p>
            {student?.address && <p className="text-sm text-slate-600">{student.address}</p>}
            {(student?.plz || student?.city) && (
              <p className="text-sm text-slate-600">{[student.plz, student.city].filter(Boolean).join(' ')}</p>
            )}
            {student?.email && <p className="text-sm text-slate-400 mt-1">{student.email}</p>}
          </div>

          {/* Line items */}
          <table className="w-full mb-4">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Description</th>
                <th className="text-right pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-5 pr-8">
                  <p className="text-sm font-medium text-slate-900">
                    {invoice.description || (course ? `${course.level} — ${course.name}` : 'Language Course')}
                  </p>
                  {course && (
                    <p className="text-xs text-slate-400 mt-1">{course.level} · {course.name}</p>
                  )}
                  {invoice.notes && (
                    <p className="text-xs text-slate-400 mt-1">{invoice.notes}</p>
                  )}
                </td>
                <td className="py-5 text-right text-base font-semibold text-slate-900">
                  €{Number(invoice.amount).toFixed(2)}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-slate-50">
                <td className="py-4 px-4 text-sm font-bold text-slate-900 rounded-bl-lg">Total Due</td>
                <td className="py-4 px-4 text-right text-2xl font-bold text-blue-700 rounded-br-lg">
                  €{Number(invoice.amount).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Payment details */}
          {(settings.bank_name || settings.iban) && (
            <div className="mt-10 border-t border-slate-100 pt-8">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Payment Details</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {settings.bank_name && (
                  <div><span className="text-slate-400">Bank</span><p className="font-medium text-slate-800">{settings.bank_name}</p></div>
                )}
                {settings.iban && (
                  <div><span className="text-slate-400">IBAN</span><p className="font-medium text-slate-800 font-mono">{settings.iban}</p></div>
                )}
                {settings.bic && (
                  <div><span className="text-slate-400">BIC</span><p className="font-medium text-slate-800 font-mono">{settings.bic}</p></div>
                )}
                {settings.tax_number && (
                  <div><span className="text-slate-400">Tax No.</span><p className="font-medium text-slate-800">{settings.tax_number}</p></div>
                )}
              </div>
            </div>
          )}

          <p className="mt-12 text-center text-xs text-slate-300">
            Please use <strong>{invoice.invoice_number}</strong> as your payment reference.
          </p>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          .invoice-page { box-shadow: none !important; }
        }
      `}</style>
    </>
  )
}
