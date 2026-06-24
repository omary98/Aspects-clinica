'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Edit2, Loader2, Trash2 } from 'lucide-react'
import { DAY_NAMES } from '@/lib/utils'

interface SchedulesManagerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schedules: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doctors: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  branches: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rooms: any[]
}

interface ScheduleForm {
  doctor_id: string
  branch_id: string
  day_of_week: string
  start_time: string
  end_time: string
  is_active: boolean
  room_ids: string[]
}

const emptyForm: ScheduleForm = {
  doctor_id: '', branch_id: '', day_of_week: '0',
  start_time: '09:00', end_time: '17:00',
  is_active: true, room_ids: [],
}

export default function SchedulesManager({ schedules, doctors, branches, rooms }: SchedulesManagerProps) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<ScheduleForm>(emptyForm)
  const [editId, setEditId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const branchRooms = rooms.filter((r) => r.branch_id === form.branch_id)

  // Group schedules by doctor
  const grouped = schedules.reduce<Record<string, typeof schedules>>((acc, s) => {
    const key = s.doctor_id
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  function openNew() { setForm(emptyForm); setEditId(null); setOpen(true) }

  function openEdit(s: typeof schedules[0]) {
    setForm({
      doctor_id: s.doctor_id,
      branch_id: s.branch_id,
      day_of_week: String(s.day_of_week),
      start_time: s.start_time,
      end_time: s.end_time,
      is_active: s.is_active,
      room_ids: (s.schedule_room_assignments || []).map((a: { room_id: string }) => a.room_id),
    })
    setEditId(s.id)
    setOpen(true)
  }

  async function handleSave() {
    setLoading(true)
    const payload = {
      doctor_id: form.doctor_id,
      branch_id: form.branch_id,
      day_of_week: parseInt(form.day_of_week),
      start_time: form.start_time,
      end_time: form.end_time,
      is_active: form.is_active,
    }

    let scheduleId = editId
    if (editId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('doctor_schedule_templates').update(payload).eq('id', editId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('schedule_room_assignments').delete().eq('schedule_template_id', editId)
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any).from('doctor_schedule_templates').insert(payload).select('id').single()
      scheduleId = (data as { id: string } | null)?.id || null
    }

    if (scheduleId && form.room_ids.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('schedule_room_assignments').insert(
        form.room_ids.map((rid) => ({ schedule_template_id: scheduleId!, room_id: rid }))
      )
    }

    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this schedule?')) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('doctor_schedule_templates').delete().eq('id', id)
    router.refresh()
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={openNew} className="bg-[#1B4F72] hover:bg-[#154360] text-white">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Schedule
        </Button>
      </div>

      <div className="space-y-6">
        {Object.entries(grouped).map(([doctorId, doctorSchedules]) => {
          const doc = doctors.find((d) => d.id === doctorId)
          return (
            <Card key={doctorId}>
              <CardContent className="pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">{doc?.name_en}</h3>
                <div className="space-y-2">
                  {(doctorSchedules as typeof schedules).map((s) => (
                    <div
                      key={s.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${!s.is_active ? 'opacity-50 bg-gray-50' : 'bg-white'}`}
                    >
                      <div className="flex-1 text-sm">
                        <span className="font-medium">{DAY_NAMES[s.day_of_week]}</span>
                        <span className="text-gray-500 mx-2">·</span>
                        <span>{s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}</span>
                        <span className="text-gray-500 mx-2">·</span>
                        <span className="text-gray-600">{s.branches?.name_en}</span>
                        {s.schedule_room_assignments?.length > 0 && (
                          <span className="text-gray-400 ml-2 text-xs">
                            [{s.schedule_room_assignments.map((a: { rooms: { name_en: string } }) => a.rooms?.name_en).join(', ')}]
                          </span>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <button onClick={() => openEdit(s)} className="p-1 text-gray-400 hover:text-[#1B4F72]">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="p-1 text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
        {!schedules.length && (
          <p className="text-center text-gray-400 py-8">No schedules yet. Click &quot;Add Schedule&quot; to start.</p>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Schedule' : 'Add Schedule'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Doctor *</Label>
              <Select value={form.doctor_id} onValueChange={(v) => setForm({ ...form, doctor_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select doctor..." /></SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.name_en}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Branch *</Label>
              <Select value={form.branch_id} onValueChange={(v) => setForm({ ...form, branch_id: v, room_ids: [] })}>
                <SelectTrigger><SelectValue placeholder="Select branch..." /></SelectTrigger>
                <SelectContent>
                  {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name_en}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Day of Week *</Label>
              <Select value={form.day_of_week} onValueChange={(v) => setForm({ ...form, day_of_week: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAY_NAMES.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Time *</Label>
                <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Time *</Label>
                <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
              </div>
            </div>

            {branchRooms.length > 0 && (
              <div className="space-y-2">
                <Label>Assign Room(s)</Label>
                <div className="space-y-2">
                  {branchRooms.map((room) => (
                    <div key={room.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`room-${room.id}`}
                        checked={form.room_ids.includes(room.id)}
                        onCheckedChange={(checked) => {
                          setForm({
                            ...form,
                            room_ids: checked
                              ? [...form.room_ids, room.id]
                              : form.room_ids.filter((r) => r !== room.id),
                          })
                        }}
                      />
                      <Label htmlFor={`room-${room.id}`} className="cursor-pointer">{room.name_en}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={loading || !form.doctor_id || !form.branch_id}
              className="bg-[#1B4F72] hover:bg-[#154360] text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
