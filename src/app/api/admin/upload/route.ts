import { NextRequest, NextResponse } from 'next/server'
import { getAdminRequestContext, forbiddenResponse } from '@/lib/admin/auth'
import { createServiceClient } from '@/lib/supabase/server'

const BUCKET = 'site-assets'

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

export async function POST(request: NextRequest) {
  if (!await getAdminRequestContext(request)) return forbiddenResponse()

  const form = await request.formData()
  const file = form.get('file')
  const area = String(form.get('area') || 'general').replace(/[^a-z0-9-]/gi, '-').toLowerCase()

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'File is required.' }, { status: 400 })
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image uploads are supported.' }, { status: 400 })
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

  return NextResponse.json({ ok: true, url: data.publicUrl })
}
