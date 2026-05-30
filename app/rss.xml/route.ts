import { supabase, rowToPost, PostRow } from '@/lib/supabase'
import { SITE_URL } from '@/lib/site'
import { compareByDateDesc } from '@/lib/utils'

// RSS 2.0 feed of published posts. Naver Search Advisor (and feed readers) use
// this to discover new posts faster than crawling alone. Regenerated hourly,
// mirroring app/sitemap.ts.
export const revalidate = 3600

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// "2026.01.07" or "2026.01.10 00:00" → RFC-822 date (KST assumed for date-only).
function toRfc822(d: string): string {
  const datePart = d.split(' ')[0].replace(/\./g, '-')
  const parsed = new Date(`${datePart}T00:00:00+09:00`)
  return isNaN(parsed.getTime()) ? new Date().toUTCString() : parsed.toUTCString()
}

export async function GET() {
  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .is('deleted_at', null)

  const posts = (data ?? [])
    .map((r) => rowToPost(r as PostRow))
    .filter((p) => p.slug && p.slug.trim() !== '')
    .sort(compareByDateDesc)
    .slice(0, 50) // newest 50

  const items = posts
    .map((p) => {
      const url = `${SITE_URL}/blog/${encodeURIComponent(p.slug)}`
      return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${toRfc822(p.date)}</pubDate>
      <category>${escapeXml(p.category)}</category>
      <description>${escapeXml(p.description ?? '')}</description>
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Drivever — 실전 자동차·교통 정보 블로그</title>
    <link>${SITE_URL}</link>
    <description>실제 오너의 경험과 정확한 법률 해석을 제공하는 자동차·교통 정보 블로그.</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
