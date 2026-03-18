'use client'

import { AppShell } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { verifyAdminPin, getAdminFieldDefs, saveAdminData } from '@/actions/admin'
import type { AdminFieldDef } from '@/actions/admin'
import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Trash2, Lock, Unlock, Eye, EyeOff } from 'lucide-react'

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
  phone: string | null
  address: string | null
  plz: string | null
  city: string | null
  notes: string | null
  is_active: boolean
  admin_data: Record<string, string> | null
}

interface Enrollment {
  id: string; status: string; ue_balance: number
  payment_notes: string | null; enrolled_at: string
  course: { id: string; name: string; level: string; type: string }
}

function fullName(s: Student) {
  return [s.first_name, s.last_name].filter(Boolean).join(' ') || s.name || '—'
}

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  active: 'success', paused: 'warning', dropped: 'danger', completed: 'default',
}

const SESSION_KEY = 'adminUnlocked'

export default function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()
  const router = useRouter()

  const [student, setStudent] = useState<Student | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [ueEditId, setUeEditId] = useState<string | null>(null)
  const [ueValue, setUeValue] = useState('')
  const [saving, setSaving] = useState(false)

  // Edit form state
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

  // Admin section state
  const [adminUnlocked, setAdminUnlocked] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [pinLoading, setPinLoading] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [adminFields, setAdminFields] = useState<AdminFieldDef[]>([])
  const [adminValues, setAdminValues] = useState<Record<string, string>>({})
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [savingField, setSavingField] = useState(false)

  async function load() {
    const [{ data: s }, { data: e }] = await Promise.all([
      supabase.from('students').select('*').eq('id', id).single(),
      supabase.from('enrollments').select('*, course:courses(id, name, level, type)')
        .eq('student_id', id).order('enrolled_at', { ascending: false }),
    ])
    setStudent(s)
    setAdminValues(s?.admin_data ?? {})
    setEnrollments(e ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  // Check sessionStorage for existing unlock
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAdminUnlocked(sessionStorage.getItem(SESSION_KEY) === 'true')
    }
  }, [])

  // Load admin field definitions when unlocked
  const [adminDbPending, setAdminDbPending] = useState(false)
  useEffect(() => {
    if (adminUnlocked) {
      getAdminFieldDefs().then((defs) => {
        const active = defs.filter((d) => d.is_active)
        setAdminFields(active)
        setAdminDbPending(defs.length === 0)
      })
    }
  }, [adminUnlocked])

  function openEdit() {
    if (!student) return
    setFirstName(student.first_name ?? '')
    setLastName(student.last_name ?? '')
    setCompany(student.company ?? '')
    setCustomerType(student.customer_type ?? '')
    setDob(student.date_of_birth ?? '')
    setMobile(student.mobile ?? '')
    setEmail(student.email ?? '')
    setAddress(student.address ?? '')
    setPlz(student.plz ?? '')
    setCity(student.city ?? '')
    setNotes(student.notes ?? '')
    setEditOpen(true)
  }

  async function handleSaveStudent() {
    if (!firstName.trim() && !lastName.trim()) return
    setSaving(true)
    const name = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
    await supabase.from('students').update({
      name,
      first_name: firstName.trim() || null,
      last_name: lastName.trim() || null,
      company: company.trim() || null,
      customer_type: customerType.trim() || null,
      date_of_birth: dob || null,
      mobile: mobile.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
      plz: plz.trim() || null,
      city: city.trim() || null,
      notes: notes.trim() || null,
    }).eq('id', id)
    setSaving(false)
    setEditOpen(false)
    load()
  }

  async function handleDelete() {
    if (!confirm(`Delete ${fullName(student!)}? This will remove all their attendance records and enrollments.`)) return
    await supabase.from('students').update({ is_active: false }).eq('id', id)
    router.push('/students')
  }

  async function handleToggleActive() {
    if (!student) return
    await supabase.from('students').update({ is_active: !student.is_active }).eq('id', id)
    load()
  }

  async function handleSaveUE(enrollmentId: string) {
    await supabase.from('enrollments').update({ ue_balance: parseInt(ueValue) || 0 }).eq('id', enrollmentId)
    setUeEditId(null)
    load()
  }

  // ── Admin PIN ──────────────────────────────────────────────────────────────

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    setPinLoading(true)
    setPinError('')
    const ok = await verifyAdminPin(pinInput)
    setPinLoading(false)
    if (ok) {
      sessionStorage.setItem(SESSION_KEY, 'true')
      setAdminUnlocked(true)
      setPinInput('')
    } else {
      setPinError('Incorrect PIN.')
    }
  }

  function handleLock() {
    sessionStorage.removeItem(SESSION_KEY)
    setAdminUnlocked(false)
    setPinInput('')
    setPinError('')
  }

  // ── Admin field editing ────────────────────────────────────────────────────

  function startEdit(fieldId: string) {
    setEditingFieldId(fieldId)
    setEditingValue(adminValues[fieldId] ?? '')
  }

  async function commitEdit(fieldId: string) {
    if (!student) return
    setSavingField(true)
    const updated = { ...adminValues, [fieldId]: editingValue }
    setAdminValues(updated)
    await saveAdminData(student.id, updated)
    setSavingField(false)
    setEditingFieldId(null)
  }

  if (loading) return <AppShell><p className="text-slate-500">Loading...</p></AppShell>
  if (!student) return <AppShell><p className="text-slate-500">Student not found.</p></AppShell>

  const display = fullName(student)
  const active = enrollments.filter((e) => e.status === 'active')
  const past = enrollments.filter((e) => e.status !== 'active')

  return (
    <AppShell>
      <div className="space-y-6 max-w-2xl">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/students" className="text-slate-400 hover:text-slate-700">
            <ArrowLeft size={20} />
          </Link>
          <h1 className={`text-2xl font-bold ${student.is_active ? 'text-slate-900' : 'text-slate-400 line-through'}`}>{display}</h1>
          {student.student_number && (
            <span className="text-sm font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">#{student.student_number}</span>
          )}
          <div className="ml-auto flex items-center gap-1">
            {/* Active/Inactive toggle */}
            <button
              onClick={handleToggleActive}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors mr-1 ${
                student.is_active
                  ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
                  : 'bg-slate-100 text-slate-500 hover:bg-green-100 hover:text-green-700'
              }`}
            >
              {student.is_active ? 'Active' : 'Inactive'}
            </button>
            <button onClick={openEdit} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100">
              <Pencil size={16} />
            </button>
            <button onClick={handleDelete} className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50">
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Contact / profile info */}
        <div className="bg-white rounded-xl border border-slate-200 px-6 py-4 space-y-2">
          {student.company && (
            <p className="text-sm text-slate-600"><span className="text-slate-400 w-28 inline-block">Company</span>{student.company}</p>
          )}
          {student.customer_type && (
            <p className="text-sm text-slate-600"><span className="text-slate-400 w-28 inline-block">Customer Type</span>{student.customer_type}</p>
          )}
          {student.date_of_birth && (
            <p className="text-sm text-slate-600"><span className="text-slate-400 w-28 inline-block">Date of Birth</span>{new Date(student.date_of_birth).toLocaleDateString('de-DE')}</p>
          )}
          {student.mobile && (
            <p className="text-sm text-slate-600"><span className="text-slate-400 w-28 inline-block">Mobile</span>{student.mobile}</p>
          )}
          {(student.phone && !student.mobile) && (
            <p className="text-sm text-slate-600"><span className="text-slate-400 w-28 inline-block">Phone</span>{student.phone}</p>
          )}
          {student.email && (
            <p className="text-sm text-slate-600"><span className="text-slate-400 w-28 inline-block">Email</span>{student.email}</p>
          )}
          {(student.address || student.plz || student.city) && (
            <p className="text-sm text-slate-600">
              <span className="text-slate-400 w-28 inline-block">Address</span>
              {[student.address, [student.plz, student.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')}
            </p>
          )}
          {student.notes && (
            <p className="text-sm text-slate-600"><span className="text-slate-400 w-28 inline-block">Notes</span>{student.notes}</p>
          )}
          {!student.company && !student.email && !student.mobile && !student.phone && !student.address && !student.notes && (
            <p className="text-sm text-slate-400">No contact info yet. <button onClick={openEdit} className="text-blue-600 hover:underline">Add it →</button></p>
          )}
        </div>

        {/* Admin Section */}
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className={`flex items-center justify-between px-6 py-3 ${adminUnlocked ? 'bg-amber-50 border-b border-amber-100' : 'bg-slate-50'}`}>
            <div className="flex items-center gap-2">
              {adminUnlocked ? <Unlock size={14} className="text-amber-600" /> : <Lock size={14} className="text-slate-400" />}
              <span className={`text-sm font-semibold ${adminUnlocked ? 'text-amber-800' : 'text-slate-500'}`}>Admin</span>
            </div>
            {adminUnlocked && (
              <button onClick={handleLock} className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1">
                <Lock size={12} /> Lock
              </button>
            )}
          </div>

          {!adminUnlocked ? (
            /* Locked state */
            <div className="bg-white px-6 py-5">
              <form onSubmit={handleUnlock} className="flex items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pinInput}
                    onChange={(e) => { setPinInput(e.target.value); setPinError('') }}
                    placeholder="Enter admin PIN to unlock"
                    className="w-full pr-9 pl-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <Button type="submit" disabled={pinLoading || !pinInput}>
                  {pinLoading ? 'Checking...' : 'Unlock'}
                </Button>
              </form>
              {pinError && <p className="text-xs text-red-600 mt-2">{pinError}</p>}
            </div>
          ) : (
            /* Unlocked state */
            <div className="bg-white divide-y divide-slate-100">
              {adminDbPending ? (
                <p className="px-6 py-4 text-sm text-amber-700 bg-amber-50">
                  ⚠️ Database migration pending — admin fields not available yet.
                </p>
              ) : adminFields.length === 0 ? (
                <p className="px-6 py-4 text-sm text-slate-400">
                  No admin fields configured. <Link href="/settings" className="text-blue-600 hover:underline">Add fields in Settings →</Link>
                </p>
              ) : (
                adminFields.map((field) => (
                  <div key={field.id} className="px-6 py-3">
                    <p className="text-xs text-slate-400 mb-1">{field.label}</p>
                    {editingFieldId === field.id ? (
                      <div className="flex items-start gap-2">
                        {field.field_type === 'textarea' ? (
                          <textarea
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) commitEdit(field.id) }}
                            rows={3}
                            autoFocus
                            className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                          />
                        ) : (
                          <input
                            type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(field.id) }}
                            autoFocus
                            className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                          />
                        )}
                        <div className="flex gap-1 mt-0.5">
                          <button
                            onClick={() => commitEdit(field.id)}
                            disabled={savingField}
                            className="text-xs text-amber-700 font-medium hover:underline"
                          >
                            Save
                          </button>
                          <button onClick={() => setEditingFieldId(null)} className="text-xs text-slate-400 hover:underline">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(field.id)}
                        className="text-sm text-slate-700 text-left w-full hover:text-amber-700 group"
                      >
                        {adminValues[field.id] ? (
                          <span className="whitespace-pre-wrap">{adminValues[field.id]}</span>
                        ) : (
                          <span className="text-slate-300 group-hover:text-amber-400 italic">Click to add...</span>
                        )}
                      </button>
                    )}
                  </div>
                ))
              )}
              <div className="px-6 py-3">
                <Link href="/settings" className="text-xs text-slate-400 hover:text-blue-600">
                  Manage admin fields in Settings →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Active Courses */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Active Courses</h2>
          {active.length === 0 ? (
            <p className="text-sm text-slate-400 bg-white rounded-xl border border-slate-200 px-6 py-5">Not enrolled in any active courses.</p>
          ) : (
            <div className="space-y-3">
              {active.map((e) => (
                <div key={e.id} className="bg-white rounded-xl border border-slate-200 px-6 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Link href={`/courses/${e.course.id}`} className="font-medium text-slate-900 hover:text-blue-600 text-sm">
                        {e.course.level} — {e.course.name}
                      </Link>
                      <p className="text-xs text-slate-500 mt-0.5 capitalize">{e.course.type}</p>
                    </div>
                    <Badge variant={statusVariant[e.status] ?? 'default'} className="capitalize">{e.status}</Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">UE Balance:</span>
                      {ueEditId === e.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={ueValue}
                            onChange={(ev) => setUeValue(ev.target.value)}
                            className="w-16 text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button onClick={() => handleSaveUE(e.id)} className="text-xs text-blue-600 hover:underline">Save</button>
                          <button onClick={() => setUeEditId(null)} className="text-xs text-slate-400 hover:underline">Cancel</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setUeEditId(e.id); setUeValue(String(e.ue_balance)) }}
                          className={`text-xs font-medium px-2 py-0.5 rounded ${e.ue_balance < 0 ? 'text-red-700 bg-red-50' : 'text-green-700 bg-green-50'}`}
                        >
                          {e.ue_balance >= 0 ? `+${e.ue_balance}` : e.ue_balance} UE
                        </button>
                      )}
                    </div>
                    {e.payment_notes && <p className="text-xs text-slate-400">{e.payment_notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Courses */}
        {past.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Past Courses</h2>
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              {past.map((e) => (
                <div key={e.id} className="flex items-center justify-between px-6 py-3">
                  <Link href={`/courses/${e.course.id}`} className="text-sm text-slate-700 hover:text-blue-600">
                    {e.course.level} — {e.course.name}
                  </Link>
                  <Badge variant={statusVariant[e.status] ?? 'default'} className="capitalize">{e.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Student Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} title="Edit Student" className="max-w-lg">
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
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveStudent} disabled={saving || (!firstName.trim() && !lastName.trim())}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </Dialog>
    </AppShell>
  )
}
