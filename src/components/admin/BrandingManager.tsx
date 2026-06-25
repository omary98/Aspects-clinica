'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImageIcon, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { adminManage, uploadAdminImage } from '@/lib/admin/client-actions'

type BrandingValues = {
  logo_url: string
  header_logo_url: string
  footer_logo_url: string
  favicon_url: string
  brand_primary_color: string
  brand_accent_color: string
  brand_background_color: string
}

const defaults: BrandingValues = {
  logo_url: '',
  header_logo_url: '',
  footer_logo_url: '',
  favicon_url: '',
  brand_primary_color: '#101010',
  brand_accent_color: '#D8A83E',
  brand_background_color: '#FFFDF7',
}

const assetFields: Array<{ key: keyof BrandingValues; label: string; uploadLabel: string }> = [
  { key: 'logo_url', label: 'Main EuroCure logo', uploadLabel: 'Main logo' },
  { key: 'header_logo_url', label: 'Header logo', uploadLabel: 'Header logo' },
  { key: 'footer_logo_url', label: 'Footer logo', uploadLabel: 'Footer logo' },
  { key: 'favicon_url', label: 'Favicon', uploadLabel: 'Favicon' },
]

export default function BrandingManager({ settings }: { settings: Record<string, string> }) {
  const router = useRouter()
  const [values, setValues] = useState<BrandingValues>({ ...defaults, ...settings })
  const [uploading, setUploading] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleUpload(key: keyof BrandingValues, file: File | null, label: string) {
    if (!file) return
    setUploading(key)
    setMessage('')
    setError('')
    try {
      const url = await uploadAdminImage(file, 'branding', {
        label,
        key: `branding_${String(key)}`,
        altTextEn: label,
        altTextAr: label,
      })
      setValues((current) => ({ ...current, [key]: url }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload image.')
    } finally {
      setUploading(null)
    }
  }

  async function handleSave() {
    setSaving(true)
    setMessage('')
    setError('')
    try {
      await adminManage({
        resource: 'clinic-settings',
        action: 'upsert',
        values,
      })
      setMessage('Branding saved.')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save branding.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {assetFields.map((field) => (
          <Card key={field.key}>
            <CardHeader>
              <CardTitle className="text-base">{field.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-28 rounded-md border bg-gray-50 flex items-center justify-center overflow-hidden">
                {values[field.key] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={values[field.key]} alt={field.label} className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400 text-sm">
                    <ImageIcon className="w-6 h-6" />
                    No image yet
                  </div>
                )}
              </div>
              <Input value={values[field.key]} onChange={(e) => setValues({ ...values, [field.key]: e.target.value })} placeholder="https://..." />
              <Input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                disabled={uploading === field.key}
                onChange={(e) => handleUpload(field.key, e.target.files?.[0] || null, field.uploadLabel)}
              />
              {uploading === field.key && <p className="text-xs text-gray-500">Uploading...</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Brand Colors</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            ['brand_primary_color', 'Primary color'],
            ['brand_accent_color', 'Accent color'],
            ['brand_background_color', 'Background color'],
          ].map(([key, label]) => (
            <div key={key} className="space-y-2">
              <Label>{label}</Label>
              <div className="flex gap-2">
                <Input type="color" className="w-14 p-1" value={values[key as keyof BrandingValues]} onChange={(e) => setValues({ ...values, [key]: e.target.value })} />
                <Input value={values[key as keyof BrandingValues]} onChange={(e) => setValues({ ...values, [key]: e.target.value })} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {message && <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>}
      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <Button onClick={handleSave} disabled={saving} className="bg-[#101010] hover:bg-black text-white">
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Save Branding
      </Button>
    </div>
  )
}
