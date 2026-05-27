import { createClient } from '@supabase/supabase-js'
import type { Post, ContentBlock, HeroSlide } from '@/lib/types'

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── DB row type (snake_case) ────────────────────────────────────

export type PostRow = {
  id:             number
  slug:           string
  category:       string
  category_color: string
  published:      boolean
  is_new:         boolean
  title:          string
  description:    string
  date:           string
  read_time:      number
  tags:           string[]
  thumbnail:      string | null
  views:          number
  content:        ContentBlock[]
  body_html:      string | null
  created_at:     string
  updated_at:     string
  deleted_at:     string | null
}

export type CommentRow = {
  id:            number
  post_id:       number
  name:          string
  text:          string
  date:          string
  created_at:    string
  password_hash: string | null
  is_admin:      boolean
}

// ── Converters ──────────────────────────────────────────────────

export function postToRow(p: Post): Omit<PostRow, 'created_at' | 'updated_at'> {
  return {
    id:             p.id,
    slug:           p.slug,
    category:       p.category,
    category_color: p.categoryColor,
    published:      p.published ?? false,
    is_new:         p.isNew ?? false,
    title:          p.title,
    description:    p.description,
    date:           p.date,
    read_time:      p.readTime,
    tags:           p.tags,
    thumbnail:      p.thumbnail ?? null,
    views:          p.views ?? 0,
    content:        p.content,
    body_html:      p.bodyHtml ?? null,
    deleted_at:     p.deletedAt ?? null,
  }
}

export function rowToPost(r: PostRow): Post {
  return {
    id:            r.id,
    slug:          r.slug,
    category:      r.category,
    categoryColor: r.category_color as Post['categoryColor'],
    published:     r.published,
    isNew:         r.is_new,
    title:         r.title,
    description:   r.description,
    date:          r.date,
    readTime:      r.read_time,
    tags:          r.tags,
    thumbnail:     r.thumbnail ?? undefined,
    views:         r.views,
    content:       r.content,
    bodyHtml:      r.body_html ?? undefined,
    deletedAt:     r.deleted_at,
  }
}

// ── Hero slides (one row per slide in the hero_slides table) ────
// Hero config is shared, durable content — it lives in the DB (served by SSR),
// not in per-browser localStorage. `sort_order` preserves the slide order.

type HeroSlideRow = {
  id:          number
  post_id:     number | null
  category:    string
  title:       string
  description: string
  bg:          string | null
  image:       string | null
  sort_order:  number
}

function rowToHeroSlide(r: HeroSlideRow): HeroSlide {
  return {
    id:          r.id,
    postId:      r.post_id ?? undefined,
    category:    r.category,
    title:       r.title,
    description: r.description,
    bg:          r.bg ?? undefined,
    image:       r.image ?? undefined,
  }
}

// Returns slides ordered by sort_order, or null when there's no config yet
// (empty table or error) so callers fall back to the INITIAL_HERO seed.
export async function fetchHeroSlides(): Promise<HeroSlide[] | null> {
  const { data, error } = await supabase
    .from('hero_slides')
    .select('id, post_id, category, title, description, bg, image, sort_order')
    .order('sort_order', { ascending: true })
  if (error || !data || data.length === 0) return null
  return (data as HeroSlideRow[]).map(rowToHeroSlide)
}

// Full replace: upsert the current set (sort_order = display index), then delete
// rows that are no longer present. Upsert runs first so a failure never wipes data.
export async function saveHeroSlides(slides: HeroSlide[]): Promise<{ error: unknown }> {
  const rows = slides.map((s, i) => ({
    id:          s.id,
    post_id:     s.postId ?? null,
    category:    s.category,
    title:       s.title,
    description: s.description,
    bg:          s.bg ?? null,
    image:       s.image ?? null,
    sort_order:  i,
  }))

  if (rows.length > 0) {
    const { error } = await supabase.from('hero_slides').upsert(rows, { onConflict: 'id' })
    if (error) return { error }
  }

  const keepIds = slides.map((s) => s.id)
  const { error } = keepIds.length > 0
    ? await supabase.from('hero_slides').delete().not('id', 'in', `(${keepIds.join(',')})`)
    : await supabase.from('hero_slides').delete().not('id', 'is', null) // cleared all slides
  return { error: error ?? null }
}
