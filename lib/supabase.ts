import { createClient } from '@supabase/supabase-js'
import type { Post, ContentBlock } from '@/lib/types'

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
}

export type CommentRow = {
  id:         number
  post_id:    number
  name:       string
  text:       string
  date:       string
  created_at: string
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
  }
}
