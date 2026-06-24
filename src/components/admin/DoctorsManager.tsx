'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Edit2, Loader2, User } from 'lucide-react'
import type { Doctor, Specialty } from '@/types/database'

interface DoctorsManagerProps {
  doctors: (Doctor & { specialties: { id: string; name_en: string } | null })[]
  specialties: Pick<Specialty, 'id' | 'name_en'>[]
}

interface DoctorForm {
  name_en: string
  name_ar: string
  specialty_id: string
  title_en: string
  title_ar: string
  bio_en: string
  bio_ar: string
  photo_url: string
  consultation_fee: string
  is_active: boolean
  display_order: string
}

const emptyForm: DoctorForm = {
  name_en: '', name_ar: '', specialty_id: '', title_en: '', title_ar: '',
  bio_en: '', bio_ar: '', photo_url: '', consultation_fee: '',
  is_active: true, display_order: '0',
}

export default function DoctorsManager({ doctors, specialties }: DoctorsManagerProps) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<DoctorForm>(emptyForm)
  const [editId, setEditId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function openNew() {
    setForm(emptyForm)
    setEditId(null)
    setOpen(true)
  }

  function openEdit(doc: Doctor) {
    setForm({
      name_en: doc.name_en,
      name_ar: doc.name_ar,
      specialty_id: doc.specialty_id,
      title_en: doc.title_en,
      title_ar: doc.title_ar,
      bio_en: doc.bio_en || '',
      bio_ar: doc.bio_ar || '',
      photo_url: doc.photo_url || '',
      consultation_fee: doc.consultation_fee?.toString() || '',
      is_active: doc.is_active,
      display_order: String(doc.display_order),
    })
    setEditId(doc.id)
    setOpen(true)
  }

  async function handleSave() {
    if (!form.name_en || !form.specialty_id || !form.title_en) return
    setLoading(true)

    const payload = {
      name_en: form.name_en,
      name_ar: form.name_ar,
      specialty_id: form.specialty_id,
      title_en: form.title_en,
      title_ar: form.title_ar,
      bio_en: form.bio_en || null,
      bio_ar: form.bio_ar || null,
      photo_url: form.photo_url || null,
      consultation_fee: form.consultation_fee ? parseFloat(form.consultation_fee) : null,
      is_active: form.is_active,
      display_order: parseInt(form.display_order) || 0,
    }

    if (editId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('doctors').update(payload).eq('id', editId)
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('doctors').insert(payload)
    }

    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  async function toggleActive(doc: Doctor) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('doctors').update({ is_active: !doc.is_active }).eq('id', doc.id)
    router.refresh()
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={openNew} className="bg-[#1B4F72] hover:bg-[#154360] text-white">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Doctor
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {doctors.map((doc) => (
          <Card key={doc.id} className={`border ${!doc.is_active ? 'opacity-60' : ''}`}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1B4F72]/10 flex items-center justify-center flex-shrink-0">
                  {doc.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={doc.photo_url} alt={doc.name_en} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-[#1B4F72]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{doc.name_en}</p>
                  <p className="text-sm text-[#1B4F72]">{doc.title_en}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{doc.specialties?.name_en}</p>
                  {doc.consultation_fee !== null && doc.consultation_fee !== undefined && (
                    <p className="text-xs text-gray-600 mt-1">EGP {doc.consultation_fee}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={doc.is_active}
                    onCheckedChange={() => toggleActive(doc)}
                    aria-label="Toggle active"
                  />
                  <span className="text-xs text-gray-500">{doc.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEdit(doc)}
                  className="h-7 px-2 text-xs"
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Doctor' : 'Add Doctor'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name (English) *</Label>
              <Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} placeholder="Dr. John Smith" />
            </div>
            <div className="space-y-2">
              <Label>Name (Arabic)</Label>
              <Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} dir="rtl" placeholder="د. جون سميث" />
            </div>
            <div className="space-y-2">
              <Label>Specialty *</Label>
              <Select value={form.specialty_id} onValueChange={(v) => setForm({ ...form, specialty_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select specialty..." />
                </SelectTrigger>
                <SelectContent>
                  {specialties.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name_en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title (English) *</Label>
              <Input value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} placeholder="Consultant Specialist" />
            </div>
            <div className="space-y-2">
              <Label>Title (Arabic)</Label>
              <Input value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} dir="rtl" />
            </div>
            <div className="space-y-2">
              <Label>Bio (English)</Label>
              <Textarea value={form.bio_en} onChange={(e) => setForm({ ...form, bio_en: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Photo URL</Label>
              <Input value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Consultation Fee (EGP) — leave blank to hide from patients</Label>
              <Input type="number" value={form.consultation_fee} onChange={(e) => setForm({ ...form, consultation_fee: e.target.value })} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: e.target.value })} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={loading || !form.name_en || !form.specialty_id || !form.title_en}
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
