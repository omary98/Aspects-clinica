'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminManage } from '@/lib/admin/client-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Edit2, Loader2, Trash2 } from 'lucide-react'
import type { Room, Branch } from '@/types/database'

interface RoomsManagerProps {
  rooms: (Room & { branches: Pick<Branch, 'id' | 'name_en'> | null })[]
  branches: Pick<Branch, 'id' | 'name_en'>[]
}

interface RoomForm {
  branch_id: string; name_en: string; name_ar: string; room_type: string; is_active: boolean
}

const emptyForm: RoomForm = { branch_id: '', name_en: '', name_ar: '', room_type: 'clinic', is_active: true }

export default function RoomsManager({ rooms, branches }: RoomsManagerProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<RoomForm>(emptyForm)
  const [editId, setEditId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  function openEdit(r: Room) {
    setError('')
    setForm({ branch_id: r.branch_id, name_en: r.name_en, name_ar: r.name_ar, room_type: r.room_type, is_active: r.is_active })
    setEditId(r.id)
    setOpen(true)
  }

  async function handleSave() {
    setLoading(true)
    setError('')
    const payload = { ...form }
    try {
      await adminManage({
        resource: 'rooms',
        action: editId ? 'update' : 'create',
        id: editId || undefined,
        payload,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save room.')
      setLoading(false)
      return
    }
    setLoading(false); setOpen(false); router.refresh()
  }

  async function handleDelete(room: Room) {
    if (!window.confirm(`Delete ${room.name_en}? This cannot be undone.`)) return

    setDeletingId(room.id)
    setError('')
    try {
      await adminManage({
        resource: 'rooms',
        action: 'delete',
        id: room.id,
      })
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete room.')
    } finally {
      setDeletingId(null)
    }
  }

  const grouped = rooms.reduce<Record<string, typeof rooms>>((acc, r) => {
    const key = r.branch_id
    if (!acc[key]) acc[key] = []
    acc[key].push(r)
    return acc
  }, {})

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setForm(emptyForm); setEditId(null); setError(''); setOpen(true) }} className="bg-[#1B4F72] hover:bg-[#154360] text-white">
          <Plus className="w-4 h-4 mr-1.5" />Add Room
        </Button>
      </div>
      {error && !open && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="space-y-6">
        {Object.entries(grouped).map(([branchId, branchRooms]) => {
          const branch = branches.find((b) => b.id === branchId)
          return (
            <div key={branchId}>
              <h3 className="font-semibold text-gray-700 mb-2">{branch?.name_en}</h3>
              <div className="space-y-2">
                {(branchRooms as typeof rooms).map((r) => (
                  <div key={r.id} className={`flex items-center gap-4 p-3 bg-white rounded-lg border ${!r.is_active ? 'opacity-60' : ''}`}>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">{r.name_en}</p>
                      <p className="text-xs text-gray-500 capitalize">{r.room_type.replace('_', ' ')}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {r.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button onClick={() => openEdit(r)} className="p-1 text-gray-400 hover:text-[#1B4F72]">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(r)}
                      disabled={deletingId === r.id}
                      className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
                      aria-label={`Delete ${r.name_en}`}
                    >
                      {deletingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? 'Edit Room' : 'Add Room'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Branch *</Label>
              <Select value={form.branch_id} onValueChange={(v) => setForm({ ...form, branch_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select branch..." /></SelectTrigger>
                <SelectContent>
                  {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name_en}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Room Name (English) *</Label><Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} placeholder="Clinic 1" /></div>
            <div className="space-y-2"><Label>Room Name (Arabic)</Label><Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} dir="rtl" /></div>
            <div className="space-y-2">
              <Label>Room Type</Label>
              <Select value={form.room_type} onValueChange={(v) => setForm({ ...form, room_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="clinic">Clinic</SelectItem>
                  <SelectItem value="procedure">Procedure</SelectItem>
                  <SelectItem value="laser">Laser</SelectItem>
                  <SelectItem value="surgery">Surgery</SelectItem>
                  <SelectItem value="recovery">Recovery</SelectItem>
                  <SelectItem value="reception">Reception</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Active</Label>
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading || !form.name_en || !form.branch_id} className="bg-[#1B4F72] hover:bg-[#154360] text-white">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
