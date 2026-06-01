import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Top-level routes owned by the app — these must never be treated as a legacy
// WordPress permalink and rewritten to /blog/*.
// Also includes common WordPress-specific paths so they 404 cleanly instead of
// getting a misleading 301 → /blog/wp-admin etc. (which GSC flags as redirect chains).
const RESERVED_SEGMENTS = new Set([
  // App routes
  'blog', 'about', 'advertise', 'contact', 'login',
  'privacy', 'terms', 'admin', 'api', 'opengraph-image',
  'rss.xml', 'sitemap.xml', 'robots.txt', 'ads.txt',
  // WordPress-specific paths — let these pass through to Next's 404 cleanly
  'wp-admin', 'wp-login', 'wp-content', 'wp-includes', 'wp-json',
  'feed', 'rss', 'atom', 'xmlrpc.php',
  'category', 'tag', 'author', 'page', 'search',
  'sitemap_index.xml', 'post-sitemap.xml', 'page-sitemap.xml',
])

// Legacy WordPress used root-level permalinks: https://drivever.kr/{slug}/ .
// The Next.js app serves the same posts at /blog/{slug} with identical slugs
// (verified against the DB), so 301 any single-segment, non-reserved root path
// to its /blog/ equivalent. Unknown slugs just 404 at /blog/[slug] — same
// outcome as before the migration, so there's no harm in the catch-all.
function legacyPostRedirect(pathname: string): string | null {
  const clean = pathname.replace(/\/+$/, '')          // drop trailing slash(es)
  if (clean === '') return null                        // home
  const segments = clean.split('/').filter(Boolean)
  if (segments.length !== 1) return null               // only root-level permalinks
  const seg = segments[0]
  if (RESERVED_SEGMENTS.has(seg)) return null
  try {
    // Decode here so the URL setter re-encodes exactly once (the slug carries
    // percent-encoded Korean); /blog/[slug] decodes it again on the way in.
    return `/blog/${decodeURIComponent(seg)}`
  } catch {
    return null                                         // malformed encoding — leave it
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/')

  // 1) Legacy WordPress permalink → /blog/* (everything except the admin area).
  if (!isAdmin) {
    const target = legacyPostRedirect(pathname)
    if (target) {
      const url = request.nextUrl.clone()
      url.pathname = target
      url.search = ''                                   // old query strings don't carry over
      return NextResponse.redirect(url, 301)
    }
    return NextResponse.next()
  }

  // 2) Admin auth gate. Reads the Supabase auth session from cookies (written by
  // the cookie-backed browser client) and redirects any unauthenticated request
  // to /login. This complements the RLS policies — RLS protects the data, this
  // keeps the admin UI itself behind auth.
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() revalidates the token with the Supabase auth server (do not trust
  // getSession() alone in middleware).
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  // Run on everything except Next internals and files with an extension
  // (sitemap.xml, robots.txt, ads.txt, manifest.webmanifest, *.png, favicon …),
  // so both the admin gate and the legacy-permalink redirects are evaluated.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
