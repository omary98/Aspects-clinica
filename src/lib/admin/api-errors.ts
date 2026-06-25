import { NextResponse } from 'next/server'

export function databaseErrorResponse(error: { message: string }) {
  const message = error.message.toLowerCase()

  if (message.includes('site_assets') || message.includes('site_content')) {
    return NextResponse.json(
      {
        error: 'The CMS database tables are missing. Run supabase/migrations/005_cms_media.sql in Supabase SQL Editor, then refresh this page.',
      },
      { status: 500 }
    )
  }

  if (message.includes('schema cache') && message.includes('specialties')) {
    return NextResponse.json(
      {
        error: 'Supabase cannot see the specialties table yet. Run migrations 001 through 005 in order, then wait a minute for the API schema cache to refresh.',
      },
      { status: 500 }
    )
  }

  if (message.includes('permission denied')) {
    return NextResponse.json(
      {
        error: 'The database API roles do not have table privileges yet. Run supabase/migrations/004_api_grants.sql in Supabase SQL Editor.',
      },
      { status: 500 }
    )
  }

  return NextResponse.json({ error: error.message }, { status: 500 })
}
