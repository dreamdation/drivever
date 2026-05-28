'use client'

import { useState } from 'react'
import HeroCarousel from './HeroCarousel'
import PostCard from './PostCard'
import AdSlot from './AdSlot'
import CategoryTabs from './CategoryTabs'
import Footer from '@/components/layout/Footer'
import { Post, HeroSlide } from '@/lib/types'
import { useResolvedPosts } from '@/lib/usePosts'

const PER_PAGE = 9

interface HomeClientProps {
  initialPosts: Post[]
  initialHero: HeroSlide[]
}

export default function HomeClient({ initialPosts, initialHero }: HomeClientProps) {
  // SSR-first post resolution (see useResolvedPosts). Shared with the blog list.
  const posts = useResolvedPosts(initialPosts)
  // Hero is DB-backed and served by SSR (authoritative) — don't override it with
  // the per-browser localStorage copy, which is stale/empty for most visitors.
  const heroSlides = initialHero

  const [cat, setCat] = useState('전체')
  const [page, setPage] = useState(1)

  const published = posts.filter((p) => p.published !== false && p.slug && p.title && !p.deletedAt)
  const filtered = cat === '전체' ? published : published.filter((p) => p.category === cat)

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  // Split page into three rows (3+3+3) for ad slot positioning
  const firstGroup = paged.slice(0, 3)
  const secondGroup = paged.slice(3, 6)
  const thirdGroup = paged.slice(6, 9)

  const handleCatChange = (next: string) => {
    setCat(next)
    setPage(1)
  }

  return (
    <div>
      {/* Hero carousel */}
      <HeroCarousel slides={heroSlides} posts={posts} />

      <div className="max-w-[1080px] mx-auto px-6">
        {/* Ad below hero */}
        <AdSlot size="leaderboard" />

        {/* Category tabs */}
        <div className="border-b border-border bg-[#FAFAFA] -mx-6 px-4">
          <div className="h-11 flex items-center overflow-x-auto">
            <CategoryTabs active={cat} onChange={handleCatChange} variant="chip" />
          </div>
        </div>

        {/* Post grid */}
        <section className="py-8" aria-label="최신 포스트">
          {firstGroup.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {firstGroup.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          )}

          {secondGroup.length > 0 && (
            <>
              <AdSlot size="leaderboard" label="광고 영역 — 728×90 (목록 중간)" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {secondGroup.map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
            </>
          )}

          {thirdGroup.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {thirdGroup.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          )}

          {filtered.length === 0 && (
            <div className="py-16 text-center text-fg-3">
              <div className="text-4xl mb-3">—</div>
              <div className="text-sm">해당 카테고리의 발행된 글이 없습니다.</div>
            </div>
          )}

          {/* Pagination — one button per page, count grows with posts */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-1 mt-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className="w-[34px] h-[34px] rounded-[6px] text-sm font-[inherit] transition-colors"
                  style={{
                    border: n === safePage ? 'none' : '1px solid #EAEAEA',
                    background: n === safePage ? '#0070F3' : '#fff',
                    color: n === safePage ? '#fff' : '#555',
                    fontWeight: n === safePage ? 700 : 400,
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      <Footer />
    </div>
  )
}
