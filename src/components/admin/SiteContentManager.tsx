'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { adminManage, uploadAdminImage } from '@/lib/admin/client-actions'
import type { SiteContent } from '@/types/database'

type EditableContent = Pick<SiteContent, 'section_key' | 'field_key' | 'value_en' | 'value_ar' | 'content_type' | 'is_active' | 'display_order'>

const fields: EditableContent[] = [
  { section_key: 'hero', field_key: 'tagline', value_en: '', value_ar: '', content_type: 'text', is_active: true, display_order: 10 },
  { section_key: 'hero', field_key: 'title', value_en: '', value_ar: '', content_type: 'text', is_active: true, display_order: 20 },
  { section_key: 'hero', field_key: 'subtitle', value_en: '', value_ar: '', content_type: 'textarea', is_active: true, display_order: 30 },
  { section_key: 'hero', field_key: 'primary_cta', value_en: '', value_ar: '', content_type: 'text', is_active: true, display_order: 40 },
  { section_key: 'hero', field_key: 'secondary_cta', value_en: '', value_ar: '', content_type: 'text', is_active: true, display_order: 50 },
  { section_key: 'about', field_key: 'title', value_en: '', value_ar: '', content_type: 'text', is_active: true, display_order: 10 },
  { section_key: 'about', field_key: 'body', value_en: '', value_ar: '', content_type: 'textarea', is_active: true, display_order: 20 },
  { section_key: 'why_choose', field_key: 'title', value_en: '', value_ar: '', content_type: 'text', is_active: true, display_order: 10 },
  { section_key: 'why_choose', field_key: 'body', value_en: '', value_ar: '', content_type: 'textarea', is_active: true, display_order: 20 },
  { section_key: 'contact', field_key: 'title', value_en: '', value_ar: '', content_type: 'text', is_active: true, display_order: 10 },
  { section_key: 'contact', field_key: 'body', value_en: '', value_ar: '', content_type: 'textarea', is_active: true, display_order: 20 },
  { section_key: 'cta', field_key: 'title', value_en: '', value_ar: '', content_type: 'text', is_active: true, display_order: 10 },
  { section_key: 'cta', field_key: 'subtitle', value_en: '', value_ar: '', content_type: 'textarea', is_active: true, display_order: 20 },
  { section_key: 'cta', field_key: 'button', value_en: '', value_ar: '', content_type: 'text', is_active: true, display_order: 30 },
  { section_key: 'footer', field_key: 'tagline', value_en: '', value_ar: '', content_type: 'text', is_active: true, display_order: 10 },
]

function humanize(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default function SiteContentManager({
  content,
  settings,
}: {
  content: SiteContent[]
  settings: Record<string, string>
}) {
  const router = useRouter()
  const initialRows = useMemo(() => fields.map((field) => {
    const existing = content.find((row) => row.section_key === field.section_key && row.field_key === field.field_key)
    return existing ? { ...field, ...existing } : field
  }), [content])

  const [rows, setRows] = useState<EditableContent[]>(initialRows)
  const [imageSettings, setImageSettings] = useState({
    landing_hero_background_url: settings.landing_hero_background_url || '',
    landing_cta_background_url: settings.landing_cta_background_url || '',
  })
  const [uploading, setUploading] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const grouped = rows.reduce<Record<string, EditableContent[]>>((acc, row) => {
    acc[row.section_key] = [...(acc[row.section_key] || []), row]
    return acc
  }, {})

  function updateRow(index: number, patch: Partial<EditableContent>) {
    setRows((current) => current.map((row, i) => i === index ? { ...row, ...patch } : row))
  }

  async function uploadBackground(key: keyof typeof imageSettings, file: File | null) {
    if (!file) return
    setUploading(key)
    setError('')
    setMessage('')
    try {
      const url = await uploadAdminImage(file, 'landing', {
        label: key === 'landing_hero_background_url' ? 'Hero background' : 'CTA background',
        key: `landing_${key}`,
      })
      setImageSettings((current) => ({ ...current, [key]: url }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload background image.')
    } finally {
      setUploading(null)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await adminManage({
        resource: 'site-content',
        action: 'upsert',
        payload: { rows },
      })
      await adminManage({
        resource: 'clinic-settings',
        action: 'upsert',
        values: imageSettings,
      })
      setMessage('Site content saved.')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save content.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Landing Page Backgrounds</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            ['landing_hero_background_url', 'Hero background'],
            ['landing_cta_background_url', 'CTA background'],
          ].map(([key, label]) => (
            <div key={key} className="space-y-2">
              <Label>{label}</Label>
              <div className="h-32 rounded-md border bg-gray-50 overflow-hidden">
                {imageSettings[key as keyof typeof imageSettings] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageSettings[key as keyof typeof imageSettings]} alt={label} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <Input value={imageSettings[key as keyof typeof imageSettings]} onChange={(e) => setImageSettings({ ...imageSettings, [key]: e.target.value })} placeholder="https://..." />
              <Input type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={uploading === key} onChange={(e) => uploadBackground(key as keyof typeof imageSettings, e.target.files?.[0] || null)} />
            </div>
          ))}
        </CardContent>
      </Card>

      {Object.entries(grouped).map(([section, sectionRows]) => (
        <Card key={section}>
          <CardHeader><CardTitle className="text-base">{humanize(section)}</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            {sectionRows.map((row) => {
              const index = rows.findIndex((item) => item.section_key === row.section_key && item.field_key === row.field_key)
              const InputControl = row.content_type === 'textarea' ? Textarea : Input
              return (
                <div key={`${row.section_key}-${row.field_key}`} className="rounded-md border p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label className="font-semibold">{humanize(row.field_key)}</Label>
                    <div className="flex items-center gap-2">
                      <Switch checked={row.is_active} onCheckedChange={(checked) => updateRow(index, { is_active: checked })} />
                      <span className="text-xs text-gray-500">{row.is_active ? 'Active' : 'Hidden'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">English</Label>
                      <InputControl value={row.value_en || ''} rows={row.content_type === 'textarea' ? 3 : undefined} onChange={(e) => updateRow(index, { value_en: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Arabic</Label>
                      <InputControl value={row.value_ar || ''} rows={row.content_type === 'textarea' ? 3 : undefined} onChange={(e) => updateRow(index, { value_ar: e.target.value })} dir="rtl" />
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      ))}

      {message && <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>}
      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <Button onClick={handleSave} disabled={saving} className="bg-[#101010] hover:bg-black text-white">
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Save Site Content
      </Button>
    </div>
  )
}
