'use client'

import { useState } from 'react'
import { Plus, Pencil, ChevronUp, ChevronDown, Trash2, X } from 'lucide-react'
import { HeroSlide, Post } from '@/lib/types'
import { getCategoryStyle } from '@/lib/utils'

type SlideForm = { postId: string; title: string; description: string; image: string }

function SlidePreview({ image, title, description, category, catColor }: {
  image?: string
  title?: string
  description?: string
  category?: string
  catColor?: string
}) {
  const bg = image
    ? `url(${image}) center/cover no-repeat`
    : 'linear-gradient(135deg, #0a1628 0%, #162d4a 100%)'
  return (
    <div
      className="relative rounded-[8px] overflow-hidden shrink-0"
      style={{ width: '100%', aspectRatio: '16/7', background: bg }}
    >
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)' }} />
      <div className="absolute bottom-2.5 left-3 right-3">
        {category && (
          <span
            className="inline-block px-1.5 py-[1px] text-white text-[9px] font-bold rounded-sm mb-1"
            style={{ background: catColor ?? '#0070F3' }}
          >
            {category}
          </span>
        )}
        <div className="text-[13px] font-bold text-white leading-tight mb-0.5" style={{ whiteSpace: 'pre-line', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {title}
        </div>
        <div className="text-[10px] overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {description}
        </div>
      </div>
    </div>
  )
}

interface AdminHeroManagerProps {
  posts: Post[]
  heroSlides: HeroSlide[]
  onSave: (slides: HeroSlide[]) => void
}

export default function AdminHeroManager({ posts, heroSlides, onSave }: AdminHeroManagerProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<SlideForm>({ postId: '', title: '', description: '', image: '' })

  const published = posts.filter((p) => p.published !== false)

  // Category text + color are derived from the connected post (no manual input).
  const catTextOf  = (postId?: number) => posts.find((p) => p.id === postId)?.category
  const catColorOf = (postId?: number) =>
    getCategoryStyle(posts.find((p) => p.id === postId)?.categoryColor ?? 'blue').text

  // Connected post's thumbnail, used as the slide background when no manual URL.
  const thumbOf = (postId?: number) => (postId ? posts.find((p) => p.id === postId)?.thumbnail : undefined)
  const resolveImage = (s: { image?: string; postId?: number }) =>
    (s.image && s.image.trim()) ? s.image : thumbOf(s.postId)

  const openNew = () => {
    setForm({ postId: '', title: '', description: '', image: '' })
    setEditingId(null)
    setShowForm(true)
  }

  const openEdit = (s: HeroSlide) => {
    setForm({
      postId: s.postId ? String(s.postId) : '',
      title: s.title, description: s.description,
      image: s.image ?? '',
    })
    setEditingId(s.id)
    setShowForm(true)
  }

  const autoFill = (postId: string) => {
    const post = published.find((p) => p.id === Number(postId))
    if (post) {
      // Title/description are pre-filled (still editable); category is derived
      // from the post automatically, so it isn't part of the form.
      setForm((f) => ({ ...f, postId, title: post.title, description: post.description }))
    } else {
      setForm((f) => ({ ...f, postId }))
    }
  }

  const saveSlide = () => {
    const pid = form.postId ? Number(form.postId) : undefined
    const slide: HeroSlide = {
      id: editingId ?? Date.now(),
      postId: pid,
      category: catTextOf(pid) ?? '',   // auto from the connected post
      title: form.title,
      description: form.description,
      image: form.image || undefined,
    }
    const updated = editingId !== null
      ? heroSlides.map((s) => (s.id === editingId ? slide : s))
      : [...heroSlides, slide]
    onSave(updated)
    setShowForm(false)
  }

  const deleteSlide = (id: number) => {
    if (!confirm('이 슬라이드를 삭제하시겠습니까?')) return
    onSave(heroSlides.filter((s) => s.id !== id))
  }

  const moveSlide = (id: number, dir: -1 | 1) => {
    const idx = heroSlides.findIndex((s) => s.id === id)
    const arr = [...heroSlides]
    const swap = idx + dir
    if (swap < 0 || swap >= arr.length) return
    ;[arr[idx], arr[swap]] = [arr[swap], arr[idx]]
    onSave(arr)
  }

  return (
    <div className="p-8 max-w-[860px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-[1.375rem] font-bold text-fg mb-1">히어로 슬라이드 관리</h1>
          <p className="text-sm text-fg-3">메인 페이지 상단 롤링 배너. 현재 {heroSlides.length}개 슬라이드.</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-[6px] border-none transition-colors font-[inherit]"
        >
          <Plus size={14} strokeWidth={2.5} /> 슬라이드 추가
        </button>
      </div>

      {/* Slide list */}
      <div className="flex flex-col gap-4 mb-8">
        {heroSlides.map((slide, i) => {
          const catText = catTextOf(slide.postId) ?? slide.category
          const catColor = catColorOf(slide.postId)
          return (
            <div key={slide.id} className="border border-border rounded-[10px] overflow-hidden bg-white">
              <div className="grid" style={{ gridTemplateColumns: '280px 1fr' }}>
                <div className="p-4 pr-0">
                  <SlidePreview
                    image={resolveImage(slide)}
                    title={slide.title}
                    description={slide.description}
                    category={catText}
                    catColor={catColor}
                  />
                </div>
                <div className="p-4 pl-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-bold text-fg-3" style={{ letterSpacing: '0.04em' }}>
                        슬라이드 {i + 1}
                      </span>
                      {catText && (
                        <span
                          className="px-2 py-[2px] rounded-sm text-[11px] font-semibold"
                          style={{ background: `${catColor}18`, color: catColor }}
                        >
                          {catText}
                        </span>
                      )}
                    </div>
                    <div className="text-base font-bold text-fg leading-snug mb-1.5" style={{ whiteSpace: 'pre-line' }}>{slide.title}</div>
                    <div className="text-sm text-fg-2 leading-relaxed">{slide.description}</div>
                    {slide.postId && (
                      <div className="mt-2 text-[11px] text-[#aaa]">
                        연결된 포스트: {published.find((p) => p.id === slide.postId)?.title ?? '(삭제된 포스트)'}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => openEdit(slide)} className="inline-flex items-center gap-1 px-2.5 py-[5px] border border-border rounded-[5px] bg-white text-xs text-fg-2 hover:text-accent transition-colors font-[inherit]">
                      <Pencil size={12} /> 편집
                    </button>
                    <button onClick={() => moveSlide(slide.id, -1)} disabled={i === 0} className="inline-flex items-center gap-1 px-2.5 py-[5px] border border-border rounded-[5px] bg-white text-xs text-fg-2 disabled:opacity-30 font-[inherit]">
                      <ChevronUp size={12} /> 위로
                    </button>
                    <button onClick={() => moveSlide(slide.id, 1)} disabled={i === heroSlides.length - 1} className="inline-flex items-center gap-1 px-2.5 py-[5px] border border-border rounded-[5px] bg-white text-xs text-fg-2 disabled:opacity-30 font-[inherit]">
                      <ChevronDown size={12} /> 아래로
                    </button>
                    <button onClick={() => deleteSlide(slide.id)} className="inline-flex items-center gap-1 px-2.5 py-[5px] border border-[#FFD0D0] rounded-[5px] bg-white text-xs transition-colors font-[inherit]" style={{ color: '#C0392B' }}>
                      <Trash2 size={12} /> 삭제
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        {heroSlides.length === 0 && (
          <div className="py-16 text-center text-fg-3 text-sm border border-dashed border-border rounded-[8px]">
            슬라이드가 없습니다. 슬라이드를 추가해주세요.
          </div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.3)' }}
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <div
            className="bg-white rounded-xl p-7 w-[560px] max-h-[80vh] overflow-y-auto"
            style={{ boxShadow: '0 20px 48px rgba(0,0,0,0.15)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-md font-bold text-fg">{editingId ? '슬라이드 편집' : '새 슬라이드 추가'}</h2>
              <button onClick={() => setShowForm(false)} className="text-[#aaa] hover:text-fg bg-transparent border-none cursor-pointer"><X size={18} /></button>
            </div>

            <MField label="연결할 포스트 (선택)">
              <select
                value={form.postId}
                onChange={(e) => autoFill(e.target.value)}
                className="w-full px-2.5 py-2 border border-border rounded-[6px] text-sm bg-white outline-none font-[inherit]"
              >
                <option value="">— 직접 입력 —</option>
                {published.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
              <div className="text-[10px] text-fg-3 mt-1 leading-relaxed">
                {form.postId
                  ? `카테고리는 연결된 포스트(${catTextOf(Number(form.postId)) ?? '-'})에서 자동 적용됩니다.`
                  : '포스트를 연결하면 카테고리가 자동으로 적용됩니다.'}
              </div>
            </MField>

            <MField label="타이틀 (엔터로 줄바꿈)">
              <textarea value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} rows={2} placeholder={"배너 제목\n줄바꿈 원하는 위치에서 엔터"} className="w-full px-2.5 py-2 border border-border rounded-[6px] text-sm outline-none resize-none font-[inherit]" style={{ whiteSpace: 'pre-line' }} />
            </MField>
            <MField label="디스크립션">
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="배너 설명" className="w-full px-2.5 py-2 border border-border rounded-[6px] text-sm outline-none resize-y" />
            </MField>
            <MField label="배경 이미지 URL">
              <input value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} placeholder="비워두면 연결된 포스트의 썸네일이 자동 사용됩니다" className="w-full px-2.5 py-2 border border-border rounded-[6px] text-sm outline-none" />
              <div className="text-[10px] text-fg-3 mt-1 leading-relaxed">
                {(form.image && form.image.trim())
                  ? '입력한 URL 이미지가 사용됩니다.'
                  : thumbOf(form.postId ? Number(form.postId) : undefined)
                    ? '연결된 포스트의 썸네일이 자동으로 사용됩니다.'
                    : '비워두면 기본 배경이 사용됩니다.'}
              </div>
            </MField>

            <MField label="미리보기">
              <SlidePreview
                image={resolveImage({ image: form.image, postId: form.postId ? Number(form.postId) : undefined })}
                title={form.title}
                description={form.description}
                category={catTextOf(form.postId ? Number(form.postId) : undefined)}
                catColor={catColorOf(form.postId ? Number(form.postId) : undefined)}
              />
            </MField>

            <div className="flex gap-2.5 justify-end mt-2">
              <button onClick={() => setShowForm(false)} className="px-5 py-2 border border-border rounded-[6px] bg-white text-sm text-fg-2 cursor-pointer font-[inherit]">취소</button>
              <button onClick={saveSlide} className="px-5 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-[6px] border-none transition-colors font-[inherit]">저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-[11px] font-bold text-fg-3 mb-1.5" style={{ letterSpacing: '0.04em' }}>{label}</label>
      {children}
    </div>
  )
}
