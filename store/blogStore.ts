'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Post, HeroSlide } from '@/lib/types'
import { INITIAL_POSTS, INITIAL_HERO } from '@/lib/data'

interface BlogStore {
  posts: Post[]
  heroSlides: HeroSlide[]
  isLoggedIn: boolean
  _hydrated: boolean
  setPosts: (posts: Post[]) => void
  setHeroSlides: (slides: HeroSlide[]) => void
  incrementViews: (id: number) => void
  login: () => void
  logout: () => void
  setHydrated: () => void
}

export const useBlogStore = create<BlogStore>()(
  persist(
    (set) => ({
      posts: INITIAL_POSTS,
      heroSlides: INITIAL_HERO,
      isLoggedIn: false,
      _hydrated: false,
      setPosts: (posts) => set({ posts }),
      setHeroSlides: (slides) => set({ heroSlides: slides }),
      incrementViews: (id) =>
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === id ? { ...p, views: (p.views ?? 0) + 1 } : p
          ),
        })),
      login: () => set({ isLoggedIn: true }),
      logout: () => set({ isLoggedIn: false }),
      setHydrated: () => set({ _hydrated: true }),
    }),
    {
      name: 'drivever-blog-store',
      version: 1,
      skipHydration: true,
      migrate: (persistedState: any, version: number) => {
        if (version < 1) {
          const posts: any[] = persistedState.posts ?? []
          return {
            ...persistedState,
            posts: posts.map((p) => {
              if (p.slug) return p
              const initial = INITIAL_POSTS.find((ip) => ip.id === p.id)
              return { ...p, slug: initial?.slug ?? String(p.id) }
            }),
          }
        }
        return persistedState
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated()
      },
    }
  )
)
