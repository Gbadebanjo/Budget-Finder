import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Next 16's renamed middleware entrypoint.
 *
 * Routing model:
 *   - Public pages: `/`, `/login`, `/signup` (auth pages bounce signed-in users away).
 *   - Everything else this matcher hits is treated as protected.
 *   - `/api/*`, `/_next/*`, and `favicon.ico` are excluded by the matcher.
 */

const PUBLIC_PAGES = new Set([
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/auth/confirm',
])
const AUTH_PAGES = new Set(['/login', '/signup', '/forgot-password'])

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Landing is fully public — skip the Supabase Auth roundtrip entirely.
  if (pathname === '/') return NextResponse.next({ request })

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Signed-in users shouldn't see /login or /signup.
  if (user && AUTH_PAGES.has(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Unauthenticated users can't reach protected pages.
  if (!user && !PUBLIC_PAGES.has(pathname)) {
    const url = new URL('/login', request.url)
    if (pathname !== '/dashboard') url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
