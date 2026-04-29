'use client'

import { useState } from 'react'
import { Plus, Pencil, ChevronUp, ChevronDown, Trash2, X } from 'lucide-react'
import { HeroSlide, Post } from '@/lib/types'

const GRADIENT_PRESETS = [
  { label: '다크 네이비', value: 'linear-gradient(135deg, #0a1628 0%, #162d4a 100%)' },
  { label: '다크 브라운', value: 'linear-gradient(135deg, #1a1008 0%, #2d1a08 100%)' },
  { label: '다크 그린',  value: 'linear-gradient(135deg, #0a1a10 0%, #1a3525 100%)' },
  { label: '다크 퍼플',  value: 'linear-gradient(135deg, #120a1a 0%, #251540 100%)' },
  { label: '딥 블루',    value: 'linear-gradient(135deg, #0d1b2a 0%, #0a3a6e 100%)' },
  { label: '딥 레드',    value: 'linear-gradient(135deg, #1a0808 0%, #3a1010 100%)' },
]

type SlideForm = { postId: string; category: string; title: string; description: string; bg: string; image: string }

function SlidePreview({ slide }: { slide: Partial<HeroSlide> }) {
  const bg = slide.image
    ? `url(${slide.image}) center/cover no-repeat`
    : slide.bg || '#0a1628'
  return (
    <div
      className="relative rounded-[8px] overflow-hidden shrink-0"
      style={{ width: '100%', aspectRatio: '16/7', background: bg }}
    >
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)' }} />
      <div className="absolute bottom-2.5 left-3 right-3">
        <span
          className="inline-block px-1.5 py-[1px] text-white text-[9px] font-bold rounded-sm mb-1"
          style={{ background: 'rgba(0,112,243,0.85)' }}
        >
          {slide.category}
        </span>
        <div className="text-[13px] font-bold text-white leading-tight mb-0.5 overflow-hidden text-ellipsis whitespace-nowrap">
          {slide.title}
        </div>
        <div className="text-[10px] overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {slide.description}
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
  const [form, setForm] = useState<SlideForm>({
    postId: '', category: '', title: '', description: '',
    bg: GRADIENT_PRESETS[0].value, image: '',
  })

  const published = posts.filter((p) => p.published !== false)

  const openNew = () => {
    setForm({ postId: '', category: '', title: '', description: '', bg: GRADIENT_PRESETS[0].value, image: '' })
    setEditingId(null)
    setShowForm(true)
  }

  const openEdit = (s: HeroSlide) => {
    setForm({
      postId: s.postId ? String(s.postId) : '',
      category: s.category, title: s.title, description: s.description,
      bg: s.bg ?? GRADIENT_PRESETS[0].value, image: s.image ?? '',
    })
    setEditingId(s.id)
    setShowForm(true)
  }

  const autoFill = (postId: string) => {
    const post = published.find((p) => p.id === Number(postId))
    if (post) {
      setForm((f) => ({
        ...f,
        postId,
        category:    post.category,
        title:       post.title,
        description: post.description,
        image:       post.thumbnail ?? f.image,   // thumbnail as default; manual URL overrides
      }))
    } else {
      setForm((f) => ({ ...f, postId }))
    }
  }

  const saveSlide = () => {
    const slide: HeroSlide = {
      id: editingId ?? Date.now(),
      postId: form.postId ? Number(form.postId) : undefined,
      category: form.category, title: form.title, description: form.description,
      bg: form.bg, image: form.image || undefined,
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
        {heroSlides.map((slide, i) => (
          <div key={slide.id} className="border border-border rounded-[10px] overflow-hidden bg-white">
            <div className="grid" style={{ gridTemplateColumns: '280px 1fr' }}>
              <div className="p-4 pr-0">
                <SlidePreview slide={slide} />
              </div>
              <div className="p-4 pl-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] font-bold text-fg-3" style={{ letterSpacing: '0.04em' }}>
                      슬라이드 {i + 1}
                    </span>
                    <span className="px-2 py-[2px] bg-accent-light text-accent rounded-sm text-[11px] font-semibold">
                      {slide.category}
                    </span>
                  </div>
                  <div className="text-base font-bold text-fg leading-snug mb-1.5">{slide.title}</div>
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
        ))}
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
            </MField>

            <MField label="카테고리 텍스트">
              <input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="교통법규" className="w-full px-2.5 py-2 border border-border rounded-[6px] text-sm outline-none" />
            </MField>
            <MField label="타이틀">
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="배너 제목" className="w-full px-2.5 py-2 border border-border rounded-[6px] text-sm outline-none" />
            </MField>
            <MField label="디스크립션">
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="배너 설명" className="w-full px-2.5 py-2 border border-border rounded-[6px] text-sm outline-none resize-y" />
            </MField>
            <MField label="배경 이미지 URL">
              <input value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} placeholder="포스트 선택 시 썸네일 자동 입력 — 직접 URL 입력 시 우선 적용" className="w-full px-2.5 py-2 border border-border rounded-[6px] text-sm outline-none" />
            </MField>
            <MField label="배경 그라디언트">
              <div className="grid grid-cols-3 gap-2 mt-2">
                {GRADIENT_PRESETS.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setForm((f) => ({ ...f, bg: g.value }))}
                    className="relative h-12 rounded-[6px] cursor-pointer overflow-hidden"
                    style={{ background: g.value, border: form.bg === g.value ? '2px solid #0070F3' : '2px solid transparent' }}
                  >
                    <span className="absolute bottom-1 left-1.5 text-[9px] font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>
                      {g.label}
                    </span>
                  </button>
                ))}
              </div>
            </MField>
            <MField label="미리보기">
              <SlidePreview slide={{ ...form, postId: form.postId ? Number(form.postId) : undefined }} />
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
