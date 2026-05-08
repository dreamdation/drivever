import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { INITIAL_POSTS } from '@/lib/data'
import { supabase, rowToPost, PostRow } from '@/lib/supabase'
import { Post } from '@/lib/types'
import ArticleClient from '@/components/article/ArticleClient'

export const dynamicParams = true

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
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
    alternates: { canonical: `https://drivever.com/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url: `https://drivever.com/blog/${post.slug}`,
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
    author: { '@type': 'Person', name: 'Drivever 운영자', url: 'https://drivever.com/about' },
    publisher: {
      '@type': 'Organization',
      name: 'Drivever',
      logo: { '@type': 'ImageObject', url: 'https://drivever.com/favicon-drivever-512.png' },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://drivever.com/blog/${post.slug}` },
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

  const staticPost = INITIAL_POSTS.find((p) => p.slug === slug)

  if (staticPost) {
    return (
      <>
        <ArticleJsonLd post={staticPost} />
        <ArticleClient postId={staticPost.id} staticPost={staticPost} allStaticPosts={INITIAL_POSTS} />
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
      <ArticleClient postId={post.id} staticPost={post} allStaticPosts={INITIAL_POSTS} />
    </>
  )
}
