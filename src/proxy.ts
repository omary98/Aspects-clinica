import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const STATIC_EXTENSIONS = ['.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.css', '.js', '.map']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    STATIC_EXTENSIONS.some((extension) => pathname.endsWith(extension))
  ) {
    return NextResponse.next()
  }

  // Always allow login page through — calling updateSession here would refresh
  // Supabase session cookies and cause Next.js to loop on /admin/login.
  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  return updateSession(request)
}

export const config = {
  matcher: '/:path*',
}
