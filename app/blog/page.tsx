import type { Metadata } from 'next'
import BlogListClient from '@/components/blog/BlogListClient'
import { INITIAL_POSTS } from '@/lib/data'

export const metadata: Metadata = {
  title: '블로그',
  description: '교통법규, Premium Garage, 안전운전 카테고리의 최신 자동차·교통 정보를 확인하세요.',
  alternates: { canonical: 'https://drivever.com/blog' },
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>
}) {
  const { cat } = await searchParams
  const initialCat = cat ?? '전체'
  return <BlogListClient initialPosts={INITIAL_POSTS} initialCat={initialCat} />
}
