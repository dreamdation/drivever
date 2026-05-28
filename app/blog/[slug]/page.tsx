import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { INITIAL_POSTS } from '@/lib/data'
import { supabase, rowToPost, PostRow } from '@/lib/supabase'
import { SITE_URL } from '@/lib/site'
import { Post } from '@/lib/types'
import ArticleClient from '@/components/article/ArticleClient'

export const dynamicParams = true

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  // Pre-render published, non-trashed posts at build time (seed is empty now —
  // posts live in Supabase). Falls back to the seed if the DB is unreachable.
  try {
    const { data } = await supabase
      .from('posts')
      .select('slug')
      .eq('published', true)
      .is('deleted_at', null)
    const slugs = (data ?? [])
      .map((r) => (r as { slug: string }).slug)
      .filter((s) => s && s.trim() !== '')
    if (slugs.length > 0) return slugs.map((slug) => ({ slug }))
  } catch { /* DB unavailable at build — fall through */ }
  return INITIAL_POSTS.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: rawSlug } = await params
  const slug = (() => {
    try { return decodeURIComponent(rawSlug) } catch { return rawSlug }
  })()
  const staticPost = INITIAL_POSTS.find((p) => p.slug === slug)

  const post = staticPost ?? await (async () => {
    const { data } = await supabase.from('posts').select('*').eq('slug', slug).single()
    return data ? rowToPost(data as PostRow) : null
  })()

  if (!post) return {}

  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    alternates: { canonical: `${SITE_URL}/blog/${encodeURIComponent(post.slug)}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url: `${SITE_URL}/blog/${encodeURIComponent(post.slug)}`,
      ...(post.thumbnail && { images: [{ url: post.thumbnail }] }),
      publishedTime: post.date.replace(/\./g, '-'),
      authors: ['Drivever 운영자'],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  }
}

function ArticleJsonLd({ post }: { post: Post }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date.replace(/\./g, '-'),
    dateModified: post.date.replace(/\./g, '-'),
    author: { '@type': 'Person', name: 'Drivever 운영자', url: `${SITE_URL}/about` },
    publisher: {
      '@type': 'Organization',
      name: 'Drivever',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/favicon-drivever-512.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${encodeURIComponent(post.slug)}` },
    keywords: post.tags.join(', '),
    articleSection: post.category,
    ...(post.thumbnail && { image: post.thumbnail }),
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export default async function ArticlePage({ params }: Props) {
  const { slug: rawSlug } = await params
  // Next.js may pass params already decoded or still encoded — normalise to be safe
  const slug = (() => {
    try { return decodeURIComponent(rawSlug) } catch { return rawSlug }
  })()

  // Candidate pool for the "관련 글" sidebar: all published posts (the seed array
  // is empty now that posts are DB-managed, so without this the pool — and thus
  // the related section — was always empty). Mirrors the home page's fetch.
  const { data: poolData } = await supabase.from('posts').select('*').eq('published', true)
  const seedIds = new Set(INITIAL_POSTS.map((p) => p.id))
  const allPosts = [
    ...INITIAL_POSTS,
    ...(poolData ?? []).map((r) => rowToPost(r as PostRow)).filter((p) => !seedIds.has(p.id)),
  ]

  const staticPost = INITIAL_POSTS.find((p) => p.slug === slug)

  if (staticPost) {
    return (
      <>
        <ArticleJsonLd post={staticPost} />
        <ArticleClient postId={staticPost.id} staticPost={staticPost} allStaticPosts={allPosts} />
      </>
    )
  }

  // Supabase fallback for admin-created posts — try slug first, then numeric ID
  let supaPost: PostRow | null = null
  const { data: bySlug } = await supabase.from('posts').select('*').eq('slug', slug).single()
  if (bySlug) {
    supaPost = bySlug as PostRow
  } else if (/^\d+$/.test(slug)) {
    const { data: byId } = await supabase.from('posts').select('*').eq('id', Number(slug)).single()
    if (byId) supaPost = byId as PostRow
  }

  if (!supaPost) notFound()
  const post = rowToPost(supaPost)

  return (
    <>
      <ArticleJsonLd post={post} />
      <ArticleClient postId={post.id} staticPost={post} allStaticPosts={allPosts} />
    </>
  )
}
