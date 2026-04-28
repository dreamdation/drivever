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
      login: () => set({ isLoggedIn: true }),
      logout: () => set({ isLoggedIn: false }),
      setHydrated: () => set({ _hydrated: true }),
    }),
    {
      name: 'drivever-blog-store',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated()
      },
    }
  )
)
