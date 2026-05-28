import type { Metadata } from 'next'
import BlogListClient from '@/components/blog/BlogListClient'
import { INITIAL_POSTS } from '@/lib/data'
import { supabase, rowToPost, PostRow } from '@/lib/supabase'
import { SITE_URL } from '@/lib/site'
import { compareByDateDesc } from '@/lib/utils'

interface Props {
  searchParams: Promise<{ cat?: string; q?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams
  const query = q?.trim()

  // Search-result pages are thin/duplicative — keep them out of the index but
  // still usable (the JSON-LD SearchAction points here).
  if (query) {
    return {
      title: `‘${query}’ 검색 결과`,
      description: `Drivever에서 ‘${query}’ 검색 결과를 확인하세요.`,
      robots: { index: false, follow: true },
      alternates: { canonical: `${SITE_URL}/blog` },
    }
  }

  return {
    title: '블로그',
    description: '교통법규, Premium Garage, 안전운전 카테고리의 최신 자동차·교통 정보를 확인하세요.',
    alternates: { canonical: `${SITE_URL}/blog` },
  }
}

export default async function BlogPage({ searchParams }: Props) {
  const { cat, q } = await searchParams
  const initialCat = cat ?? '전체'
  const initialQuery = q?.trim() ?? ''

  const { data } = await supabase.from('posts').select('*').eq('published', true)
  const staticIds = new Set(INITIAL_POSTS.map((p) => p.id))
  const supaPosts = (data ?? [])
    .map((r) => rowToPost(r as PostRow))
    .filter((p) => !staticIds.has(p.id))

  const allPosts = [...INITIAL_POSTS, ...supaPosts].sort(compareByDateDesc)

  return <BlogListClient initialPosts={allPosts} initialCat={initialCat} initialQuery={initialQuery} />
}
