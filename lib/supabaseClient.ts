import { createBrowserClient } from '@supabase/ssr'

// Browser-side Supabase client used by all 'use client' components (auth +
// reads + writes). Unlike the legacy localStorage client, @supabase/ssr stores
// the auth session in cookies, so the Next.js middleware can read it to gate
// the /admin routes server-side.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)
