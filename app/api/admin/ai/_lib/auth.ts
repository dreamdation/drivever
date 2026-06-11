import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient, User } from '@supabase/supabase-js'

// Admin gate for the AI API routes. Reads the Supabase session from cookies
// (same cookie store the browser client writes) and returns an AUTHENTICATED
// supabase client — DB writes from these routes go through RLS as
// `authenticated`, never via the service-role key.
//
// middleware.ts also gates /api/admin/* (defense in depth); this is the
// per-route check the spec requires.
export async function requireAdmin(): Promise<
  { ok: true; user: User; supabase: SupabaseClient } | { ok: false; res: Response }
> {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          // Route handlers may not always be allowed to write cookies; token
          // refresh is handled by the middleware, so ignore failures here.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { /* read-only context */ }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      ok: false,
      res: Response.json({ error: '로그인이 필요합니다.' }, { status: 401 }),
    }
  }

  return { ok: true, user, supabase }
}
