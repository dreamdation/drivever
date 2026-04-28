import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { INITIAL_POSTS } from '@/lib/data'
import ArticleClient from '@/components/article/ArticleClient'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  return INITIAL_POSTS.map((p) => ({ id: String(p.id) }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const post = INITIAL_POSTS.find((p) => p.id === Number(id))
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
  const staticPost = INITIAL_POSTS.find((p) => p.id === Number(id))
  if (!staticPost) notFound()

  return (
    <>
      <ArticleJsonLd post={staticPost} />
      <ArticleClient postId={Number(id)} staticPost={staticPost} allStaticPosts={INITIAL_POSTS} />
    </>
  )
}
