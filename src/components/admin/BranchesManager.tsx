'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminManage } from '@/lib/admin/client-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Edit2, Loader2, MapPin } from 'lucide-react'
import type { Branch } from '@/types/database'

interface BranchesManagerProps {
  branches: Branch[]
}

interface BranchForm {
  name_en: string; name_ar: string; slug: string
  address_en: string; address_ar: string; google_maps_url: string; phone: string
  is_public_branch: boolean; is_active: boolean; display_order: string
}

const emptyForm: BranchForm = {
  name_en: '', name_ar: '', slug: '', address_en: '', address_ar: '',
  google_maps_url: '', phone: '', is_public_branch: true, is_active: true, display_order: '0',
}

export default function BranchesManager({ branches }: BranchesManagerProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<BranchForm>(emptyForm)
  const [editId, setEditId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function openEdit(b: Branch) {
    setError('')
    setForm({
      name_en: b.name_en, name_ar: b.name_ar, slug: b.slug,
      address_en: b.address_en || '', address_ar: b.address_ar || '',
      google_maps_url: b.google_maps_url || '', phone: b.phone || '',
      is_public_branch: b.is_public_branch, is_active: b.is_active,
      display_order: String(b.display_order),
    })
    setEditId(b.id)
    setOpen(true)
  }

  async function handleSave() {
    setLoading(true)
    setError('')
    const payload = {
      name_en: form.name_en, name_ar: form.name_ar,
      slug: form.slug || form.name_en.toLowerCase().replace(/\s+/g, '-'),
      address_en: form.address_en || null, address_ar: form.address_ar || null,
      google_maps_url: form.google_maps_url || null, phone: form.phone || null,
      is_public_branch: form.is_public_branch, is_active: form.is_active,
      display_order: parseInt(form.display_order) || 0,
    }
    try {
      await adminManage({
        resource: 'branches',
        action: editId ? 'update' : 'create',
        id: editId || undefined,
        payload,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save branch.')
      setLoading(false)
      return
    }
    setLoading(false); setOpen(false); router.refresh()
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setForm(emptyForm); setEditId(null); setError(''); setOpen(true) }} className="bg-[#1B4F72] hover:bg-[#154360] text-white">
          <Plus className="w-4 h-4 mr-1.5" />Add Branch
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {branches.map((b) => (
          <Card key={b.id} className={`border ${!b.is_active ? 'opacity-60' : ''}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{b.name_en}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {b.is_public_branch ? 'Main Branch' : 'Doctor-specific location'}
                  </p>
                  {b.address_en && (
                    <div className="flex items-start gap-1.5 mt-2 text-xs text-gray-500">
                      <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{b.address_en}</span>
                    </div>
                  )}
                  {b.phone && <p className="text-xs text-gray-500 mt-1">📞 {b.phone}</p>}
                </div>
                <button onClick={() => openEdit(b)} className="p-1 text-gray-400 hover:text-[#1B4F72]">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-3 pt-3 border-t flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {b.is_active ? 'Active' : 'Inactive'}
                </span>
                {b.google_maps_url && (
                  <a href={b.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#1B4F72] hover:underline">
                    Maps ↗
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Edit Branch' : 'Add Branch'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Name (English) *</Label><Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} /></div>
            <div className="space-y-2"><Label>Name (Arabic)</Label><Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} dir="rtl" /></div>
            <div className="space-y-2"><Label>Slug (URL identifier)</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="nasr-city-branch" /></div>
            <div className="space-y-2"><Label>Address (English)</Label><Textarea value={form.address_en} onChange={(e) => setForm({ ...form, address_en: e.target.value })} rows={2} /></div>
            <div className="space-y-2"><Label>Address (Arabic)</Label><Textarea value={form.address_ar} onChange={(e) => setForm({ ...form, address_ar: e.target.value })} dir="rtl" rows={2} /></div>
            <div className="space-y-2"><Label>Google Maps URL</Label><Input value={form.google_maps_url} onChange={(e) => setForm({ ...form, google_maps_url: e.target.value })} placeholder="https://maps.app.goo.gl/..." /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_public_branch} onCheckedChange={(v) => setForm({ ...form, is_public_branch: v })} />
              <Label>Main / public branch (uncheck for doctor-specific locations)</Label>
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
            <Button onClick={handleSave} disabled={loading || !form.name_en} className="bg-[#1B4F72] hover:bg-[#154360] text-white">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
