import { NextResponse } from 'next/server'

export function databaseErrorResponse(error: { message: string }) {
  if (error.message.toLowerCase().includes('permission denied')) {
    return NextResponse.json(
      {
        error: 'The database API roles do not have table privileges yet. Run supabase/migrations/004_api_grants.sql in Supabase SQL Editor.',
      },
      { status: 500 }
    )
  }

  return NextResponse.json({ error: error.message }, { status: 500 })
}
