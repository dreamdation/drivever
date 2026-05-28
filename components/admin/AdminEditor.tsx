'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { ChevronLeft, Trash2, AlertTriangle } from 'lucide-react'
import { Post, ContentBlock } from '@/lib/types'
import { getCategoryColorFromName, toSlug } from '@/lib/utils'

const TiptapEditor = dynamic(() => import('./TiptapEditor'), { ssr: false })

const CATS = ['교통법규', 'Premium Garage', '안전운전', '차량관리']

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

function extractDescription(html: string): string {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!text) return ''
  return text.length > 150 ? text.slice(0, 150) + '…' : text
}

// First <img> in the body — used as the post thumbnail automatically.
function firstImageSrc(html: string): string {
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  return m ? m[1] : ''
}

interface AdminEditorProps {
  posts: Post[]
  editPost: Post | null
  onBack: () => void
  onSave: (posts: Post[]) => void | Promise<void>
  onTrash?: () => void | Promise<void>
}

export default function AdminEditor({ posts, editPost, onBack, onSave, onTrash }: AdminEditorProps) {
  const isNew = !editPost
  const [trashConfirm, setTrashConfirm] = useState(false)
  const [trashing,     setTrashing]     = useState(false)

  // Stable post ID for the whole editor session.
  // For new posts: generated once so uploads can be scoped to posts/{id}/ before first save.
  const [postId] = useState<number>(() => editPost?.id ?? Date.now())

  const [title, setTitle] = useState(editPost?.title ?? '')
  const [slug, setSlug] = useState(editPost?.slug ?? '')
  const [slugManual, setSlugManual] = useState(!!editPost?.slug)
  const [category, setCategory] = useState(editPost?.category ?? '교통법규')
  const [tags, setTags] = useState((editPost?.tags ?? []).join(', '))
  const [date, setDate] = useState(() => {
    if (!editPost?.date) return new Date().toISOString().slice(0, 16)
    const raw = editPost.date.replace(/\./g, '-').replace(' ', 'T')
    return raw.includes('T') ? raw.slice(0, 16) : `${raw}T00:00`
  })
  const [readTime, setReadTime] = useState(editPost?.readTime ?? 5)
  const [published, setPublished] = useState(editPost?.published !== false)
  const [thumbnail, setThumbnail] = useState(editPost?.thumbnail ?? '')
  const [saved, setSaved] = useState(false)

  const initialHtml = editPost?.bodyHtml ?? (editPost?.content?.length ? blocksToHtml(editPost.content) : '')
  const [bodyHtml, setBodyHtml] = useState(initialHtml)

  const description = extractDescription(bodyHtml)

  // Thumbnail: the body's top-most image is used automatically. A manual URL
  // (the optional override field) takes precedence when provided.
  const autoThumbnail = firstImageSrc(bodyHtml)
  const effectiveThumbnail = thumbnail.trim() || autoThumbnail

  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (!slugManual) setSlug(toSlug(val))
  }

  const handleSlugChange = (val: string) => {
    setSlug(val)
    setSlugManual(true)
  }

  const save = () => {
    const tagArr = tags.split(',').map((t) => t.trim()).filter(Boolean)
    const finalDate = date.replace('T', ' ').replace(/-/g, '.')
    const finalSlug = slug || toSlug(title)

    let updated: Post[]
    if (isNew) {
      const newPost: Post = {
        id: postId,
        slug: finalSlug,
        title, category,
        categoryColor: getCategoryColorFromName(category),
        description,
        tags: tagArr,
        readTime: Number(readTime),
        published,
        date: finalDate,
        content: [],
        bodyHtml,
        thumbnail: effectiveThumbnail || undefined,
      }
      updated = [newPost, ...posts]
    } else {
      updated = posts.map((p) =>
        p.id === editPost!.id
          ? { ...p, slug: finalSlug, title, category, categoryColor: getCategoryColorFromName(category), description, tags: tagArr, readTime: Number(readTime), published, date: finalDate, bodyHtml, thumbnail: effectiveThumbnail || undefined }
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
          {!isNew && onTrash && (
            <button
              onClick={() => setTrashConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-border rounded-[6px] bg-white text-sm text-[#aaa] hover:text-[#C0392B] hover:border-[#FFD0D0] transition-colors font-[inherit]"
              title="휴지통으로 이동"
            >
              <Trash2 size={13} />휴지통
            </button>
          )}
          <button
            onClick={save}
            className="px-5 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-[6px] border-none transition-colors font-[inherit]"
          >
            저장
          </button>
        </div>
      </div>

      {trashConfirm && onTrash && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => !trashing && setTrashConfirm(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            className="bg-white rounded-[10px] w-full max-w-[400px] p-6"
            style={{ boxShadow: '0 12px 32px rgba(0,0,0,0.2)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: '#FFF0F0', color: '#C0392B' }}
              >
                <AlertTriangle size={18} />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-bold text-fg mb-1">휴지통으로 이동할까요?</h4>
                <p className="text-sm text-fg-2 leading-relaxed">
                  포스트가 휴지통으로 이동되고 일반 사용자에게 더 이상 노출되지 않습니다.
                  휴지통에서 언제든 복원할 수 있습니다.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={trashing}
                onClick={() => setTrashConfirm(false)}
                className="px-4 py-2 border border-border rounded-[6px] bg-white text-sm text-fg-2 hover:bg-surface transition-colors font-[inherit] disabled:opacity-60"
              >
                취소
              </button>
              <button
                type="button"
                disabled={trashing}
                onClick={async () => {
                  setTrashing(true)
                  await onTrash()
                }}
                className="px-4 py-2 rounded-[6px] text-sm font-semibold text-white transition-colors font-[inherit] disabled:opacity-60"
                style={{ background: '#C0392B' }}
              >
                {trashing ? '이동 중...' : '휴지통으로 이동'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: '1fr 280px', minHeight: 'calc(100vh - 105px)' }}>
        {/* Main editor */}
        <div className="px-9 py-8 border-r border-border">
          <div className="max-w-[720px]">
            <textarea
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="제목을 입력하세요"
              rows={2}
              className="w-full border-none outline-none resize-none bg-transparent font-bold text-fg font-[inherit]"
              style={{ fontSize: '1.625rem', lineHeight: 1.3, letterSpacing: '-0.02em', marginBottom: '12px' }}
            />

            <div className="h-px bg-border my-6" />

            <TiptapEditor initialContent={initialHtml} onChange={setBodyHtml} postId={postId} />
          </div>
        </div>

        {/* Meta sidebar */}
        <div className="px-5 py-6 bg-surface overflow-y-auto" style={{ height: 'calc(100vh - 105px)' }}>
          <MetaField label="카테고리">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-2.5 py-2 border border-border rounded-[6px] text-sm bg-white outline-none font-[inherit]"
            >
              {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </MetaField>

          <MetaField label="썸네일">
            {effectiveThumbnail ? (
              <div className="rounded-[6px] overflow-hidden bg-[#F0F2F5]" style={{ aspectRatio: '16/9' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={effectiveThumbnail} alt="thumbnail" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.opacity = '0.2')} />
              </div>
            ) : (
              <div
                className="rounded-[6px] bg-[#F0F2F5] flex items-center justify-center text-center text-[11px] text-fg-3 leading-relaxed px-3"
                style={{ aspectRatio: '16/9' }}
              >
                본문에 이미지를 추가하면<br />자동으로 썸네일이 됩니다
              </div>
            )}
            <div className="text-[10px] text-fg-3 mt-1.5 leading-relaxed">
              {thumbnail.trim()
                ? '직접 지정한 URL을 썸네일로 사용 중입니다.'
                : autoThumbnail
                  ? '본문 최상단 이미지를 자동으로 사용 중입니다.'
                  : '본문 최상단 이미지가 자동으로 썸네일이 됩니다.'}
            </div>
            <input
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              placeholder="(선택) 직접 URL 지정 — 비우면 자동"
              className="w-full mt-2 px-2.5 py-2 border border-border rounded-[6px] text-sm outline-none font-[inherit]"
            />
          </MetaField>

          <MetaField label="작성일시">
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-2.5 py-2 border border-border rounded-[6px] text-sm outline-none font-[inherit]"
            />
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

          <MetaField label="URL 슬러그">
            <input
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="url-slug-here"
              className="w-full px-2.5 py-2 border border-border rounded-[6px] text-sm outline-none font-[inherit]"
              style={{ fontFamily: 'monospace' }}
            />
            <div className="text-[10px] text-fg-3 mt-1 truncate">drivever.kr/blog/{slug || '...'}</div>
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
