import type { Metadata } from 'next'
import { INITIAL_POSTS, INITIAL_HERO } from '@/lib/data'
import { supabase, rowToPost, PostRow, fetchHeroSlides } from '@/lib/supabase'
import { SITE_URL } from '@/lib/site'
import { Post } from '@/lib/types'
import { compareByDateDesc } from '@/lib/utils'
import HomeClient from '@/components/blog/HomeClient'

export const metadata: Metadata = {
  title: 'Drivever — 실전 자동차·교통 정보 블로그',
  description:
    '실제 오너의 경험과 정확한 법률 해석을 제공하는 프리미엄 자동차·교통 정보 블로그. Audi Q7 유지보수, 교통법규 해석, 안전운전 가이드.',
  alternates: { canonical: SITE_URL },
}

// JSON-LD: WebSite + Blog structured data. `posts` are the live published posts
// (seed + Supabase) so the Blog graph reflects real content for crawlers.
function BlogJsonLd({ posts }: { posts: Post[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: 'Drivever',
        description: '실전 자동차·교통 정보 블로그',
        inLanguage: 'ko',
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/blog?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Blog',
        '@id': `${SITE_URL}/#blog`,
        url: SITE_URL,
        name: 'Drivever 블로그',
        description: '실제 오너의 경험 + 정확한 법률 해석',
        author: { '@type': 'Person', name: 'Drivever 운영자' },
        blogPost: posts.slice(0, 10).map((p) => ({
          '@type': 'BlogPosting',
          headline: p.title,
          description: p.description,
          datePublished: p.date.replace(/\./g, '-'),
          url: `${SITE_URL}/blog/${encodeURIComponent(p.slug)}`,
          author: { '@type': 'Person', name: 'Drivever 운영자' },
          keywords: p.tags.join(', '),
        })),
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export default async function HomePage() {
  const { data } = await supabase.from('posts').select('*').eq('published', true)
  const staticIds = new Set(INITIAL_POSTS.map((p) => p.id))
  const supaPosts = (data ?? [])
    .map((r) => rowToPost(r as PostRow))
    .filter((p) => !staticIds.has(p.id))
  const allPosts = [...INITIAL_POSTS, ...supaPosts].sort(compareByDateDesc)

  // Hero is DB-backed; fall back to the seed only when no row exists yet.
  const heroSlides = (await fetchHeroSlides(supabase)) ?? INITIAL_HERO

  return (
    <>
      <BlogJsonLd posts={allPosts.filter((p) => p.published !== false && !p.deletedAt)} />
      <HomeClient initialPosts={allPosts} initialHero={heroSlides} />
    </>
  )
}
