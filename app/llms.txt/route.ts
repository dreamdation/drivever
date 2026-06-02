import { supabase, rowToPost, PostRow } from '@/lib/supabase'
import { SITE_URL } from '@/lib/site'
import { compareByDateDesc } from '@/lib/utils'

// llms.txt — machine-readable site summary for LLMs / AI agents, per the
// llmstxt.org spec (Markdown: H1 title, blockquote summary, link sections).
// Lets agents grasp the site's scope without crawling. Regenerated hourly,
// mirroring app/sitemap.ts and app/rss.xml so new posts surface automatically.
// See https://developer.chrome.com/docs/lighthouse/agentic-browsing/llms-txt
export const revalidate = 3600

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

  // Newest 30 posts as primary content links.
  const postLinks = posts
    .slice(0, 30)
    .map((p) => {
      const url = `${SITE_URL}/blog/${encodeURIComponent(p.slug)}`
      const desc = (p.description ?? '').replace(/\s+/g, ' ').trim()
      return `- [${p.title}](${url})${desc ? `: ${desc}` : ''}`
    })
    .join('\n')

  // Unique categories present in published posts.
  const categories = Array.from(new Set(posts.map((p) => p.category).filter(Boolean)))
  const categoryLines = categories.map((c) => `- ${c}`).join('\n')

  const text = `# Drivever — 실전 자동차·교통 정보 블로그

> Drivever(${SITE_URL})는 실제 오너의 경험과 정확한 법률 해석을 제공하는 한국어 자동차·교통 정보 블로그입니다. 2023년식 Audi Q7 55 TFSI 오너가 직접 경험한 데이터와 공식 법령(도로교통법 등)을 근거로, 수입차 유지보수·차량관리·교통법규 해석·안전운전 가이드를 다룹니다. 모든 콘텐츠는 구글 E-E-A-T(경험·전문성·권위성·신뢰성) 기준을 충족하도록 실측 데이터와 법 조항 인용으로 뒷받침됩니다.

## 다루는 주제
${categoryLines || '- 자동차 유지보수\n- 차량관리\n- 교통법규 해석\n- 안전운전'}

## 핵심 페이지
- [홈](${SITE_URL}/): 최신 포스트와 추천 글
- [블로그 전체 글](${SITE_URL}/blog): 카테고리별 전체 포스트 목록
- [블로그 소개](${SITE_URL}/about): 운영자·미션·콘텐츠 기준 소개
- [문의하기](${SITE_URL}/contact): 제휴·문의 연락처
- [광고 안내](${SITE_URL}/advertise): 광고·제휴 안내

## 최신 포스트
${postLinks || '- (아직 게시된 글이 없습니다)'}

## 더 보기
- [RSS 피드](${SITE_URL}/rss.xml): 최신 글 RSS 2.0 피드
- [사이트맵](${SITE_URL}/sitemap.xml): 전체 URL 목록

## Optional
- [개인정보처리방침](${SITE_URL}/privacy)
- [이용약관](${SITE_URL}/terms)
`

  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
