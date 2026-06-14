import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Callback for Supabase email magic-links (password reset, signup confirm,
 * magic link sign-in). Supports BOTH flows the SDK can emit:
 *
 *   1. PKCE  →  ?code=…              (default for @supabase/ssr)
 *   2. OTP   →  ?token_hash=…&type=… (older email templates)
 *
 * `next` defaults to /update-password because the password-reset email is
 * the most common entry point; sign-up confirms can override it.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code       = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type       = searchParams.get('type') as EmailOtpType | null
  const next       = searchParams.get('next') ?? '/update-password'

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, origin))
    return redirectWithError(origin, error.message)
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) return NextResponse.redirect(new URL(next, origin))
    return redirectWithError(origin, error.message)
  }

  return redirectWithError(origin, 'Invalid or expired link.')
}

function redirectWithError(origin: string, message: string) {
  return NextResponse.redirect(
    new URL('/login?error=' + encodeURIComponent(message), origin)
  )
}
