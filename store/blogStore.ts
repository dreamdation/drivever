'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Post, HeroSlide } from '@/lib/types'
import { INITIAL_POSTS, INITIAL_HERO } from '@/lib/data'
import { blocksToHtmlWithIds, generateSummaryListHtml, insertSummaryListAfterIntro } from '@/lib/utils'

interface BlogStore {
  posts: Post[]
  heroSlides: HeroSlide[]
  _hydrated: boolean
  // The post currently shown on a /blog/[slug] page. Set by ArticleClient (which
  // knows the post from SSR, incl. DB-only posts not in the seed store) so the
  // header's admin "수정" button can target any post reliably. Not persisted.
  activePost: { id: number; slug: string } | null
  setPosts: (posts: Post[]) => void
  setHeroSlides: (slides: HeroSlide[]) => void
  setActivePost: (post: { id: number; slug: string } | null) => void
  incrementViews: (id: number) => void
  setHydrated: () => void
}

export const useBlogStore = create<BlogStore>()(
  persist(
    (set) => ({
      posts: INITIAL_POSTS,
      heroSlides: INITIAL_HERO,
      _hydrated: false,
      activePost: null,
      setPosts: (posts) => set({ posts }),
      setHeroSlides: (slides) => set({ heroSlides: slides }),
      setActivePost: (activePost) => set({ activePost }),
      incrementViews: (id) =>
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === id ? { ...p, views: (p.views ?? 0) + 1 } : p
          ),
        })),
      setHydrated: () => set({ _hydrated: true }),
    }),
    {
      name: 'drivever-blog-store',
      version: 7,
      skipHydration: true,
      // Persist ONLY hero slides. Posts are served fresh by the server (SSR +
      // Supabase) on every load, so caching them in localStorage was redundant
      // and actively harmful: after hydration the stale cached copy shadowed
      // freshly-deployed content (the "flash then blank/stale" bug).
      partialize: (state) => ({ heroSlides: state.heroSlides }),
      // Safety net for clients that still hold a `posts` array in an older
      // payload: never let the persisted posts override the build-time default.
      // Posts therefore always come from INITIAL_POSTS + the server, never cache.
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<BlogStore>),
        posts: current.posts,
      }),
      migrate: (persistedState: any, version: number) => {
        let state = persistedState

        if (version < 1) {
          const posts: any[] = state.posts ?? []
          state = {
            ...state,
            posts: posts.map((p) => {
              if (p.slug) return p
              const initial = INITIAL_POSTS.find((ip) => ip.id === p.id)
              return { ...p, slug: initial?.slug ?? String(p.id) }
            }),
          }
        }

        if (version < 2) {
          const posts: any[] = state.posts ?? []
          state = {
            ...state,
            posts: posts.map((p) => {
              if ((p.bodyHtml ?? '').includes('data-type="summary-list"')) return p
              const html = p.bodyHtml ?? (p.content?.length ? blocksToHtmlWithIds(p.content) : '')
              const summaryHtml = generateSummaryListHtml(html)
              const newHtml = insertSummaryListAfterIntro(html, summaryHtml)
              return newHtml !== html ? { ...p, bodyHtml: newHtml } : p
            }),
          }
        }

        if (version < 3) {
          const posts: any[] = state.posts ?? []
          state = {
            ...state,
            posts: posts.filter((p) => p.slug && p.slug.trim() !== '' && p.title && p.title.trim() !== ''),
          }
        }

        if (version < 4) {
          // Auth moved to Supabase Auth; drop legacy persisted isLoggedIn flag
          const { isLoggedIn: _drop, ...rest } = state ?? {}
          state = rest
        }

        if (version < 5) {
          // Storage migration rewrote thumbnail/body_html URLs (WP → Supabase).
          // Wipe persisted posts so the client re-reads them from the DB instead
          // of overlaying stale WordPress URLs on top of the fresh server data.
          state = { ...(state ?? {}), posts: INITIAL_POSTS }
        }

        if (version < 6) {
          // Seed posts were edited in lib/data.ts; persisted copies were
          // overriding the fresh static content on hydration. Re-seed so the
          // updated posts (e.g. the Q7 CSP/ESP guide) actually show.
          state = { ...(state ?? {}), posts: INITIAL_POSTS }
        }

        if (version < 7) {
          // More seed posts edited (Q7 6-month fuel-economy report). Re-seed
          // again so the refreshed content replaces the persisted copies.
          state = { ...(state ?? {}), posts: INITIAL_POSTS }
        }

        return state
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated()
      },
    }
  )
)
