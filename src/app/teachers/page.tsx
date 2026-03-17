'use client'

import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'

const PRESET_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
  '#6366F1', '#84CC16', '#64748B', '#0EA5E9',
]

interface Teacher {
  id: string
  name: string
  color: string | null
  is_active: boolean
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  async function load() {
    const { data } = await supabase
      .from('teachers')
      .select('*')
      .eq('is_active', true)
      .order('name')
    setTeachers(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditingTeacher(null)
    setName('')
    setColor(PRESET_COLORS[0])
    setDialogOpen(true)
  }

  function openEdit(teacher: Teacher) {
    setEditingTeacher(teacher)
    setName(teacher.name)
    setColor(teacher.color ?? PRESET_COLORS[0])
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    const { error } = editingTeacher
      ? await supabase.from('teachers').update({ name: name.trim(), color }).eq('id', editingTeacher.id)
      : await supabase.from('teachers').insert({ name: name.trim(), color })
    setSaving(false)
    if (error) {
      alert(`Could not save teacher: ${error.message}\n\nMake sure you are logged in and the database tables exist.`)
      return
    }
    setDialogOpen(false)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this teacher?')) return
    await supabase.from('teachers').update({ is_active: false }).eq('id', id)
    load()
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Teachers</h1>
          <Button onClick={openCreate}>
            <Plus size={16} /> Add Teacher
          </Button>
        </div>

        {loading ? (
          <p className="text-slate-500 text-sm">Loading...</p>
        ) : teachers.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <p className="text-slate-500 text-sm mb-4">No teachers added yet.</p>
            <Button onClick={openCreate}><Plus size={16} /> Add first teacher</Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {teachers.map((teacher) => (
              <div key={teacher.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: teacher.color ?? '#94a3b8' }}
                  >
                    {teacher.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-slate-900">{teacher.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(teacher)}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(teacher.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingTeacher ? 'Edit Teacher' : 'Add Teacher'}
      >
        <div className="space-y-5">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Viktoria"
            autoFocus
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Color</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? '#1e3a5f' : 'transparent',
                    outline: color === c ? '2px solid #3b82f6' : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </Dialog>
    </AppShell>
  )
}
