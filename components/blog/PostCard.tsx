'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Post } from '@/lib/types'
import { getCategoryStyle } from '@/lib/utils'

interface PostCardProps {
  post: Post
  compact?: boolean
}

export default function PostCard({ post, compact = false }: PostCardProps) {
  const [imgError, setImgError] = useState(false)
  const { id, category, categoryColor, title, description, date, readTime, isNew, published, thumbnail } = post
  const catStyle = getCategoryStyle(categoryColor)
  const showThumb = !!thumbnail && !imgError

  if (compact) {
    return (
      <Link
        href={`/blog/${id}`}
        className="flex items-center justify-between px-4 py-3.5 bg-white border border-border rounded-[8px] hover:border-accent transition-colors duration-150 group"
      >
        <div className="flex-1 text-left">
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="inline-flex items-center px-2 py-[2px] rounded-sm text-[11px] font-semibold"
              style={{ background: catStyle.bg, color: catStyle.text, letterSpacing: '0.02em' }}
            >
              {category}
            </span>
            {published === false && (
              <span className="inline-flex px-1.5 py-[2px] rounded-sm text-[10px] font-semibold bg-surface-hover text-fg-3">
                임시저장
              </span>
            )}
          </div>
          <div className="text-[0.9375rem] font-semibold text-fg leading-snug mb-1">{title}</div>
          <div className="text-[11px] text-[#aaa]">{date} · 읽는 시간 {readTime}분</div>
        </div>
        <svg className="text-[#ccc] shrink-0 ml-3" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </Link>
    )
  }

  return (
    <Link
      href={`/blog/${id}`}
      className="flex flex-col bg-white border border-border rounded-[8px] overflow-hidden hover:border-accent hover:shadow-card-hover transition-all duration-150 group"
    >
      {/* 16:9 Thumbnail */}
      <div
        className="overflow-hidden shrink-0"
        style={{ aspectRatio: '16/9', background: '#F0F2F5', margin: '-1px -1px 0' }}
      >
        {showThumb ? (
          <Image
            src={thumbnail!}
            alt={title}
            width={640} height={360}
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-[400ms]"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #F0F2F5 0%, #E5E8EF 100%)' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C8CDD8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
              <rect x="9" y="11" width="14" height="10" rx="2" ry="2" />
              <circle cx="12" cy="16" r="1" />
            </svg>
          </div>
        )}
      </div>

      {/* Text content */}
      <div className="flex flex-col flex-1 px-[18px] pt-4 pb-[18px]">
        <div className="flex items-center gap-1.5 mb-2.5">
          <span
            className="inline-flex items-center px-2 py-[2px] rounded-sm text-[11px] font-semibold"
            style={{ background: catStyle.bg, color: catStyle.text, letterSpacing: '0.02em' }}
          >
            {category}
          </span>
          {isNew && (
            <span className="inline-flex px-1.5 py-[2px] rounded-sm text-[10px] font-bold bg-accent text-white" style={{ letterSpacing: '0.04em' }}>
              NEW
            </span>
          )}
          {published === false && (
            <span className="inline-flex px-1.5 py-[2px] rounded-sm text-[10px] font-semibold bg-surface-hover text-fg-3">
              임시저장
            </span>
          )}
        </div>

        <div
          className="text-[0.9375rem] font-bold text-fg leading-snug mb-1.5"
          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {title}
        </div>

        <div
          className="text-sm text-[#666] leading-relaxed mb-3 flex-1"
          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {description}
        </div>

        <div className="flex gap-2.5 text-[11px] text-[#aaa]">
          <span>{date}</span>
          <span>읽는 시간 {readTime}분</span>
        </div>
      </div>
    </Link>
  )
}
