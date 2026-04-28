'use client'

import { useState, useEffect } from 'react'
import { useBlogStore } from '@/store/blogStore'
import PostCard from './PostCard'
import AdSlot from './AdSlot'
import CategoryTabs from './CategoryTabs'
import Footer from '@/components/layout/Footer'
import { Post } from '@/lib/types'

interface BlogListClientProps {
  initialPosts: Post[]
  initialCat: string
}

export default function BlogListClient({ initialPosts, initialCat }: BlogListClientProps) {
  const { posts: storePosts, _hydrated } = useBlogStore()
  const posts = _hydrated ? storePosts : initialPosts

  const [activeCat, setActiveCat] = useState(initialCat)
  const [page, setPage] = useState(1)
  const PER_PAGE = 9

  // Sync when navigating via header nav links (prop changes, state does not auto-reset)
  useEffect(() => {
    setActiveCat(initialCat)
    setPage(1)
  }, [initialCat])

  const published = posts.filter((p) => p.published !== false)
  const filtered = activeCat === '전체' ? published : published.filter((p) => p.category === activeCat)
  const total = Math.ceil(filtered.length / PER_PAGE)
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const half = Math.ceil(PER_PAGE / 2)

  const handleCatChange = (c: string) => { setActiveCat(c); setPage(1) }

  return (
    <div>
      {/* Page header with category tabs */}
      <div className="border-b border-border px-6 pt-10 md:pt-[40px] pb-0">
        <div className="max-w-[1080px] mx-auto">
          <h1
            className="font-bold text-fg mb-4"
            style={{ fontSize: 'clamp(1.375rem, 2.5vw, 1.75rem)', letterSpacing: '-0.03em' }}
          >
            블로그
          </h1>
          <CategoryTabs active={activeCat} onChange={handleCatChange} variant="underline" />
        </div>
      </div>

      <div className="max-w-[1080px] mx-auto px-6 py-8">
        <AdSlot size="leaderboard" />

        {/* First half */}
        {paged.slice(0, half).length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {paged.slice(0, half).map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}

        {/* Mid ad + second half */}
        {paged.slice(half).length > 0 && (
          <>
            <AdSlot size="leaderboard" label="광고 영역 — 목록 중간 배너" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {paged.slice(half).map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </>
        )}

        {filtered.length === 0 && (
          <div className="py-16 text-center text-fg-3">
            <div className="text-4xl mb-3">—</div>
            <div className="text-sm">해당 카테고리의 발행된 글이 없습니다.</div>
          </div>
        )}

        {/* Pagination */}
        {total > 1 && (
          <div className="flex justify-center gap-1 mt-3">
            {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className="w-[34px] h-[34px] rounded-[6px] text-sm font-[inherit] transition-colors"
                style={{
                  border: n === page ? 'none' : '1px solid #EAEAEA',
                  background: n === page ? '#0070F3' : '#fff',
                  color: n === page ? '#fff' : '#555',
                }}
              >
                {n}
              </button>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
