'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Post } from '@/lib/types'
import { supabase } from '@/lib/supabaseClient'
import { trackEvent } from '@/lib/analytics'

interface SearchOverlayProps {
  posts: Post[]
  onClose: () => void
}

// Minimal shape needed for search results.
type Hit = Pick<Post, 'id' | 'slug' | 'title' | 'description' | 'category' | 'date' | 'tags' | 'published'>

export default function SearchOverlay({ posts, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('')
  // The Zustand store holds posts only inside the admin panel — for public
  // visitors it's empty. Fetch the published posts directly so search works
  // everywhere with the same authoritative data the SSR pages use.
  const [dbPosts, setDbPosts] = useState<Hit[]>([])
  const router = useRouter()

  useEffect(() => {
    let active = true
    supabase
      .from('posts')
      .select('id, slug, title, description, category, date, tags, published, deleted_at')
      .eq('published', true)
      .is('deleted_at', null)
      .then(({ data }) => {
        if (!active || !data) return
        setDbPosts(
          (data as (Hit & { deleted_at: string | null })[])
            .filter((p) => p.slug && p.title)
            .map(({ id, slug, title, description, category, date, tags, published }) => ({
              id, slug, title, description, category, date, tags: tags ?? [], published,
            }))
        )
      })
    return () => { active = false }
  }, [])

  // Prefer freshly fetched posts; fall back to the store prop (admin sessions).
  const pool: Hit[] = dbPosts.length ? dbPosts : posts

  const q = query.toLowerCase()
  const results = query.length > 1
    ? pool.filter(
        (p) =>
          p.published !== false &&
          (
            p.title.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            (p.tags ?? []).some((t) => t.toLowerCase().includes(q))
          )
      )
    : []

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Enter → go to the full results page (/blog?q=), keeping on-site search in
  // sync with the JSON-LD SearchAction target.
  const goToResults = () => {
    const term = query.trim()
    if (term.length < 2) return
    trackEvent('search', { search_term: term })
    router.push(`/blog?q=${encodeURIComponent(term)}`)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-20 px-4"
      style={{ background: 'rgba(0,0,0,0.35)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-xl w-full max-w-[560px] max-h-[70vh] overflow-y-auto"
        style={{ boxShadow: '0 20px 48px rgba(0,0,0,0.14)' }}
      >
        {/* Input */}
        <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
          <Search size={16} className="text-[#888] shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') goToResults() }}
            placeholder="검색어를 입력하세요... (Enter로 전체 결과 보기)"
            className="flex-1 text-base outline-none text-fg bg-transparent"
          />
          <button onClick={onClose} className="text-[#aaa] hover:text-fg transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-3">
          {query.length === 0 && (
            <p className="text-sm text-[#bbb] py-2">
              인기 검색어: 음주운전, 엔진오일, 스쿨존, Audi Q7
            </p>
          )}

          {results.map((p) => (
            <button
              key={p.id}
              className="block w-full px-1 py-2.5 border-b border-[#f3f3f3] last:border-0 text-left hover:bg-surface transition-colors duration-100 rounded"
              onClick={() => {
                trackEvent('select_content', { content_type: 'article', item_id: p.slug })
                router.push(`/blog/${p.slug}`)
                onClose()
              }}
            >
              <div className="text-[0.9375rem] font-semibold text-fg mb-1 leading-snug">{p.title}</div>
              <div className="text-[11px] text-[#aaa]">{p.category} · {p.date}</div>
            </button>
          ))}

          {query.length > 1 && results.length === 0 && (
            <p className="text-sm text-[#aaa] py-4 text-center">검색 결과가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  )
}
