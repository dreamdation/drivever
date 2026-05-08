export type CategoryColor = 'blue' | 'green' | 'purple'

export type ContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'lawbox'; text: string; ref: string }
  | { type: 'tipbox'; text: string }

export interface Post {
  id: number
  slug: string
  category: string
  categoryColor: CategoryColor
  published: boolean
  isNew?: boolean
  title: string
  description: string
  date: string
  readTime: number
  tags: string[]
  thumbnail?: string
  views?: number
  content: ContentBlock[]
  bodyHtml?: string
}

export interface HeroSlide {
  id: number
  postId?: number
  category: string
  title: string
  description: string
  bg?: string
  image?: string
}

export interface Comment {
  id: number
  name: string
  text: string
  date: string
}
