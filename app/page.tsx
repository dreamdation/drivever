import type { Metadata } from 'next'
import { INITIAL_POSTS, INITIAL_HERO } from '@/lib/data'
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

export default function HomePage() {
  return (
    <>
      <BlogJsonLd />
      {/*
        HomeClient hydrates from Zustand store (which merges localStorage posts).
        SSR falls back to INITIAL_POSTS / INITIAL_HERO for SEO crawlability.
      */}
      <HomeClient
        initialPosts={INITIAL_POSTS}
        initialHero={INITIAL_HERO}
      />
    </>
  )
}
