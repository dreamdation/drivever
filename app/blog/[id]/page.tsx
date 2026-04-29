import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { INITIAL_POSTS } from '@/lib/data'
import { supabase, rowToPost, PostRow } from '@/lib/supabase'
import ArticleClient from '@/components/article/ArticleClient'

export const dynamicParams = true

interface Props {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  return INITIAL_POSTS.map((p) => ({ id: String(p.id) }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const numId = Number(id)
  const staticPost = INITIAL_POSTS.find((p) => p.id === numId)

  const post = staticPost ?? await (async () => {
    const { data } = await supabase.from('posts').select('*').eq('id', numId).single()
    return data ? rowToPost(data as PostRow) : null
  })()

  if (!post) return {}

  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    alternates: { canonical: `https://drivever.com/blog/${post.id}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url: `https://drivever.com/blog/${post.id}`,
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

function ArticleJsonLd({ post }: { post: (typeof INITIAL_POSTS)[0] }) {
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
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://drivever.com/blog/${post.id}` },
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
  const { id } = await params
  const numId = Number(id)

  const staticPost = INITIAL_POSTS.find((p) => p.id === numId)

  if (staticPost) {
    return (
      <>
        <ArticleJsonLd post={staticPost} />
        <ArticleClient postId={numId} staticPost={staticPost} allStaticPosts={INITIAL_POSTS} />
      </>
    )
  }

  // Supabase fallback for admin-created posts
  const { data } = await supabase.from('posts').select('*').eq('id', numId).single()
  if (!data) notFound()

  const post = rowToPost(data as PostRow)

  return (
    <>
      <ArticleJsonLd post={post} />
      <ArticleClient postId={numId} staticPost={post} allStaticPosts={INITIAL_POSTS} />
    </>
  )
}
