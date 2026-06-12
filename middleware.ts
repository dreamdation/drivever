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

// Known dead WordPress URLs (removed posts, old taxonomy/category pages, WP
// defaults) that still get crawled. Without this they fall through to the
// single-segment catch-all below and 301 into a /blog/{slug} that 404s — a
// redirect→404 chain GSC flags. Map each to the closest LIVE page so the crawler
// sees a clean 301 → 200. Keys are decoded, trailing-slash-stripped pathnames.
const LEGACY_REDIRECTS: Record<string, string> = {
  // Exact equivalent in the new site
  '/privacy-policy': '/privacy',

  // 교통법규·사고·단속 관련 → 교통법규 카테고리(콘텐츠 있음)
  '/traffic-law-driving-tip': '/blog?cat=교통법규',
  '/교통법규/국내-교통법규': '/blog?cat=교통법규',
  '/traffic-accident-towing-tips-korea-교통사고-견인': '/blog?cat=교통법규',
  '/rental-car-accident-liability-standards-렌트카-교통사고': '/blog?cat=교통법규',
  '/tips-to-avoid-illegal-parking-불법주정차-단속-알림-서비스': '/blog?cat=교통법규',
  '/2026년부터-전기차-충전-주차-단속-강화-주차-시간-7시간': '/blog?cat=교통법규',

  // 차량관리·자동차정보 등 신규 대응글 없음 → 블로그 허브로
  '/winter-tire-necessity-comparison-윈터-타이어': '/blog',
  '/first-car-purchase-process-tax-documents-첫차-구매-절차': '/blog',
  '/electric-car-2026-전기차-충전-요금': '/blog',
  '/car-driving-blackbox-nightvision-car-블랙박스': '/blog',
  '/car-battery-tips-자동차-배터리-교체주기': '/blog',
  '/winter-car-undercarriage-wash-calcium-chloride-자동차-하부세차': '/blog',
  '/car-tax-payment-tips-2026년-자동차세-연납': '/blog',
  '/vehicle-inspection-regular-comprehensive-difference': '/blog',
  '/자동차-정보': '/blog',
  '/자동차-정보/자동차-악세사리': '/blog',
  '/자동차-정보/차-관리-꿀팁': '/blog',
  '/uncategorized': '/blog',
  '/sample-page': '/blog',
}

// Decoded, trailing-slash-stripped lookup into LEGACY_REDIRECTS.
function legacyExplicitRedirect(pathname: string): string | null {
  const clean = pathname.replace(/\/+$/, '') || '/'
  let decoded = clean
  try { decoded = decodeURIComponent(clean) } catch { /* keep raw on bad encoding */ }
  return LEGACY_REDIRECTS[decoded] ?? null
}

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
  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/')
  const isAdminApi = pathname.startsWith('/api/admin')
  const isAdmin = isAdminPage || isAdminApi

  // 1) Legacy WordPress URLs (everything except the admin area).
  if (!isAdmin) {
    // 1a) Explicit map for known dead URLs → closest live page (runs first so it
    //     wins over the catch-all, which would otherwise 301 these into a 404).
    const explicit = legacyExplicitRedirect(pathname)
    if (explicit) {
      const url = request.nextUrl.clone()
      const qIdx = explicit.indexOf('?')
      url.pathname = qIdx === -1 ? explicit : explicit.slice(0, qIdx)
      url.search   = qIdx === -1 ? '' : explicit.slice(qIdx)
      return NextResponse.redirect(url, 301)
    }

    // 1b) Catch-all: root-level permalink → /blog/* (slugs that exist resolve;
    //     unknown ones 404 at /blog/[slug], same as a bare 404).
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
    // API routes get a 401 (no HTML redirect); pages bounce to /login.
    if (isAdminApi) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }
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
