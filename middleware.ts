import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = [
  '/', '/auth', '/auth/callback', '/search', '/pricing',
  '/about', '/contact', '/faq', '/how-it-works', '/blog',
  '/emergency-dentist', '/privacy', '/terms', '/sitemap-page',
  '/verification-policy', '/medical-review-policy', '/editorial-policy',
  '/ai-search', '/claim-profile',
]

const ADMIN_PATHS = ['/admin']
const DASHBOARD_PATHS = ['/dashboard', '/dashboard-v2']
const STAFF_PATHS = [...ADMIN_PATHS, ...DASHBOARD_PATHS]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static files, api routes, _next
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Get session from Supabase auth cookie
  // Supabase stores the session in a cookie named `sb-<project-ref>-auth-token`
  // We check for the presence of an auth cookie as a basic check
  const hasAuthCookie = request.cookies.has('sb-eneuthbghipsdvsqilmb-auth-token') ||
    Array.from(request.cookies.getAll()).some(c => c.name.startsWith('sb-'))

  // Protected routes
  const isProtected = STAFF_PATHS.some(p => pathname.startsWith(p))
  const isAdminRoute = ADMIN_PATHS.some(p => pathname.startsWith(p))
  const isDashboardRoute = DASHBOARD_PATHS.some(p => pathname.startsWith(p))

  if (isProtected && !hasAuthCookie) {
    const loginUrl = new URL('/auth', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from auth page
  if (pathname.startsWith('/auth') && hasAuthCookie && !pathname.includes('callback')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
}
