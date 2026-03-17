'use client'

import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { Plus, Search, User } from 'lucide-react'
import Link from 'next/link'

interface Student {
  id: string
  name: string
  email: string | null
  phone: string | null
  notes: string | null
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [filtered, setFiltered] = useState<Student[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  async function load() {
    const { data } = await supabase
      .from('students')
      .select('id, name, email, phone, notes')
      .eq('is_active', true)
      .order('name')
    setStudents(data ?? [])
    setFiltered(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      students.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.email?.toLowerCase().includes(q) ?? false)
      )
    )
  }, [search, students])

  function openCreate() {
    setName(''); setEmail(''); setPhone(''); setNotes('')
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    await supabase.from('students').insert({
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      notes: notes.trim() || null,
    })
    setSaving(false)
    setDialogOpen(false)
    load()
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Students</h1>
          <Button onClick={openCreate}><Plus size={16} /> Add Student</Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        {loading ? (
          <p className="text-slate-500 text-sm">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <User size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm mb-4">
              {search ? 'No students match your search.' : 'No students added yet.'}
            </p>
            {!search && (
              <Button onClick={openCreate}><Plus size={16} /> Add first student</Button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {filtered.map((student) => (
              <Link
                key={student.id}
                href={`/students/${student.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-sm font-semibold">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{student.name}</p>
                    {student.email && (
                      <p className="text-xs text-slate-500">{student.email}</p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-slate-400">View profile →</span>
              </Link>
            ))}
          </div>
        )}

        <p className="text-xs text-slate-400 text-right">{filtered.length} student{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Add Student">
        <div className="space-y-4">
          <Input label="Full Name *" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Anna Müller" autoFocus />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="anna@email.com" />
          <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+49 123 456 789" />
          <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes about this student..." rows={2} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? 'Saving...' : 'Add Student'}
            </Button>
          </div>
        </div>
      </Dialog>
    </AppShell>
  )
}
