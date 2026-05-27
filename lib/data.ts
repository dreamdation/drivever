import { Post, HeroSlide } from './types'

// These previously held 8 hardcoded demo posts (id 1–8) and 3 hero slides that
// referenced them. They were removed: posts are served from Supabase (SSR) and
// hero slides persist in the `hero_slides` table (configured via 히어로 관리).
//
// Why the seed posts had to go: a hardcoded post is re-created from this file on
// every load and the store never lets the DB override it, so trashing/editing a
// seed post never stuck across a refresh. With them gone, every post is fully
// DB-managed.
//
// These exports remain as empty fallbacks that the rest of the app references
// (e.g. SSR list builders, store seeding, slug lookup).

export const INITIAL_POSTS: Post[] = []

export const INITIAL_HERO: HeroSlide[] = []
