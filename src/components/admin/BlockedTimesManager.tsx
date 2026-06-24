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
import { Plus, Trash2, Loader2, BanIcon } from 'lucide-react'
import { format } from 'date-fns'

interface BlockedTimesManagerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blocked: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doctors: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rooms: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  branches: any[]
}

interface BlockedForm {
  block_date: string; start_time: string; end_time: string
  doctor_id: string; room_id: string; branch_id: string; reason: string; is_full_day: boolean
}

const emptyForm: BlockedForm = {
  block_date: '', start_time: '', end_time: '', doctor_id: '', room_id: '', branch_id: '', reason: '', is_full_day: false
}

export default function BlockedTimesManager({ blocked, doctors, rooms, branches }: BlockedTimesManagerProps) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<BlockedForm>(emptyForm)
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (!form.block_date) return
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('blocked_times').insert({
      block_date: form.block_date,
      start_time: form.is_full_day ? null : (form.start_time || null),
      end_time: form.is_full_day ? null : (form.end_time || null),
      doctor_id: form.doctor_id || null,
      room_id: form.room_id || null,
      branch_id: form.branch_id || null,
      reason: form.reason || null,
      is_full_day: form.is_full_day,
    })
    setLoading(false); setOpen(false); router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this block?')) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('blocked_times').delete().eq('id', id)
    router.refresh()
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setForm(emptyForm); setOpen(true) }} className="bg-[#1B4F72] hover:bg-[#154360] text-white">
          <Plus className="w-4 h-4 mr-1.5" />Block Time
        </Button>
      </div>

      <div className="space-y-2">
        {!blocked.length && (
          <p className="text-center text-gray-400 py-8">No blocked times. Use &quot;Block Time&quot; to add holidays or exceptions.</p>
        )}
        {blocked.map((b) => (
          <div key={b.id} className="flex items-center gap-4 p-4 bg-white rounded-lg border">
            <BanIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm text-gray-900">
                  {format(new Date(b.block_date), 'EEEE, MMMM d, yyyy')}
                </p>
                {b.is_full_day && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Full Day</span>}
              </div>
              {!b.is_full_day && b.start_time && (
                <p className="text-xs text-gray-500">{b.start_time.slice(0, 5)} – {b.end_time?.slice(0, 5)}</p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">
                {[
                  b.doctors && `Dr. ${b.doctors.name_en}`,
                  b.rooms && `Room: ${b.rooms.name_en}`,
                  b.branches && `Branch: ${b.branches.name_en}`,
                  b.reason,
                ].filter(Boolean).join(' · ')}
              </p>
            </div>
            <button onClick={() => handleDelete(b.id)} className="p-1 text-gray-400 hover:text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Block Time / Holiday</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Date *</Label><Input type="date" value={form.block_date} onChange={(e) => setForm({ ...form, block_date: e.target.value })} /></div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_full_day} onCheckedChange={(v) => setForm({ ...form, is_full_day: v })} />
              <Label>Full Day Block</Label>
            </div>
            {!form.is_full_day && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Start Time</Label><Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></div>
                <div className="space-y-2"><Label>End Time</Label><Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} /></div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Applies To Doctor (leave blank for all)</Label>
              <Select value={form.doctor_id || 'none'} onValueChange={(v) => setForm({ ...form, doctor_id: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="All doctors" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All doctors</SelectItem>
                  {doctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.name_en}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Applies To Room (leave blank for all)</Label>
              <Select value={form.room_id || 'none'} onValueChange={(v) => setForm({ ...form, room_id: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="All rooms" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All rooms</SelectItem>
                  {rooms.map((r) => <SelectItem key={r.id} value={r.id}>{r.name_en}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Applies To Branch (leave blank for all)</Label>
              <Select value={form.branch_id || 'none'} onValueChange={(v) => setForm({ ...form, branch_id: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="All branches" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All branches</SelectItem>
                  {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name_en}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Reason</Label><Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Holiday, doctor unavailable, etc." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading || !form.block_date} className="bg-red-600 hover:bg-red-700 text-white">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Block Time'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
