'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminManage } from '@/lib/admin/client-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Edit2, Loader2 } from 'lucide-react'

interface ServicesManagerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  services: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  specialties: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doctors: any[]
}

interface ServiceForm {
  specialty_id: string; doctor_id: string; name_en: string; name_ar: string
  description_en: string; duration_minutes: string; fee: string
  is_visible_to_patients: boolean; is_active: boolean; display_order: string
}

const emptyForm: ServiceForm = {
  specialty_id: '', doctor_id: '', name_en: '', name_ar: '',
  description_en: '', duration_minutes: '20', fee: '',
  is_visible_to_patients: true, is_active: true, display_order: '0',
}

export default function ServicesManager({ services, specialties, doctors }: ServicesManagerProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<ServiceForm>(emptyForm)
  const [editId, setEditId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const filteredDoctors = doctors.filter((d) => !form.specialty_id || d.specialty_id === form.specialty_id)

  function openEdit(svc: typeof services[0]) {
    setError('')
    setForm({
      specialty_id: svc.specialty_id, doctor_id: svc.doctor_id || '',
      name_en: svc.name_en, name_ar: svc.name_ar || '',
      description_en: svc.description_en || '',
      duration_minutes: String(svc.duration_minutes),
      fee: svc.fee?.toString() || '',
      is_visible_to_patients: svc.is_visible_to_patients,
      is_active: svc.is_active,
      display_order: String(svc.display_order),
    })
    setEditId(svc.id)
    setOpen(true)
  }

  async function handleSave() {
    setLoading(true)
    setError('')
    const payload = {
      specialty_id: form.specialty_id,
      doctor_id: form.doctor_id || null,
      name_en: form.name_en,
      name_ar: form.name_ar || null,
      description_en: form.description_en || null,
      duration_minutes: parseInt(form.duration_minutes) || 20,
      fee: form.fee ? parseFloat(form.fee) : null,
      is_visible_to_patients: form.is_visible_to_patients,
      is_active: form.is_active,
      display_order: parseInt(form.display_order) || 0,
    }
    try {
      await adminManage({
        resource: 'services',
        action: editId ? 'update' : 'create',
        id: editId || undefined,
        payload,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save service.')
      setLoading(false)
      return
    }
    setLoading(false); setOpen(false); router.refresh()
  }

  const grouped = services.reduce<Record<string, typeof services>>((acc, s) => {
    const key = s.specialty_id
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setForm(emptyForm); setEditId(null); setError(''); setOpen(true) }} className="bg-[#1B4F72] hover:bg-[#154360] text-white">
          <Plus className="w-4 h-4 mr-1.5" />Add Service
        </Button>
      </div>

      <div className="space-y-6">
        {Object.entries(grouped).map(([specId, specServices]) => {
          const spec = specialties.find((s) => s.id === specId)
          return (
            <div key={specId}>
              <h3 className="font-semibold text-gray-800 mb-2 text-sm uppercase tracking-wider text-gray-500">{spec?.name_en}</h3>
              <div className="space-y-2">
                {(specServices as typeof services).map((svc) => (
                  <div key={svc.id} className={`flex items-center gap-4 p-3 bg-white rounded-lg border ${!svc.is_active ? 'opacity-60' : ''}`}>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">{svc.name_en}</p>
                      <p className="text-xs text-gray-500">
                        {svc.duration_minutes} min
                        {svc.fee && ` · EGP ${svc.fee}`}
                        {svc.doctors && ` · ${svc.doctors.name_en} only`}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${svc.is_visible_to_patients ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                      {svc.is_visible_to_patients ? 'Visible' : 'Hidden'}
                    </span>
                    <button onClick={() => openEdit(svc)} className="p-1 text-gray-400 hover:text-[#1B4F72]">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Edit Service' : 'Add Service'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Specialty *</Label>
              <Select value={form.specialty_id} onValueChange={(v) => setForm({ ...form, specialty_id: v, doctor_id: '' })}>
                <SelectTrigger><SelectValue placeholder="Select specialty..." /></SelectTrigger>
                <SelectContent>
                  {specialties.map((s) => <SelectItem key={s.id} value={s.id}>{s.name_en}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Specific Doctor (leave blank for all)</Label>
              <Select value={form.doctor_id || 'none'} onValueChange={(v) => setForm({ ...form, doctor_id: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="All doctors in specialty..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All doctors in specialty</SelectItem>
                  {filteredDoctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.name_en}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Name (English) *</Label><Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} /></div>
            <div className="space-y-2"><Label>Name (Arabic)</Label><Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} dir="rtl" /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Duration (min) *</Label><Input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} /></div>
              <div className="space-y-2"><Label>Fee (EGP)</Label><Input type="number" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} /></div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_visible_to_patients} onCheckedChange={(v) => setForm({ ...form, is_visible_to_patients: v })} />
              <Label>Visible to patients</Label>
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
            <Button onClick={handleSave} disabled={loading || !form.name_en || !form.specialty_id} className="bg-[#1B4F72] hover:bg-[#154360] text-white">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
