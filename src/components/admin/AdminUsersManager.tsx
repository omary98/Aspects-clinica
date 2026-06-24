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
import { Edit2, Loader2, User, Shield } from 'lucide-react'
import type { AdminProfile } from '@/types/database'

interface AdminUsersManagerProps {
  profiles: (AdminProfile & {
    notification_recipients?: { email_enabled: boolean; whatsapp_enabled: boolean } | null
  })[]
}

interface ProfileForm {
  full_name: string; role: 'medical_director' | 'reception_head'; email: string
  whatsapp_number: string; notifications_enabled: boolean; is_active: boolean
  user_id: string
}

const emptyForm: ProfileForm = {
  full_name: '', role: 'reception_head', email: '', whatsapp_number: '',
  notifications_enabled: true, is_active: true, user_id: '',
}

export default function AdminUsersManager({ profiles }: AdminUsersManagerProps) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<ProfileForm>(emptyForm)
  const [editId, setEditId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function openEdit(p: AdminProfile) {
    setForm({
      full_name: p.full_name, role: p.role, email: p.email,
      whatsapp_number: p.whatsapp_number || '', notifications_enabled: p.notifications_enabled,
      is_active: p.is_active, user_id: p.user_id,
    })
    setEditId(p.id); setOpen(true)
  }

  async function handleSave() {
    setLoading(true)
    const payload = {
      full_name: form.full_name, role: form.role, email: form.email,
      whatsapp_number: form.whatsapp_number || null, notifications_enabled: form.notifications_enabled,
      is_active: form.is_active,
    }
    if (editId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('admin_profiles').update(payload).eq('id', editId)
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('admin_profiles').insert({ ...payload, user_id: form.user_id })
    }
    setLoading(false); setOpen(false); router.refresh()
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setForm(emptyForm); setEditId(null); setOpen(true) }} className="bg-[#1B4F72] hover:bg-[#154360] text-white">
          Add Admin Profile
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {profiles.map((p) => (
          <Card key={p.id} className={`border ${!p.is_active ? 'opacity-60' : ''}`}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1B4F72]/10 flex items-center justify-center flex-shrink-0">
                  {p.role === 'medical_director' ? <Shield className="w-5 h-5 text-[#1B4F72]" /> : <User className="w-5 h-5 text-[#1B4F72]" />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{p.full_name}</p>
                  <p className="text-sm text-gray-500">{p.email}</p>
                  <p className="text-xs text-[#1B4F72] capitalize mt-0.5">
                    {p.role.replace('_', ' ')}
                  </p>
                  {p.whatsapp_number && (
                    <p className="text-xs text-gray-400 mt-0.5">WhatsApp: {p.whatsapp_number}</p>
                  )}
                </div>
                <button onClick={() => openEdit(p)} className="p-1 text-gray-400 hover:text-[#1B4F72]">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-3 mt-3 pt-3 border-t text-xs">
                <span className={`px-2 py-0.5 rounded-full ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {p.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className={`px-2 py-0.5 rounded-full ${p.notifications_enabled ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                  {p.notifications_enabled ? 'Notifications On' : 'Notifications Off'}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? 'Edit Admin Profile' : 'Add Admin Profile'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {!editId && (
              <div className="space-y-2">
                <Label>Supabase User ID *</Label>
                <Input value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} placeholder="UUID from Supabase Auth dashboard" />
                <p className="text-xs text-gray-400">Create the user in Supabase Auth first, then paste their UUID here.</p>
              </div>
            )}
            <div className="space-y-2"><Label>Full Name *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select value={form.role} onValueChange={(v: 'medical_director' | 'reception_head') => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical_director">Medical Director (Full Access)</SelectItem>
                  <SelectItem value="reception_head">Reception Head</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>WhatsApp Number</Label><Input value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} placeholder="+20 1XX XXX XXXX" /></div>
            <div className="flex items-center gap-3"><Switch checked={form.notifications_enabled} onCheckedChange={(v) => setForm({ ...form, notifications_enabled: v })} /><Label>Receive notifications</Label></div>
            <div className="flex items-center gap-3"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Active</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading || !form.full_name || !form.email} className="bg-[#1B4F72] hover:bg-[#154360] text-white">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
