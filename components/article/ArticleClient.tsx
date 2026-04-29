'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft } from 'lucide-react'
import { useBlogStore } from '@/store/blogStore'
import LawBox from './LawBox'
import TipBox from './TipBox'
import TableOfContents from './TableOfContents'
import CommentsSection from './CommentsSection'
import AdSlot from '@/components/blog/AdSlot'
import PostCard from '@/components/blog/PostCard'
import Footer from '@/components/layout/Footer'
import { getCategoryStyle } from '@/lib/utils'
import { Post, ContentBlock } from '@/lib/types'

interface ArticleClientProps {
  postId: number
  staticPost: Post
  allStaticPosts: Post[]
}

export default function ArticleClient({ postId, staticPost, allStaticPosts }: ArticleClientProps) {
  const { posts: storePosts, _hydrated, incrementViews } = useBlogStore()
  const allPosts = _hydrated ? storePosts : allStaticPosts
  const post = allPosts.find((p) => p.id === postId) ?? staticPost

  const [activeId, setActiveId] = useState<string | null>(null)
  const catStyle = getCategoryStyle(post.categoryColor)
  const h2Count = useRef(0)

  const related = allPosts
    .filter((p) => p.id !== post.id && p.published !== false)
    .slice(0, 4)

  const hasToc = (post.content ?? []).some((b) => b.type === 'h2' || b.type === 'h3')

  // Increment view count once after store hydration
  useEffect(() => {
    if (!_hydrated) return
    incrementViews(postId)
  }, [_hydrated, postId, incrementViews])

  // Intersection Observer for active TOC section
  useEffect(() => {
    const headings = document.querySelectorAll('[data-toc-id]')
    if (!headings.length) return
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActiveId(e.target.id) })
      },
      { rootMargin: '-72px 0px -60% 0px' }
    )
    headings.forEach((h) => obs.observe(h))
    return () => obs.disconnect()
  }, [post.id])

  h2Count.current = 0
  const renderBlock = (block: ContentBlock, i: number) => {
    switch (block.type) {
      case 'h2':
        h2Count.current++
        return (
          <div key={i}>
            {h2Count.current > 1 && <AdSlot size="leaderboard" label="광고 영역 — 본문 섹션 사이" />}
            <h2 id={`toc-${i}`} data-toc-id="true" className="text-[1.375rem] font-bold text-fg mt-2 scroll-mt-[80px]" style={{ letterSpacing: '-0.02em' }}>
              {block.text}
            </h2>
          </div>
        )
      case 'h3':
        return (
          <h3 key={i} id={`toc-${i}`} data-toc-id="true" className="text-md font-bold text-fg mt-6 mb-2 scroll-mt-[80px]" style={{ letterSpacing: '-0.01em' }}>
            {block.text}
          </h3>
        )
      case 'lawbox':
        return <LawBox key={i} lawRef={block.ref}>{block.text}</LawBox>
      case 'tipbox':
        return <TipBox key={i}>{block.text}</TipBox>
      default:
        return (
          <p key={i} className="text-base text-[#333] leading-[1.75] mt-3.5" style={{ letterSpacing: '-0.01em' }}>
            {block.text}
          </p>
        )
    }
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1080px] mx-auto px-4 md:px-6 py-5 md:py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2.5 mb-6">
          <Link href="/" className="flex items-center gap-1 text-sm text-fg-2 hover:text-accent transition-colors">
            <ChevronLeft size={13} />
            목록으로
          </Link>
          <span className="text-[#ddd]">·</span>
          <span className="text-sm font-medium text-accent">{post.category}</span>
        </div>

        {/* Hero image */}
        {post.thumbnail && (
          <div className="rounded-[10px] overflow-hidden mb-7 bg-[#F0F2F5]" style={{ aspectRatio: '21/9' }}>
            <Image
              src={post.thumbnail}
              alt={post.title}
              width={1080} height={460}
              className="w-full h-full object-cover"
              priority
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-0">
          {/* ── Main article ── */}
          <main className="lg:pr-14">
            <span
              className="inline-flex px-2 py-[2px] rounded-sm text-[11px] font-semibold mb-3"
              style={{ background: catStyle.bg, color: catStyle.text, letterSpacing: '0.02em' }}
            >
              {post.category}
            </span>

            <h1
              className="font-bold text-fg leading-snug mb-3 text-pretty"
              style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.025em' }}
            >
              {post.title}
            </h1>

            <div className="flex items-center gap-2 text-[13px] text-[#aaa] mb-5">
              <span>{post.date}</span>
              <span className="text-[#ddd]">·</span>
              <span>읽는 시간 {post.readTime}분</span>
            </div>

            {/* Mobile TOC */}
            {hasToc && (
              <div className="lg:hidden mb-5">
                <TableOfContents content={post.content} activeId={activeId} />
              </div>
            )}

            <div className="h-px bg-border my-6" />

            {/* Lead */}
            <p
              className="text-base font-medium text-[#333] leading-[1.75] mb-0"
              style={{ letterSpacing: '-0.01em' }}
            >
              {post.description}
            </p>

            {/* Top ad */}
            <AdSlot size="leaderboard" label="광고 영역 — 본문 상단" />

            {/* bodyHtml (Tiptap) takes priority; falls back to legacy ContentBlock[] */}
            {post.bodyHtml ? (
              <article className="article-body" dangerouslySetInnerHTML={{ __html: post.bodyHtml }} />
            ) : (
              <article className="article-body">
                {(post.content ?? []).map((block, i) => renderBlock(block, i))}
              </article>
            )}

            {/* Tags */}
            {post.tags?.length > 0 && (
              <>
                <div className="h-px bg-border my-6" />
                <div className="flex flex-wrap items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-px">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                  {post.tags.map((tag) => (
                    <span key={tag} className="px-2.5 py-1 border border-border rounded-full text-xs text-fg-2">
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            )}

            {/* Bottom ad */}
            <AdSlot size="leaderboard" label="광고 영역 — 본문 하단" />

            {/* Comments */}
            <CommentsSection postId={post.id} />

            {/* Mobile related posts */}
            {related.length > 0 && (
              <div className="lg:hidden mt-9">
                <div className="text-xs font-bold text-fg-3 mb-3" style={{ letterSpacing: '0.05em' }}>관련 글</div>
                <div className="flex flex-col gap-2">
                  {related.slice(0, 3).map((p) => (
                    <PostCard key={p.id} post={p} compact />
                  ))}
                </div>
              </div>
            )}
          </main>

          {/* ── Sidebar (desktop) ── */}
          <aside className="hidden lg:block" style={{ position: 'sticky', top: '72px', alignSelf: 'flex-start' }}>
            {hasToc && <TableOfContents content={post.content} activeId={activeId} />}
            <AdSlot size="rectangle" label="광고 영역 — 300×250" />
            <div className="bg-surface border border-border rounded-[8px] p-[18px] mt-4">
              <div className="text-[11px] font-bold text-fg-3 mb-3" style={{ letterSpacing: '0.05em' }}>관련 글</div>
              <div className="flex flex-col gap-2">
                {related.map((p) => (
                  <Link
                    key={p.id}
                    href={`/blog/${p.id}`}
                    className="block bg-white border border-border rounded-[6px] px-3 py-2.5 hover:border-accent transition-colors"
                  >
                    <div className="text-sm font-semibold text-fg leading-snug mb-0.5">{p.title}</div>
                    <div className="text-[11px] text-[#aaa]">{p.category} · {p.date}</div>
                  </Link>
                ))}
              </div>
            </div>
            <div className="mt-4"><AdSlot size="rectangle" label="광고 영역 — 사이드바 하단" /></div>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  )
}
