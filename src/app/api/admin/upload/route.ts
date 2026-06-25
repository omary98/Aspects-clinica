import { NextRequest, NextResponse } from 'next/server'
import { getAdminRequestContext, forbiddenResponse } from '@/lib/admin/auth'
import { databaseErrorResponse } from '@/lib/admin/api-errors'
import { createServiceClient } from '@/lib/supabase/server'

const BUCKET = 'site-assets'
const ALLOWED_FOLDERS = new Set(['branding', 'doctors', 'landing', 'specialties', 'general'])
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
const MAX_SIZE_BYTES = 5 * 1024 * 1024

function safeFileName(name: string) {
  const extension = name.includes('.') ? name.split('.').pop() : 'bin'
  const base = name
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

  return `${base || 'upload'}-${Date.now()}.${extension}`
}

function safeFolder(value: FormDataEntryValue | null) {
  const folder = String(value || 'general').replace(/[^a-z0-9-]/gi, '-').toLowerCase()
  return ALLOWED_FOLDERS.has(folder) ? folder : 'general'
}

function forbiddenCmsRole(role: string) {
  return role !== 'medical_director'
}

export async function GET(request: NextRequest) {
  const admin = await getAdminRequestContext(request)
  if (!admin) return forbiddenResponse()
  if (forbiddenCmsRole(admin.role)) return forbiddenResponse()

  const folder = request.nextUrl.searchParams.get('folder')
  const supabase = await createServiceClient()
  let query = (supabase as any).from('site_assets').select('*').order('created_at', { ascending: false })
  if (folder && ALLOWED_FOLDERS.has(folder)) query = query.eq('folder', folder)

  const { data, error } = await query
  if (error) return databaseErrorResponse(error)

  return NextResponse.json({ ok: true, assets: data || [] })
}

export async function POST(request: NextRequest) {
  const admin = await getAdminRequestContext(request)
  if (!admin) return forbiddenResponse()
  if (forbiddenCmsRole(admin.role)) return forbiddenResponse()

  const form = await request.formData()
  const file = form.get('file')
  const area = safeFolder(form.get('area') || form.get('folder'))
  const label = String(form.get('label') || (file instanceof File ? file.name : 'Uploaded image')).trim()
  const key = String(form.get('key') || '').trim() || null
  const altTextEn = String(form.get('alt_text_en') || '').trim() || null
  const altTextAr = String(form.get('alt_text_ar') || '').trim() || null

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'File is required.' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Only PNG, JPG, WEBP, and GIF images are supported.' }, { status: 400 })
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'Image must be 5 MB or smaller.' }, { status: 400 })
  }

  const supabase = await createServiceClient()
  await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => null)

  const path = `${area}/${safeFileName(file.name)}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: true,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)

  const { data: asset, error: assetError } = await (supabase as any)
    .from('site_assets')
    .upsert({
      key,
      label: label || file.name,
      bucket: BUCKET,
      path,
      public_url: data.publicUrl,
      asset_type: 'image',
      folder: area,
      mime_type: file.type,
      size_bytes: file.size,
      alt_text_ar: altTextAr,
      alt_text_en: altTextEn,
      uploaded_by: admin.userId,
    }, key ? { onConflict: 'key' } : undefined)
    .select()
    .single()

  if (assetError) {
    await supabase.storage.from(BUCKET).remove([path]).catch(() => null)
    return databaseErrorResponse(assetError)
  }

  return NextResponse.json({ ok: true, url: data.publicUrl, asset })
}

export async function DELETE(request: NextRequest) {
  const admin = await getAdminRequestContext(request)
  if (!admin) return forbiddenResponse()
  if (forbiddenCmsRole(admin.role)) return forbiddenResponse()

  const body = await request.json().catch(() => ({})) as { id?: string }
  if (!body.id) {
    return NextResponse.json({ error: 'Asset id is required.' }, { status: 400 })
  }

  const supabase = await createServiceClient()
  const { data: asset, error: fetchError } = await (supabase as any)
    .from('site_assets')
    .select('id, path, public_url')
    .eq('id', body.id)
    .single()

  if (fetchError) return databaseErrorResponse(fetchError)

  const [{ data: settings }, { data: doctors }, { data: specialties }] = await Promise.all([
    (supabase as any).from('clinic_settings').select('key').eq('value', asset.public_url),
    (supabase as any).from('doctors').select('id').eq('photo_url', asset.public_url).limit(1),
    (supabase as any).from('specialties').select('id').eq('image_url', asset.public_url).limit(1),
  ])

  if ((settings?.length || 0) > 0 || (doctors?.length || 0) > 0 || (specialties?.length || 0) > 0) {
    return NextResponse.json({ error: 'This image is currently used on the site. Remove it from that page before deleting.' }, { status: 409 })
  }

  const removeStorage = await supabase.storage.from(BUCKET).remove([asset.path])
  if (removeStorage.error) return NextResponse.json({ error: removeStorage.error.message }, { status: 500 })

  const removeRow = await (supabase as any).from('site_assets').delete().eq('id', body.id)
  if (removeRow.error) return databaseErrorResponse(removeRow.error)

  return NextResponse.json({ ok: true })
}
