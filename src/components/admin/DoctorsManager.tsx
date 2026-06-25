'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Edit2, Loader2, User, Trash2 } from 'lucide-react'
import type { Doctor, Specialty } from '@/types/database'
import { uploadAdminImage } from '@/lib/admin/client-actions'

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
  description_en: string
  description_ar: string
  photo_url: string
  consultation_fee: string
  is_active: boolean
  display_order: string
}

const emptyForm: DoctorForm = {
  name_en: '', name_ar: '', specialty_id: '', title_en: '', title_ar: '',
  bio_en: '', bio_ar: '', description_en: '', description_ar: '', photo_url: '', consultation_fee: '',
  is_active: true, display_order: '0',
}

export default function DoctorsManager({ doctors, specialties }: DoctorsManagerProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<DoctorForm>(emptyForm)
  const [editId, setEditId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  function openNew() {
    setForm(emptyForm)
    setEditId(null)
    setError('')
    setOpen(true)
  }

  function openEdit(doc: Doctor) {
    setError('')
    setForm({
      name_en: doc.name_en,
      name_ar: doc.name_ar,
      specialty_id: doc.specialty_id,
      title_en: doc.title_en,
      title_ar: doc.title_ar,
      bio_en: doc.bio_en || '',
      bio_ar: doc.bio_ar || '',
      description_en: doc.description_en || '',
      description_ar: doc.description_ar || '',
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
    setError('')

    const payload = {
      name_en: form.name_en,
      name_ar: form.name_ar,
      specialty_id: form.specialty_id,
      title_en: form.title_en,
      title_ar: form.title_ar,
      bio_en: form.bio_en || null,
      bio_ar: form.bio_ar || null,
      description_en: form.description_en || null,
      description_ar: form.description_ar || null,
      photo_url: form.photo_url || null,
      consultation_fee: form.consultation_fee ? parseFloat(form.consultation_fee) : null,
      is_active: form.is_active,
      display_order: parseInt(form.display_order) || 0,
    }

    const response = await fetch('/api/admin/doctors', {
      method: editId ? 'PATCH' : 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(editId ? { id: editId, ...payload } : payload),
    })
    const result = await response.json() as { error?: string }

    if (!response.ok) {
      setError(result.error || 'Could not save doctor.')
      setLoading(false)
      return
    }

    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  async function handleDelete(doc: Doctor) {
    if (!window.confirm(`Delete ${doc.name_en}? This cannot be undone.`)) return

    setDeletingId(doc.id)
    setError('')
    const response = await fetch('/api/admin/doctors', {
      method: 'DELETE',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: doc.id }),
    })
    const result = await response.json() as { error?: string }

    if (!response.ok) {
      setError(result.error || 'Could not delete doctor.')
      setDeletingId(null)
      return
    }

    setDeletingId(null)
    router.refresh()
  }

  async function toggleActive(doc: Doctor) {
    await fetch('/api/admin/doctors', {
      method: 'PATCH',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: doc.id, is_active: !doc.is_active }),
    })
    router.refresh()
  }

  async function handlePhotoUpload(file: File | null) {
    if (!file) return

    setUploadingPhoto(true)
    setError('')
    try {
      const url = await uploadAdminImage(file, 'doctors', {
        label: `${form.name_en || 'Doctor'} photo`,
        altTextEn: form.name_en || 'EuroCure doctor',
        altTextAr: form.name_ar || undefined,
      })
      setForm((current) => ({ ...current, photo_url: url }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload doctor photo.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={openNew} className="bg-[#1B4F72] hover:bg-[#154360] text-white">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Doctor
        </Button>
      </div>
      {error && !open && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

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
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(doc)}
                    className="h-7 px-2 text-xs"
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(doc)}
                    disabled={deletingId === doc.id}
                    className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                    aria-label={`Delete ${doc.name_en}`}
                  >
                    {deletingId === doc.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  </Button>
                </div>
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
              <Label>Bio (Arabic)</Label>
              <Textarea value={form.bio_ar} onChange={(e) => setForm({ ...form, bio_ar: e.target.value })} rows={2} dir="rtl" />
            </div>
            <div className="space-y-2">
              <Label>Detailed Description (English)</Label>
              <Textarea value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Detailed Description (Arabic)</Label>
              <Textarea value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} rows={3} dir="rtl" />
            </div>
            <div className="space-y-2">
              <Label>Photo URL</Label>
              <Input value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} placeholder="https://..." />
            </div>
            {form.photo_url && (
              <div className="rounded-md border bg-gray-50 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.photo_url} alt="Doctor preview" className="h-24 w-24 rounded-full object-cover border" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Upload Doctor Photo</Label>
              <Input
                type="file"
                accept="image/*"
                disabled={uploadingPhoto}
                onChange={(e) => handlePhotoUpload(e.target.files?.[0] || null)}
              />
              {uploadingPhoto && <p className="text-xs text-gray-400">Uploading photo...</p>}
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
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                {error}
              </div>
            )}
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
