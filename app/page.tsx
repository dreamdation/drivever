import type { Metadata } from 'next'
import { INITIAL_POSTS, INITIAL_HERO } from '@/lib/data'
import { supabase, rowToPost, PostRow, fetchHeroSlides } from '@/lib/supabase'
import HomeClient from '@/components/blog/HomeClient'

export const metadata: Metadata = {
  title: 'Drivever — 실전 자동차·교통 정보 블로그',
  description:
    '실제 오너의 경험과 정확한 법률 해석을 제공하는 프리미엄 자동차·교통 정보 블로그. Audi Q7 유지보수, 교통법규 해석, 안전운전 가이드.',
  alternates: { canonical: 'https://drivever.com' },
}

// JSON-LD: WebSite + Blog structured data
function BlogJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://drivever.com/#website',
        url: 'https://drivever.com',
        name: 'Drivever',
        description: '실전 자동차·교통 정보 블로그',
        inLanguage: 'ko',
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: 'https://drivever.com/blog?q={search_term_string}' },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Blog',
        '@id': 'https://drivever.com/#blog',
        url: 'https://drivever.com',
        name: 'Drivever 블로그',
        description: '실제 오너의 경험 + 정확한 법률 해석',
        author: { '@type': 'Person', name: 'Drivever 운영자' },
        blogPost: INITIAL_POSTS.filter((p) => p.published !== false).slice(0, 6).map((p) => ({
          '@type': 'BlogPosting',
          headline: p.title,
          description: p.description,
          datePublished: p.date.replace(/\./g, '-'),
          url: `https://drivever.com/blog/${p.id}`,
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
  const allPosts = [...INITIAL_POSTS, ...supaPosts].sort((a, b) => b.date.localeCompare(a.date))

  // Hero is DB-backed; fall back to the seed only when no row exists yet.
  const heroSlides = (await fetchHeroSlides()) ?? INITIAL_HERO

  return (
    <>
      <BlogJsonLd />
      <HomeClient initialPosts={allPosts} initialHero={heroSlides} />
    </>
  )
}
