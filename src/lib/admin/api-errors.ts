import { NextResponse } from 'next/server'

export function databaseErrorResponse(error: { message: string }) {
  if (error.message.toLowerCase().includes('permission denied')) {
    return NextResponse.json(
      {
        error: 'The server database key cannot write admin data. Check SUPABASE_SERVICE_ROLE_KEY in .env.local.',
      },
      { status: 500 }
    )
  }

  return NextResponse.json({ error: error.message }, { status: 500 })
}
