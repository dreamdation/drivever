'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import PostCard from './PostCard'
import AdSlot from './AdSlot'
import CategoryTabs from './CategoryTabs'
import Footer from '@/components/layout/Footer'
import { Post } from '@/lib/types'
import { useResolvedPosts } from '@/lib/usePosts'

interface BlogListClientProps {
  initialPosts: Post[]
  initialCat: string
  initialQuery?: string
}

export default function BlogListClient({ initialPosts, initialCat, initialQuery = '' }: BlogListClientProps) {
  // SSR-first post resolution (see useResolvedPosts). Shared with the home page.
  const posts = useResolvedPosts(initialPosts)

  const [activeCat, setActiveCat] = useState(initialCat)
  const [query, setQuery] = useState(initialQuery)
  const [page, setPage] = useState(1)
  const PER_PAGE = 9

  // Sync when navigating via header nav links (prop changes, state does not auto-reset)
  useEffect(() => {
    setActiveCat(initialCat)
    setPage(1)
  }, [initialCat])

  // Sync the search term when arriving via /blog?q=... (JSON-LD SearchAction target)
  useEffect(() => {
    setQuery(initialQuery)
    setPage(1)
  }, [initialQuery])

  const q = query.trim().toLowerCase()
  const matchesQuery = (p: Post) =>
    p.title.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q) ||
    (p.tags ?? []).some((t) => t.toLowerCase().includes(q))

  const published = posts.filter((p) => p.published !== false && p.slug && p.title && !p.deletedAt)
  const searched = q ? published.filter(matchesQuery) : published
  const filtered = activeCat === '전체' ? searched : searched.filter((p) => p.category === activeCat)
  const total = Math.ceil(filtered.length / PER_PAGE)
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  // Split into groups of 3 so each grid row is always complete
  const firstGroup  = paged.slice(0, 3)
  const secondGroup = paged.slice(3, 6)
  const thirdGroup  = paged.slice(6)

  const handleCatChange = (c: string) => { setActiveCat(c); setPage(1) }

  return (
    <div>
      {/* Page header with category tabs */}
      <div className="border-b border-border px-6 pt-10 md:pt-[40px] pb-0">
        <div className="max-w-[1080px] mx-auto">
          {q ? (
            <div className="mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h1
                  className="font-bold text-fg"
                  style={{ fontSize: 'clamp(1.375rem, 2.5vw, 1.75rem)', letterSpacing: '-0.03em' }}
                >
                  ‘{query.trim()}’ 검색 결과
                </h1>
                <span className="text-sm text-fg-3">{filtered.length}건</span>
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-1 ml-1 px-2.5 py-1 border border-border rounded-full text-xs text-fg-2 hover:text-accent hover:border-accent transition-colors"
                >
                  <X size={12} />
                  검색 해제
                </Link>
              </div>
            </div>
          ) : (
            <h1
              className="font-bold text-fg mb-4"
              style={{ fontSize: 'clamp(1.375rem, 2.5vw, 1.75rem)', letterSpacing: '-0.03em' }}
            >
              블로그
            </h1>
          )}
          <CategoryTabs active={activeCat} onChange={handleCatChange} variant="underline" />
        </div>
      </div>

      <div className="max-w-[1080px] mx-auto px-6 py-8">
        <AdSlot size="leaderboard" />

        {/* First group: rows 1 */}
        {firstGroup.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {firstGroup.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}

        {/* Mid ad + second group: rows 2 */}
        {secondGroup.length > 0 && (
          <>
            <AdSlot size="leaderboard" label="광고 영역 — 목록 중간 배너" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {secondGroup.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </>
        )}

        {/* Third group: row 3 */}
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
            <div className="text-sm">
              {q
                ? `‘${query.trim()}’에 대한 검색 결과가 없습니다.`
                : '해당 카테고리의 발행된 글이 없습니다.'}
            </div>
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
