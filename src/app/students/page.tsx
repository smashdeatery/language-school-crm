'use client'

import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import Link from 'next/link'

interface Student {
  id: string
  name: string
  student_number: string | null
  first_name: string | null
  last_name: string | null
  company: string | null
  customer_type: string | null
  date_of_birth: string | null
  email: string | null
  mobile: string | null
  address: string | null
  plz: string | null
  city: string | null
  notes: string | null
  is_active: boolean
}

function fullName(s: Student) {
  return [s.first_name, s.last_name].filter(Boolean).join(' ') || s.name || '—'
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [filtered, setFiltered] = useState<Student[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [company, setCompany] = useState('')
  const [customerType, setCustomerType] = useState('')
  const [dob, setDob] = useState('')
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [plz, setPlz] = useState('')
  const [city, setCity] = useState('')
  const [notes, setNotes] = useState('')

  const supabase = createClient()

  async function load() {
    const { data } = await supabase
      .from('students')
      .select('id, name, student_number, first_name, last_name, company, customer_type, date_of_birth, email, mobile, address, plz, city, notes, is_active')
      .order('student_number', { ascending: true })
    setStudents(data ?? [])
    setFiltered(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      students.filter((s) =>
        fullName(s).toLowerCase().includes(q) ||
        (s.email?.toLowerCase().includes(q) ?? false) ||
        (s.company?.toLowerCase().includes(q) ?? false) ||
        (s.student_number?.includes(q) ?? false)
      )
    )
  }, [search, students])

  function openCreate() {
    setFirstName(''); setLastName(''); setCompany(''); setCustomerType('')
    setDob(''); setMobile(''); setEmail(''); setAddress('')
    setPlz(''); setCity(''); setNotes('')
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!firstName.trim() && !lastName.trim()) return
    setSaving(true)
    const name = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
    await supabase.from('students').insert({
      name,
      first_name: firstName.trim() || null,
      last_name: lastName.trim() || null,
      company: company.trim() || null,
      customer_type: customerType.trim() || null,
      date_of_birth: dob || null,
      email: email.trim() || null,
      mobile: mobile.trim() || null,
      address: address.trim() || null,
      plz: plz.trim() || null,
      city: city.trim() || null,
      notes: notes.trim() || null,
    })
    setSaving(false)
    setDialogOpen(false)
    load()
  }

  async function toggleActive(student: Student, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setTogglingId(student.id)
    await supabase.from('students').update({ is_active: !student.is_active }).eq('id', student.id)
    setTogglingId(null)
    load()
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Students</h1>
          <Button onClick={openCreate}><Plus size={16} /> Add Student</Button>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, number, company or email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        {loading ? (
          <p className="text-slate-500 text-sm">Loading...</p>
        ) : (() => {
          const toClose = filtered.filter(s => s.customer_type === 'Close, Place and Invoice')
          const invoiced = filtered.filter(s => s.customer_type === 'Invoiced - Waiting for Payment')
          const pending = filtered.filter(s => s.customer_type === 'Pending Assessment')
          const regular = filtered.filter(s =>
            s.customer_type !== 'Pending Assessment' &&
            s.customer_type !== 'Close, Place and Invoice' &&
            s.customer_type !== 'Invoiced - Waiting for Payment'
          )

          const renderRow = (student: Student) => {
            const display = fullName(student)
            const subtitle = student.company || student.email
            const inactive = !student.is_active
            return (
              <Link
                key={student.id}
                href={`/students/${student.id}`}
                className={`flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors ${inactive ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-mono font-semibold shrink-0">
                    {student.student_number ?? '—'}
                  </div>
                  <div>
                    <p className={`font-medium text-sm ${inactive ? 'line-through text-slate-400' : 'text-slate-900'}`}>{display}</p>
                    {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
                    {student.city && <p className="text-xs text-slate-400">{[student.plz, student.city].filter(Boolean).join(' ')}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => toggleActive(student, e)}
                    disabled={togglingId === student.id}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                      inactive
                        ? 'bg-slate-100 text-slate-500 hover:bg-amber-100 hover:text-amber-700'
                        : 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
                    }`}
                  >
                    {inactive ? 'Inactive' : 'Active'}
                  </button>
                  <span className="text-xs text-slate-400">View →</span>
                </div>
              </Link>
            )
          }

          return (
            <>
              {toClose.length > 0 && (
                <div className="rounded-xl border border-red-200 bg-red-50 overflow-hidden">
                  <div className="px-6 py-3 border-b border-red-200 flex items-center gap-2">
                    <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">Close, Place and Invoice</span>
                    <span className="text-xs bg-red-200 text-red-800 rounded-full px-2 py-0.5 font-mono">{toClose.length}</span>
                  </div>
                  <div className="divide-y divide-red-100">
                    {toClose.map(student => (
                      <Link
                        key={student.id}
                        href={`/students/${student.id}`}
                        className="flex items-center justify-between px-6 py-4 hover:bg-red-100/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600 text-xs font-mono font-semibold shrink-0">
                            {student.student_number ?? '—'}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-slate-900">{fullName(student)}</p>
                            {student.email && <p className="text-xs text-slate-500">{student.email}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-red-200 text-red-800">Action needed</span>
                          <span className="text-xs text-slate-400">View →</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {invoiced.length > 0 && (
                <div className="rounded-xl border border-orange-200 bg-orange-50 overflow-hidden">
                  <div className="px-6 py-3 border-b border-orange-200 flex items-center gap-2">
                    <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Invoiced — Waiting for Payment</span>
                    <span className="text-xs bg-orange-200 text-orange-800 rounded-full px-2 py-0.5 font-mono">{invoiced.length}</span>
                  </div>
                  <div className="divide-y divide-orange-100">
                    {invoiced.map(student => (
                      <Link
                        key={student.id}
                        href={`/students/${student.id}`}
                        className="flex items-center justify-between px-6 py-4 hover:bg-orange-100/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-mono font-semibold shrink-0">
                            {student.student_number ?? '—'}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-slate-900">{fullName(student)}</p>
                            {student.email && <p className="text-xs text-slate-500">{student.email}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-orange-200 text-orange-800">Awaiting payment</span>
                          <span className="text-xs text-slate-400">View →</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {pending.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
                  <div className="px-6 py-3 border-b border-amber-200 flex items-center gap-2">
                    <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Pending Assessment</span>
                    <span className="text-xs bg-amber-200 text-amber-800 rounded-full px-2 py-0.5 font-mono">{pending.length}</span>
                  </div>
                  <div className="divide-y divide-amber-100">
                    {pending.map(student => (
                      <Link
                        key={student.id}
                        href={`/students/${student.id}`}
                        className="flex items-center justify-between px-6 py-4 hover:bg-amber-100/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 text-xs font-mono font-semibold shrink-0">
                            {student.student_number ?? '—'}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-slate-900">{fullName(student)}</p>
                            {student.email && <p className="text-xs text-slate-500">{student.email}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-200 text-amber-800">Pending</span>
                          <span className="text-xs text-slate-400">View →</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {regular.length === 0 && pending.length === 0 && toClose.length === 0 && invoiced.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                  <p className="text-slate-500 text-sm mb-4">
                    {search ? 'No students match your search.' : 'No students added yet.'}
                  </p>
                  {!search && <Button onClick={openCreate}><Plus size={16} /> Add first student</Button>}
                </div>
              ) : regular.length > 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                  {regular.map(renderRow)}
                </div>
              ) : null}
            </>
          )
        })()}

        <p className="text-xs text-slate-400 text-right">{filtered.length} student{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Add Student" className="max-w-lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name *" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Anna" autoFocus />
            <Input label="Last Name *" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Müller" />
          </div>
          <Input label="Company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Optional" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Customer Type" value={customerType} onChange={(e) => setCustomerType(e.target.value)} placeholder="e.g. Private" />
            <Input label="Date of Birth" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Mobile" type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+49 123 456" />
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="anna@email.com" />
          </div>
          <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Musterstraße 1" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="PLZ" value={plz} onChange={(e) => setPlz(e.target.value)} placeholder="10115" />
            <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Berlin" />
          </div>
          <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes..." rows={2} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || (!firstName.trim() && !lastName.trim())}>
              {saving ? 'Saving...' : 'Add Student'}
            </Button>
          </div>
        </div>
      </Dialog>
    </AppShell>
  )
}
