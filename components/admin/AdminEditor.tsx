'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Post, ContentBlock } from '@/lib/types'
import { getCategoryColorFromName } from '@/lib/utils'

const TiptapEditor = dynamic(() => import('./TiptapEditor'), { ssr: false })

const CATS = ['교통법규', 'Premium Garage', '안전운전', '차량관리']

// Convert legacy ContentBlock[] to HTML for editing existing posts
function blocksToHtml(blocks: ContentBlock[]): string {
  return blocks.map((b) => {
    switch (b.type) {
      case 'h2': return `<h2>${b.text}</h2>`
      case 'h3': return `<h3>${b.text}</h3>`
      case 'lawbox': return `<div data-type="lawbox" data-ref="${b.ref ?? ''}">${b.text}</div>`
      case 'tipbox': return `<div data-type="tipbox">${b.text}</div>`
      default: return `<p>${b.text}</p>`
    }
  }).join('')
}

interface AdminEditorProps {
  posts: Post[]
  editPost: Post | null
  onBack: () => void
  onSave: (posts: Post[]) => void
}

export default function AdminEditor({ posts, editPost, onBack, onSave }: AdminEditorProps) {
  const isNew = !editPost

  const [title, setTitle] = useState(editPost?.title ?? '')
  const [category, setCategory] = useState(editPost?.category ?? '교통법규')
  const [description, setDescription] = useState(editPost?.description ?? '')
  const [tags, setTags] = useState((editPost?.tags ?? []).join(', '))
  const [readTime, setReadTime] = useState(editPost?.readTime ?? 5)
  const [published, setPublished] = useState(editPost?.published !== false)
  const [thumbnail, setThumbnail] = useState(editPost?.thumbnail ?? '')
  const [saved, setSaved] = useState(false)

  const initialHtml = editPost?.bodyHtml ?? (editPost?.content?.length ? blocksToHtml(editPost.content) : '')
  const [bodyHtml, setBodyHtml] = useState(initialHtml)

  const save = () => {
    const tagArr = tags.split(',').map((t) => t.trim()).filter(Boolean)
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '.')

    let updated: Post[]
    if (isNew) {
      const newPost: Post = {
        id: Date.now(),
        title, category,
        categoryColor: getCategoryColorFromName(category),
        description,
        tags: tagArr,
        readTime: Number(readTime),
        published,
        date: today,
        content: [],
        bodyHtml,
        thumbnail: thumbnail || undefined,
      }
      updated = [newPost, ...posts]
    } else {
      updated = posts.map((p) =>
        p.id === editPost!.id
          ? { ...p, title, category, categoryColor: getCategoryColorFromName(category), description, tags: tagArr, readTime: Number(readTime), published, bodyHtml, thumbnail: thumbnail || undefined }
          : p
      )
    }
    onSave(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="sticky top-0 z-20 flex items-center gap-3.5 px-6 py-3 border-b border-border bg-white">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-fg-2 bg-transparent border-none cursor-pointer font-[inherit]"
        >
          <ChevronLeft size={14} /> 목록
        </button>
        <span className="text-sm font-semibold text-fg">{isNew ? '새 글 작성' : '포스트 수정'}</span>
        <div className="flex items-center gap-2.5 ml-auto">
          {saved && <span className="text-xs text-success font-semibold">✓ 저장되었습니다</span>}
          <div className="flex items-center gap-2">
            <span className="text-xs text-fg-2">발행 상태</span>
            <button
              onClick={() => setPublished(!published)}
              className="relative w-10 h-[22px] rounded-full border-none cursor-pointer transition-colors duration-200"
              style={{ background: published ? '#0070F3' : '#D0D0D0' }}
            >
              <div
                className="absolute top-[3px] w-4 h-4 rounded-full bg-white transition-all duration-200"
                style={{ left: published ? '21px' : '3px' }}
              />
            </button>
            <span className="text-xs font-semibold" style={{ color: published ? '#059669' : '#888' }}>
              {published ? '발행' : '임시저장'}
            </span>
          </div>
          <button
            onClick={save}
            className="px-5 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-[6px] border-none transition-colors font-[inherit]"
          >
            저장
          </button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 280px', minHeight: 'calc(100vh - 105px)' }}>
        {/* Main editor */}
        <div className="px-9 py-8 border-r border-border">
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            rows={2}
            className="w-full border-none outline-none resize-none bg-transparent font-bold text-fg font-[inherit]"
            style={{ fontSize: '1.625rem', lineHeight: 1.3, letterSpacing: '-0.02em', marginBottom: '12px' }}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="요약 설명 (카드 및 메타 디스크립션에 사용됩니다)"
            rows={2}
            className="w-full border-none outline-none resize-none bg-transparent text-fg-2 font-[inherit] text-base"
            style={{ lineHeight: 1.6 }}
          />

          <div className="h-px bg-border my-6" />

          <TiptapEditor initialContent={initialHtml} onChange={setBodyHtml} />
        </div>

        {/* Meta sidebar */}
        <div className="px-5 py-6 bg-surface">
          <MetaField label="카테고리">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-2.5 py-2 border border-border rounded-[6px] text-sm bg-white outline-none font-[inherit]"
            >
              {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </MetaField>

          <MetaField label="썸네일 이미지 URL">
            <input
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-2.5 py-2 border border-border rounded-[6px] text-sm outline-none font-[inherit]"
            />
            {thumbnail && (
              <div className="mt-2 rounded-[6px] overflow-hidden bg-[#F0F2F5]" style={{ aspectRatio: '16/9' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbnail} alt="thumbnail" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.opacity = '0.2')} />
              </div>
            )}
          </MetaField>

          <MetaField label="읽는 시간 (분)">
            <input
              type="number" value={readTime} onChange={(e) => setReadTime(Number(e.target.value))}
              min="1" max="60"
              className="w-full px-2.5 py-2 border border-border rounded-[6px] text-sm outline-none font-[inherit]"
            />
          </MetaField>

          <MetaField label="태그 (쉼표로 구분)">
            <input
              value={tags} onChange={(e) => setTags(e.target.value)}
              placeholder="교통법규, 음주운전, 벌점"
              className="w-full px-2.5 py-2 border border-border rounded-[6px] text-sm outline-none font-[inherit]"
            />
          </MetaField>

          {/* Preview card */}
          <div className="mt-6">
            <div className="text-[11px] font-bold text-fg-3 mb-2" style={{ letterSpacing: '0.04em' }}>미리보기 카드</div>
            <div className="border border-border rounded-[8px] p-3.5 bg-white">
              <span className="inline-block px-1.5 py-[2px] bg-accent-light text-accent rounded-sm text-[10px] font-bold mb-1.5">
                {category}
              </span>
              <div className="text-sm font-bold text-fg leading-snug mb-1.5">{title || '제목 없음'}</div>
              <div className="text-[11px] text-[#888] leading-relaxed">{description || '설명이 없습니다.'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetaField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-[11px] font-bold text-fg-3 mb-1.5" style={{ letterSpacing: '0.04em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}
