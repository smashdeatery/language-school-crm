'use client'

import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  verifyAdminPin,
  getAdminFieldDefs,
  createAdminField,
  updateAdminField,
  deleteAdminField,
} from '@/actions/admin'
import type { AdminFieldDef } from '@/actions/admin'
import { getClosures, addClosure, deleteClosure } from '@/actions/closures'
import type { SchoolClosure } from '@/actions/closures'
import { getBerlinPublicHolidays } from '@/lib/utils/holidays'
import { useEffect, useState } from 'react'
import { Lock, Unlock, Eye, EyeOff, Plus, Trash2, ChevronUp, ChevronDown, Pencil, Check, X } from 'lucide-react'

const SESSION_KEY = 'adminUnlocked'

const FIELD_TYPES = [
  { value: 'text', label: 'Short text' },
  { value: 'textarea', label: 'Long text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
]

export default function SettingsPage() {
  const [adminUnlocked, setAdminUnlocked] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [pinLoading, setPinLoading] = useState(false)
  const [showPin, setShowPin] = useState(false)

  const [fields, setFields] = useState<AdminFieldDef[]>([])
  const [loading, setLoading] = useState(false)
  const [dbPending, setDbPending] = useState(false)

  // New field form
  const [newLabel, setNewLabel] = useState('')
  const [newType, setNewType] = useState('text')
  const [adding, setAdding] = useState(false)

  // Inline edit
  const [editId, setEditId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editType, setEditType] = useState('text')

  // Closures
  const [closures, setClosures] = useState<SchoolClosure[]>([])
  const [closuresDbPending, setClosuresDbPending] = useState(false)
  const [newClosureStart, setNewClosureStart] = useState('')
  const [newClosureEnd, setNewClosureEnd] = useState('')
  const [newClosureName, setNewClosureName] = useState('')
  const [addingClosure, setAddingClosure] = useState(false)
  const currentYear = new Date().getFullYear()
  const publicHolidays = getBerlinPublicHolidays(currentYear)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const unlocked = sessionStorage.getItem(SESSION_KEY) === 'true'
      setAdminUnlocked(unlocked)
      if (unlocked) { loadFields(); loadClosures() }
    }
  }, [])

  async function loadClosures() {
    const data = await getClosures()
    setClosures(data)
    setClosuresDbPending(data.length === 0 && !await getClosures().then(() => true).catch(() => false))
  }

  async function handleAddClosure() {
    if (!newClosureStart || !newClosureName.trim()) return
    setAddingClosure(true)
    await addClosure(newClosureStart, newClosureName.trim(), newClosureEnd || undefined)
    setNewClosureStart('')
    setNewClosureEnd('')
    setNewClosureName('')
    setAddingClosure(false)
    loadClosures()
  }

  async function handleDeleteClosure(id: string, name: string) {
    if (!confirm(`Remove "${name}" from school closures?`)) return
    await deleteClosure(id)
    loadClosures()
  }

  async function loadFields() {
    setLoading(true)
    const defs = await getAdminFieldDefs()
    // getAdminFieldDefs returns [] both for empty table and missing table.
    // We detect "missing table" by checking if the fetch errored (it returns []).
    // A fresh DB with seeded data would have >0 rows, so empty = likely pending migration.
    setFields(defs)
    setDbPending(defs.length === 0)
    setLoading(false)
  }

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
      loadFields()
      loadClosures()
    } else {
      setPinError('Incorrect PIN.')
    }
  }

  function handleLock() {
    sessionStorage.removeItem(SESSION_KEY)
    setAdminUnlocked(false)
    setPinInput('')
  }

  async function handleAdd() {
    if (!newLabel.trim()) return
    setAdding(true)
    await createAdminField(newLabel.trim(), newType)
    setNewLabel('')
    setNewType('text')
    setAdding(false)
    loadFields()
  }

  async function handleToggleActive(field: AdminFieldDef) {
    await updateAdminField(field.id, { is_active: !field.is_active })
    loadFields()
  }

  async function handleDelete(id: string, label: string) {
    if (!confirm(`Delete field "${label}"? Any data saved for this field on student records will no longer be visible.`)) return
    await deleteAdminField(id)
    loadFields()
  }

  async function handleMove(field: AdminFieldDef, direction: 'up' | 'down') {
    const idx = fields.findIndex((f) => f.id === field.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= fields.length) return
    const swap = fields[swapIdx]
    await Promise.all([
      updateAdminField(field.id, { sort_order: swap.sort_order }),
      updateAdminField(swap.id, { sort_order: field.sort_order }),
    ])
    loadFields()
  }

  function startEdit(field: AdminFieldDef) {
    setEditId(field.id)
    setEditLabel(field.label)
    setEditType(field.field_type)
  }

  async function commitEdit() {
    if (!editId || !editLabel.trim()) return
    await updateAdminField(editId, { label: editLabel.trim(), field_type: editType as AdminFieldDef['field_type'] })
    setEditId(null)
    loadFields()
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
            <p className="text-sm text-slate-500 mt-1">Manage admin fields shown on student profiles.</p>
          </div>
          {adminUnlocked && (
            <button onClick={handleLock} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
              <Lock size={14} /> Lock
            </button>
          )}
        </div>

        {/* PIN gate */}
        {!adminUnlocked ? (
          <div className="bg-white rounded-xl border border-slate-200 px-6 py-8 flex flex-col items-center gap-4">
            <Lock size={28} className="text-slate-300" />
            <p className="text-sm text-slate-500">Enter your admin PIN to access settings.</p>
            <form onSubmit={handleUnlock} className="flex items-center gap-3">
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pinInput}
                  onChange={(e) => { setPinInput(e.target.value); setPinError('') }}
                  placeholder="Admin PIN"
                  autoFocus
                  className="pr-9 pl-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 w-44"
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
            {pinError && <p className="text-xs text-red-600">{pinError}</p>}
          </div>
        ) : (
          <>
            {/* Admin Fields list */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-3 bg-amber-50 border-b border-amber-100">
                <Unlock size={14} className="text-amber-600" />
                <span className="text-sm font-semibold text-amber-800">Admin Fields</span>
              </div>

              {loading ? (
                <p className="px-6 py-4 text-sm text-slate-400">Loading...</p>
              ) : dbPending ? (
                <div className="px-6 py-5 text-sm text-amber-700 bg-amber-50 flex items-start gap-2">
                  <span>⚠️</span>
                  <span>Database migration pending — admin fields are not available yet. Run the SQL migration in the Supabase dashboard to enable this feature.</span>
                </div>
              ) : fields.length === 0 ? (
                <p className="px-6 py-4 text-sm text-slate-400">No fields yet. Add one below.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {fields.map((field, idx) => (
                    <div key={field.id} className={`flex items-center gap-3 px-6 py-3 ${!field.is_active ? 'opacity-50' : ''}`}>
                      {/* Reorder */}
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => handleMove(field, 'up')} disabled={idx === 0} className="text-slate-300 hover:text-slate-600 disabled:opacity-20">
                          <ChevronUp size={14} />
                        </button>
                        <button onClick={() => handleMove(field, 'down')} disabled={idx === fields.length - 1} className="text-slate-300 hover:text-slate-600 disabled:opacity-20">
                          <ChevronDown size={14} />
                        </button>
                      </div>

                      {/* Label / edit inline */}
                      {editId === field.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditId(null) }}
                            autoFocus
                            className="flex-1 text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400"
                          />
                          <select
                            value={editType}
                            onChange={(e) => setEditType(e.target.value)}
                            className="text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none"
                          >
                            {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                          <button onClick={commitEdit} className="text-green-600 hover:text-green-700"><Check size={14} /></button>
                          <button onClick={() => setEditId(null)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                        </div>
                      ) : (
                        <div className="flex-1">
                          <span className="text-sm text-slate-800">{field.label}</span>
                          <span className="ml-2 text-xs text-slate-400">{FIELD_TYPES.find((t) => t.value === field.field_type)?.label}</span>
                        </div>
                      )}

                      {/* Actions */}
                      {editId !== field.id && (
                        <div className="flex items-center gap-2 ml-auto">
                          <button
                            onClick={() => handleToggleActive(field)}
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${field.is_active ? 'bg-green-100 text-green-700 hover:bg-slate-100 hover:text-slate-600' : 'bg-slate-100 text-slate-500 hover:bg-green-100 hover:text-green-700'}`}
                          >
                            {field.is_active ? 'Active' : 'Hidden'}
                          </button>
                          <button onClick={() => startEdit(field)} className="text-slate-400 hover:text-slate-700">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleDelete(field.id, field.label)} className="text-slate-400 hover:text-red-600">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add new field */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
                <p className="text-xs font-medium text-slate-500 mb-2">Add field</p>
                <div className="flex items-center gap-2">
                  <input
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
                    placeholder="Field label..."
                    className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                  />
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none bg-white"
                  >
                    {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <Button onClick={handleAdd} disabled={adding || !newLabel.trim()}>
                    <Plus size={14} /> Add
                  </Button>
                </div>
              </div>
            </div>


            {/* School Closures */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-3 bg-slate-50 border-b border-slate-100">
                <span className="text-sm font-semibold text-slate-700">School Closures & Public Holidays</span>
              </div>

              {/* Berlin public holidays (read-only) */}
              <div className="px-6 py-4 border-b border-slate-100">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
                  Berlin Public Holidays {currentYear} — auto-recognised
                </p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                  {publicHolidays.map(h => (
                    <div key={h.date} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">{h.name}</span>
                      <span className="text-xs text-slate-400 font-mono">
                        {new Date(h.date + 'T12:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom closures */}
              <div className="divide-y divide-slate-100">
                {closuresDbPending && (
                  <p className="px-6 py-3 text-xs text-amber-700 bg-amber-50">
                    ⚠ Run the school_closures migration to enable custom closure storage.
                  </p>
                )}
                {closures.length === 0 && !closuresDbPending ? (
                  <p className="px-6 py-3 text-sm text-slate-400">No custom closures added yet.</p>
                ) : (
                  closures.map(c => (
                    <div key={c.id} className="flex items-center justify-between px-6 py-3">
                      <div>
                        <span className="text-sm text-slate-800">{c.name}</span>
                        <span className="ml-3 text-xs text-slate-400 font-mono">
                          {new Date(c.date + 'T12:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          {c.end_date && c.end_date !== c.date && (
                            <> – {new Date(c.end_date + 'T12:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</>
                          )}
                        </span>
                      </div>
                      <button onClick={() => handleDeleteClosure(c.id, c.name)} className="text-slate-300 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add closure form */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
                <p className="text-xs font-medium text-slate-500 mb-2">Add school closure</p>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-slate-500">From</label>
                    <input
                      type="date"
                      value={newClosureStart}
                      onChange={e => {
                        setNewClosureStart(e.target.value)
                        if (!newClosureEnd || newClosureEnd < e.target.value) setNewClosureEnd(e.target.value)
                      }}
                      className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-slate-500">To</label>
                    <input
                      type="date"
                      value={newClosureEnd}
                      min={newClosureStart}
                      onChange={e => setNewClosureEnd(e.target.value)}
                      className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <input
                    value={newClosureName}
                    onChange={e => setNewClosureName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddClosure()}
                    placeholder="e.g. Sommerferien, School trip..."
                    className="flex-1 min-w-40 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <Button onClick={handleAddClosure} disabled={addingClosure || !newClosureStart || !newClosureName.trim()}>
                    <Plus size={14} /> Add
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
