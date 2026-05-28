'use client'

import { useMemo } from 'react'
import { useBlogStore } from '@/store/blogStore'
import { Post } from '@/lib/types'
import { compareByDateDesc } from '@/lib/utils'

// Resolves the post list for client pages with a single, shared policy:
// the SSR-provided list is authoritative; the Zustand store only contributes
// posts the server didn't return (e.g. an admin's in-session edits) and never
// overrides a server copy. Before hydration we just use the SSR list as-is.
export function useResolvedPosts(initialPosts: Post[]): Post[] {
  const { posts: storePosts, _hydrated } = useBlogStore()
  return useMemo(() => {
    if (!_hydrated) return initialPosts
    const initialIds = new Set(initialPosts.map((p) => p.id))
    return [...initialPosts, ...storePosts.filter((p) => !initialIds.has(p.id))].sort(compareByDateDesc)
  }, [initialPosts, storePosts, _hydrated])
}
