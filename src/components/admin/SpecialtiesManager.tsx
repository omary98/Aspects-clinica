'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Edit2, Loader2, ImageIcon } from 'lucide-react'
import type { Specialty } from '@/types/database'
import { uploadAdminImage } from '@/lib/admin/client-actions'

interface SpecialtiesManagerProps { specialties: Specialty[] }

interface SpecialtyForm {
  name_en: string; name_ar: string; slug: string
  description_en: string; description_ar: string; icon: string; image_url: string; display_order: string; is_active: boolean
}

const emptyForm: SpecialtyForm = { name_en: '', name_ar: '', slug: '', description_en: '', description_ar: '', icon: '', image_url: '', display_order: '0', is_active: true }

export default function SpecialtiesManager({ specialties }: SpecialtiesManagerProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<SpecialtyForm>(emptyForm)
  const [editId, setEditId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState('')

  function openEdit(s: Specialty) {
    setError('')
    setForm({ name_en: s.name_en, name_ar: s.name_ar, slug: s.slug, description_en: s.description_en || '', description_ar: s.description_ar || '', icon: s.icon || '', image_url: s.image_url || '', display_order: String(s.display_order), is_active: s.is_active })
    setEditId(s.id); setOpen(true)
  }

  async function handleSave() {
    setLoading(true)
    setError('')
    const payload = {
      name_en: form.name_en, name_ar: form.name_ar,
      slug: form.slug || form.name_en.toLowerCase().replace(/\s+/g, '-'),
      description_en: form.description_en || null,
      description_ar: form.description_ar || null,
      icon: form.icon || null,
      image_url: form.image_url || null,
      display_order: parseInt(form.display_order) || 0, is_active: form.is_active,
    }
    const response = await fetch('/api/admin/specialties', {
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
      setError(result.error || 'Could not save specialty.')
      setLoading(false)
      return
    }
    setLoading(false); setOpen(false); router.refresh()
  }

  async function handleImageUpload(file: File | null) {
    if (!file) return

    setUploadingImage(true)
    setError('')
    try {
      const url = await uploadAdminImage(file, 'specialties', {
        label: `${form.name_en || 'Specialty'} image`,
        altTextEn: form.name_en || 'EuroCure specialty',
        altTextAr: form.name_ar || undefined,
      })
      setForm((current) => ({ ...current, image_url: url }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload specialty image.')
    } finally {
      setUploadingImage(false)
    }
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setForm(emptyForm); setEditId(null); setError(''); setOpen(true) }} className="bg-[#1B4F72] hover:bg-[#154360] text-white">
          <Plus className="w-4 h-4 mr-1.5" />Add Specialty
        </Button>
      </div>
      <div className="space-y-2">
        {specialties.map((s) => (
          <div key={s.id} className={`flex items-center gap-4 p-4 bg-white rounded-lg border ${!s.is_active ? 'opacity-60' : ''}`}>
            <div className="w-14 h-14 rounded-md bg-gray-100 border overflow-hidden flex items-center justify-center text-gray-400">
              {s.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.image_url} alt={s.name_en} className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{s.name_en}</p>
              {s.description_en && <p className="text-xs text-gray-500 mt-0.5">{s.description_en}</p>}
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {s.is_active ? 'Active' : 'Inactive'}
            </span>
            <button onClick={() => openEdit(s)} className="p-1 text-gray-400 hover:text-[#1B4F72]">
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? 'Edit Specialty' : 'Add Specialty'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Name (English) *</Label><Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} /></div>
            <div className="space-y-2"><Label>Name (Arabic)</Label><Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} dir="rtl" /></div>
            <div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated if blank" /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} rows={2} /></div>
            <div className="space-y-2"><Label>Arabic Description</Label><Textarea value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} rows={2} dir="rtl" /></div>
            <div className="space-y-2"><Label>Icon name (lucide-react)</Label><Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="activity" /></div>
            <div className="space-y-2"><Label>Image URL</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." /></div>
            {form.image_url && (
              <div className="rounded-md border bg-gray-50 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.image_url} alt="Specialty preview" className="h-28 w-full rounded-md object-cover" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Upload Specialty Image</Label>
              <Input type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={uploadingImage} onChange={(e) => handleImageUpload(e.target.files?.[0] || null)} />
              {uploadingImage && <p className="text-xs text-gray-400">Uploading image...</p>}
            </div>
            <div className="space-y-2"><Label>Display Order</Label><Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: e.target.value })} /></div>
            <div className="flex items-center gap-3"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Active</Label></div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading || !form.name_en} className="bg-[#1B4F72] hover:bg-[#154360] text-white">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
