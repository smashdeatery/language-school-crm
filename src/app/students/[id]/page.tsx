'use client'

import { AppShell } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'

interface Student {
  id: string; name: string; email: string | null
  phone: string | null; notes: string | null
}
interface Enrollment {
  id: string; status: string; ue_balance: number
  payment_notes: string | null; enrolled_at: string
  course: { id: string; name: string; level: string; type: string }
}

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  active: 'success', paused: 'warning', dropped: 'danger', completed: 'default',
}

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
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const [{ data: s }, { data: e }] = await Promise.all([
      supabase.from('students').select('*').eq('id', id).single(),
      supabase.from('enrollments').select('*, course:courses(id, name, level, type)')
        .eq('student_id', id).order('enrolled_at', { ascending: false }),
    ])
    setStudent(s)
    setEnrollments(e ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  function openEdit() {
    if (!student) return
    setName(student.name); setEmail(student.email ?? ''); setPhone(student.phone ?? ''); setNotes(student.notes ?? '')
    setEditOpen(true)
  }

  async function handleSaveStudent() {
    if (!name.trim()) return
    setSaving(true)
    await supabase.from('students').update({
      name: name.trim(), email: email.trim() || null,
      phone: phone.trim() || null, notes: notes.trim() || null,
    }).eq('id', id)
    setSaving(false)
    setEditOpen(false)
    load()
  }

  async function handleDelete() {
    if (!confirm(`Delete ${student?.name}? This will remove all their attendance records and enrollments.`)) return
    await supabase.from('students').update({ is_active: false }).eq('id', id)
    router.push('/students')
  }

  async function handleSaveUE(enrollmentId: string) {
    await supabase.from('enrollments').update({ ue_balance: parseInt(ueValue) || 0 }).eq('id', enrollmentId)
    setUeEditId(null)
    load()
  }

  if (loading) return <AppShell><p className="text-slate-500">Loading...</p></AppShell>
  if (!student) return <AppShell><p className="text-slate-500">Student not found.</p></AppShell>

  const active = enrollments.filter((e) => e.status === 'active')
  const past = enrollments.filter((e) => e.status !== 'active')

  return (
    <AppShell>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-3">
          <Link href="/students" className="text-slate-400 hover:text-slate-700">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{student.name}</h1>
          <div className="ml-auto flex items-center gap-1">
            <button onClick={openEdit} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100">
              <Pencil size={16} />
            </button>
            <button onClick={handleDelete} className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50">
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Contact info */}
        <div className="bg-white rounded-xl border border-slate-200 px-6 py-4 space-y-2">
          {student.email && <p className="text-sm text-slate-600"><span className="text-slate-400 w-14 inline-block">Email</span>{student.email}</p>}
          {student.phone && <p className="text-sm text-slate-600"><span className="text-slate-400 w-14 inline-block">Phone</span>{student.phone}</p>}
          {student.notes && <p className="text-sm text-slate-600"><span className="text-slate-400 w-14 inline-block">Notes</span>{student.notes}</p>}
          {!student.email && !student.phone && !student.notes && (
            <p className="text-sm text-slate-400">No contact info yet. <button onClick={openEdit} className="text-blue-600 hover:underline">Add it →</button></p>
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

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} title="Edit Student">
        <div className="space-y-4">
          <Input label="Full Name *" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveStudent} disabled={saving || !name.trim()}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </Dialog>
    </AppShell>
  )
}
