'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Edit2, Loader2, Trash2, Search, Star } from 'lucide-react'
import type { Specialty } from '@/types/database'
import { uploadAdminImage } from '@/lib/admin/client-actions'
import { SPECIALTY_ICON_OPTIONS, SpecialtyIcon } from '@/lib/specialty-icons'

interface SpecialtiesManagerProps {
  specialties: Specialty[]
  serviceCounts?: Record<string, number>
}

interface SpecialtyForm {
  name_en: string; name_ar: string; slug: string
  description_en: string; description_ar: string; icon: string; image_url: string; display_order: string; is_active: boolean; featured_on_homepage: boolean
}

const emptyForm: SpecialtyForm = { name_en: '', name_ar: '', slug: '', description_en: '', description_ar: '', icon: '', image_url: '', display_order: '0', is_active: true, featured_on_homepage: false }

export default function SpecialtiesManager({ specialties, serviceCounts = {} }: SpecialtiesManagerProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<SpecialtyForm>(emptyForm)
  const [editId, setEditId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'featured' | 'inactive'>('all')

  const filteredSpecialties = useMemo(() => {
    const q = query.trim().toLowerCase()
    return specialties.filter((specialty) => {
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && specialty.is_active) ||
        (statusFilter === 'featured' && specialty.featured_on_homepage) ||
        (statusFilter === 'inactive' && !specialty.is_active)

      if (!matchesStatus) return false
      if (!q) return true

      return [
        specialty.name_en,
        specialty.name_ar,
        specialty.slug,
        specialty.description_en || '',
        specialty.description_ar || '',
        specialty.icon || '',
      ].join(' ').toLowerCase().includes(q)
    })
  }, [query, specialties, statusFilter])

  const activeCount = specialties.filter((specialty) => specialty.is_active).length
  const featuredCount = specialties.filter((specialty) => specialty.featured_on_homepage).length
  const describedCount = specialties.filter((specialty) => specialty.description_en || specialty.description_ar).length
  const withServicesCount = specialties.filter((specialty) => (serviceCounts[specialty.id] || 0) > 0).length
  const summaryCards = [
    { label: 'Total specialties', value: specialties.length },
    { label: 'Active', value: activeCount },
    { label: 'Featured on homepage', value: featuredCount },
    { label: 'With services', value: withServicesCount },
  ]

  function openEdit(s: Specialty) {
    setError('')
    setForm({ name_en: s.name_en, name_ar: s.name_ar, slug: s.slug, description_en: s.description_en || '', description_ar: s.description_ar || '', icon: s.icon || '', image_url: s.image_url || '', display_order: String(s.display_order), is_active: s.is_active, featured_on_homepage: s.featured_on_homepage })
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
      display_order: parseInt(form.display_order) || 0, is_active: form.is_active, featured_on_homepage: form.featured_on_homepage,
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

  async function handleDelete(specialty: Specialty) {
    if (!window.confirm(`Delete ${specialty.name_en}? This cannot be undone.`)) return

    setDeletingId(specialty.id)
    setError('')
    const response = await fetch('/api/admin/specialties', {
      method: 'DELETE',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: specialty.id }),
    })
    const result = await response.json() as { error?: string }

    if (!response.ok) {
      setError(result.error || 'Could not delete specialty.')
      setDeletingId(null)
      return
    }

    setDeletingId(null)
    router.refresh()
  }

  async function handleImageUpload(file: File | null) {
    if (!file) return

    setUploadingImage(true)
    setError('')
    try {
      const url = await uploadAdminImage(file, 'specialties', {
        label: `${form.name_en || 'Specialty'} image`,
        altTextEn: form.name_en || 'Aspects Clinica specialty',
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
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-[1fr_180px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, Arabic name, slug, description, or icon..."
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active only</SelectItem>
              <SelectItem value="featured">Featured only</SelectItem>
              <SelectItem value="inactive">Inactive only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { setForm(emptyForm); setEditId(null); setError(''); setOpen(true) }} className="bg-[#1B4F72] hover:bg-[#154360] text-white">
          <Plus className="w-4 h-4 mr-1.5" />Add Specialty
        </Button>
      </div>
      <p className="mb-4 text-xs text-gray-500">
        {describedCount} specialties have editable descriptions. Services are managed separately, but the count below helps you find specialties that need content.
      </p>
      {error && !open && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="space-y-2">
        {filteredSpecialties.map((s) => (
          <div key={s.id} className={`grid gap-4 rounded-lg border bg-white p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center ${!s.is_active ? 'opacity-60' : ''}`}>
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-md border bg-gray-100 text-[#0B8EA0]">
              {s.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.image_url} alt={s.name_en} className="h-full w-full object-cover" />
              ) : (
                <SpecialtyIcon icon={s.icon} className="h-6 w-6" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-gray-900">{s.name_en}</p>
                {s.featured_on_homepage && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#E6FAF6] px-2 py-0.5 text-xs font-medium text-[#0B8EA0]">
                    <Star className="h-3 w-3" /> Featured
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {s.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-gray-600" dir="rtl">{s.name_ar}</p>
              <p className="mt-1 text-xs text-gray-400">/{s.slug} · icon: {s.icon || 'not set'} · {serviceCounts[s.id] || 0} services</p>
              {s.description_en && <p className="mt-2 line-clamp-2 text-xs leading-5 text-gray-500">{s.description_en}</p>}
              {s.description_ar && <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500" dir="rtl">{s.description_ar}</p>}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => openEdit(s)} className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-[#1B4F72]" aria-label={`Edit ${s.name_en}`}>
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(s)}
                disabled={deletingId === s.id}
                className="rounded-md p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                aria-label={`Delete ${s.name_en}`}
              >
                {deletingId === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>
      {filteredSpecialties.length === 0 && (
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
          No specialties match this search.
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? 'Edit Specialty' : 'Add Specialty'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Name (English) *</Label><Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} /></div>
            <div className="space-y-2"><Label>Name (Arabic)</Label><Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} dir="rtl" /></div>
            <div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated if blank" /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} rows={2} /></div>
            <div className="space-y-2"><Label>Arabic Description</Label><Textarea value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} rows={2} dir="rtl" /></div>
            <div className="space-y-2">
              <Label>Specialty Icon</Label>
              <Select value={form.icon || 'stethoscope'} onValueChange={(value) => setForm({ ...form, icon: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALTY_ICON_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 rounded-md border bg-gray-50 p-2 text-sm text-gray-600">
                <SpecialtyIcon icon={form.icon || 'stethoscope'} />
                <span>{form.icon || 'stethoscope'}</span>
              </div>
            </div>
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
            <div className="flex items-center gap-3"><Switch checked={form.featured_on_homepage} onCheckedChange={(v) => setForm({ ...form, featured_on_homepage: v })} /><Label>Featured on homepage</Label></div>
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
