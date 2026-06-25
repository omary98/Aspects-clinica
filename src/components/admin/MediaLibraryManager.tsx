'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Loader2, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { uploadAdminImage } from '@/lib/admin/client-actions'
import type { SiteAsset } from '@/types/database'

const folders = ['branding', 'doctors', 'landing', 'specialties', 'general']

function formatBytes(value: number | null) {
  if (!value) return 'Unknown size'
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`
  return `${(value / 1024 / 1024).toFixed(1)} MB`
}

export default function MediaLibraryManager({ assets }: { assets: SiteAsset[] }) {
  const router = useRouter()
  const [folder, setFolder] = useState('general')
  const [label, setLabel] = useState('')
  const [filter, setFilter] = useState('all')
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const visibleAssets = filter === 'all' ? assets : assets.filter((asset) => asset.folder === filter)

  async function handleUpload(file: File | null) {
    if (!file) return
    setUploading(true)
    setMessage('')
    setError('')
    try {
      await uploadAdminImage(file, folder, {
        label: label || file.name,
      })
      setLabel('')
      setMessage('Image uploaded.')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload image.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(asset: SiteAsset) {
    if (!confirm(`Delete ${asset.label}?`)) return
    setDeletingId(asset.id)
    setMessage('')
    setError('')
    try {
      const response = await fetch('/api/admin/upload', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: asset.id }),
      })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error || 'Could not delete image.')
      setMessage('Image deleted.')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete image.')
    } finally {
      setDeletingId(null)
    }
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url)
    setMessage('Public URL copied.')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-5 grid grid-cols-1 md:grid-cols-[180px_1fr_220px] gap-4 items-end">
          <div className="space-y-2">
            <Label>Folder</Label>
            <Select value={folder} onValueChange={setFolder}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {folders.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Label</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Optional image label" />
          </div>
          <div className="space-y-2">
            <Label>Upload image</Label>
            <Input type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={uploading} onChange={(e) => handleUpload(e.target.files?.[0] || null)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>All</Button>
        {folders.map((item) => (
          <Button key={item} size="sm" variant={filter === item ? 'default' : 'outline'} onClick={() => setFilter(item)}>{item}</Button>
        ))}
        {uploading && <span className="inline-flex items-center gap-2 text-sm text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> Uploading</span>}
      </div>

      {message && <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>}
      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {visibleAssets.length === 0 ? (
        <div className="rounded-lg border bg-white p-10 text-center text-gray-500">
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          No images in this folder yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleAssets.map((asset) => (
            <Card key={asset.id} className="overflow-hidden">
              <div className="aspect-video bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset.public_url} alt={asset.alt_text_en || asset.label} className="w-full h-full object-cover" />
              </div>
              <CardContent className="p-4 space-y-3">
                <div>
                  <p className="font-medium text-sm text-gray-900 truncate">{asset.label}</p>
                  <p className="text-xs text-gray-500">{asset.folder} · {asset.mime_type || 'image'} · {formatBytes(asset.size_bytes)}</p>
                  <p className="text-xs text-gray-400">{new Date(asset.created_at).toLocaleDateString()}</p>
                </div>
                <Input readOnly value={asset.public_url} className="text-xs" />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => copyUrl(asset.public_url)} className="flex-1">
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    Copy URL
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => handleDelete(asset)} disabled={deletingId === asset.id} className="text-red-600 hover:text-red-700">
                    {deletingId === asset.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
