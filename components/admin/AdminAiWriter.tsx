'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Search, Loader2, RefreshCw, Copy, Check, ExternalLink, PenLine, AlertTriangle, History, Trash2, FileCheck2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

const CATS = ['전체', '교통법규', 'Premium Garage', '안전운전', '차량관리']

const ANGLE_META: Record<string, { label: string; bg: string; color: string }> = {
  owner_tip:    { label: '오너 경험', bg: '#F3EEFF', color: '#7C3AED' },
  law:          { label: '법규 해설', bg: '#ECFDF5', color: '#059669' },
  recent_issue: { label: '최근 이슈', bg: '#FFFBEB', color: '#D97706' },
}

interface Topic {
  title: string
  category: string
  angle: string
  rationale: string
  keywords: string[]
  recentRefs: { title: string; url: string; date: string }[]
  usedPostId?: number   // draft 생성 후 서버가 기록 — '글 생성됨' 배지용
  usedAt?: string
}

// 저장된 주제 제안 묶음(1회 생성 = 1행) — ai_topic_batches 테이블
interface BatchRow {
  id: number
  created_at: string
  category: string
  keywords: string
  topics: Topic[]
}

function formatBatchDate(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

interface DraftDone {
  id: number
  slug: string
  title: string
  imagePrompt: { ko: string; en: string }
}

// 생성 중 진행 문구 (web_search 포함 호출은 1~3분 걸린다)
const PROGRESS_STEPS = [
  '주제 관련 최신 정보를 리서치하는 중…',
  '출처를 확인하고 본문 구조를 잡는 중…',
  '본문을 작성하는 중… (1~3분 소요)',
  '핵심 목록·출처·이미지 프롬프트를 정리하는 중…',
]

export default function AdminAiWriter() {
  const router = useRouter()

  const [category, setCategory] = useState('전체')
  const [keywords, setKeywords] = useState('')

  const [topicsLoading, setTopicsLoading] = useState(false)
  const [topics, setTopics] = useState<Topic[] | null>(null)
  const [activeBatchId, setActiveBatchId] = useState<number | null>(null)

  const [batches, setBatches] = useState<BatchRow[]>([])
  const [batchesLoading, setBatchesLoading] = useState(true)

  const [drafting, setDrafting] = useState<string | null>(null) // 생성 중인 topic.title
  const [progressIdx, setProgressIdx] = useState(0)
  const [done, setDone] = useState<DraftDone | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<'ko' | 'en' | null>(null)
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => { if (progressTimer.current) clearInterval(progressTimer.current) }, [])

  // 저장된 주제 묶음 목록 — 다시 열어도 토큰 소모 없음
  const loadBatches = async () => {
    const { data } = await supabase
      .from('ai_topic_batches')
      .select('id, created_at, category, keywords, topics')
      .order('created_at', { ascending: false })
      .limit(30)
    setBatches((data as BatchRow[]) ?? [])
    setBatchesLoading(false)
  }

  useEffect(() => { loadBatches() }, [])

  const viewBatch = (b: BatchRow) => {
    setError(null)
    setDone(null)
    setTopics(b.topics)
    setActiveBatchId(b.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteBatch = async (id: number) => {
    if (!window.confirm('이 주제 묶음을 삭제할까요? (이미 생성된 글에는 영향 없습니다)')) return
    await supabase.from('ai_topic_batches').delete().eq('id', id)
    if (activeBatchId === id) { setTopics(null); setActiveBatchId(null) }
    loadBatches()
  }

  const fetchTopics = async () => {
    setError(null)
    setTopics(null)
    setDone(null)
    setTopicsLoading(true)
    try {
      const res = await fetch('/api/admin/ai/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, keywords }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '주제 제안에 실패했습니다.')
      setTopics(data.topics ?? [])
      setActiveBatchId(data.batchId ?? null)
      loadBatches() // 방금 저장된 묶음을 목록에 반영
    } catch (e) {
      setError(e instanceof Error ? e.message : '주제 제안에 실패했습니다.')
    } finally {
      setTopicsLoading(false)
    }
  }

  const generateDraft = async (topic: Topic, topicIndex: number) => {
    setError(null)
    setDrafting(topic.title)
    setProgressIdx(0)
    progressTimer.current = setInterval(
      () => setProgressIdx((i) => Math.min(i + 1, PROGRESS_STEPS.length - 1)),
      20000,
    )
    try {
      const res = await fetch('/api/admin/ai/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, batchId: activeBatchId, topicIndex }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '글 생성에 실패했습니다.')
      setDone(data)
      // 화면의 카드에도 '글 생성됨' 즉시 반영 + 목록 카운트 갱신
      setTopics((prev) => prev?.map((t, i) => (i === topicIndex ? { ...t, usedPostId: data.id } : t)) ?? prev)
      loadBatches()
    } catch (e) {
      setError(e instanceof Error ? e.message : '글 생성에 실패했습니다.')
    } finally {
      if (progressTimer.current) clearInterval(progressTimer.current)
      setDrafting(null)
    }
  }

  const copyPrompt = async (which: 'ko' | 'en') => {
    if (!done) return
    try {
      await navigator.clipboard.writeText(done.imagePrompt[which])
      setCopied(which)
      setTimeout(() => setCopied(null), 1800)
    } catch { /* ignore */ }
  }

  // ── 생성 완료 화면 ──────────────────────────────────────────────
  if (done) {
    return (
      <div className="max-w-[760px] mx-auto px-8 py-10">
        <div className="flex items-center gap-2 mb-1">
          <Check size={20} className="text-success" />
          <h1 className="text-xl font-bold text-fg">초안이 임시저장되었습니다</h1>
        </div>
        <p className="text-sm text-fg-2 mb-6">
          에디터에서 검토·보완 후 직접 발행하세요. <b>경험 슬롯(📷)에 본인 경험과 사진을 채우는 것</b>이
          AdSense 차별화의 핵심입니다.
        </p>

        <div className="border border-border rounded-[10px] p-5 mb-4">
          <div className="text-[11px] font-bold text-fg-3 mb-1" style={{ letterSpacing: '0.05em' }}>생성된 글</div>
          <div className="text-base font-bold text-fg">{done.title}</div>
          <div className="text-xs text-fg-3 mt-1">/blog/{done.slug} · 상태: 임시저장</div>
        </div>

        <div className="border border-border rounded-[10px] p-5 mb-6">
          <div className="text-[11px] font-bold text-fg-3 mb-3" style={{ letterSpacing: '0.05em' }}>
            썸네일 이미지 프롬프트 (ChatGPT/DALL·E에 붙여넣기)
          </div>
          <p className="text-sm text-fg-2 mb-2">{done.imagePrompt.ko}</p>
          <div className="bg-surface border border-border rounded-[6px] p-3 text-[13px] text-fg-2 font-mono leading-relaxed mb-3 whitespace-pre-wrap">
            {done.imagePrompt.en}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => copyPrompt('en')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-[6px] bg-white text-xs font-semibold text-fg-2 hover:bg-surface transition-colors font-[inherit]"
            >
              {copied === 'en' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
              영문 프롬프트 복사
            </button>
            <button
              onClick={() => copyPrompt('ko')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-[6px] bg-white text-xs font-semibold text-fg-2 hover:bg-surface transition-colors font-[inherit]"
            >
              {copied === 'ko' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
              한국어 설명 복사
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/admin/editor?id=${done.id}&from=/admin/ai`)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-[6px] transition-colors font-[inherit]"
          >
            <PenLine size={14} />
            에디터에서 검토하기
          </button>
          <button
            onClick={() => { setDone(null); setTopics(null); setActiveBatchId(null) }}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-border rounded-[6px] bg-white text-sm text-fg-2 hover:bg-surface transition-colors font-[inherit]"
          >
            <RefreshCw size={14} />
            새 글 만들기
          </button>
        </div>
      </div>
    )
  }

  // ── 글 생성 중 화면 ─────────────────────────────────────────────
  if (drafting) {
    return (
      <div className="max-w-[760px] mx-auto px-8 py-24 text-center">
        <Loader2 size={32} className="text-accent mx-auto mb-4 animate-spin" />
        <h2 className="text-lg font-bold text-fg mb-1">글을 작성하고 있습니다</h2>
        <p className="text-sm font-medium text-accent mb-2">{PROGRESS_STEPS[progressIdx]}</p>
        <p className="text-xs text-fg-3 max-w-[420px] mx-auto leading-relaxed">
          주제: {drafting}
          <br />웹 리서치를 포함해 보통 1~3분 걸립니다. 화면을 닫지 마세요.
        </p>
      </div>
    )
  }

  // ── 1단계: 주제 받기 ────────────────────────────────────────────
  return (
    <div className="max-w-[920px] mx-auto px-8 py-10">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={20} className="text-accent" />
        <h1 className="text-xl font-bold text-fg">AI 글쓰기</h1>
      </div>
      <p className="text-sm text-fg-2 mb-6 leading-relaxed">
        Claude가 최신 이슈를 리서치해 주제를 제안하고, 선택한 주제로 SEO·E-E-A-T 기준에 맞는 초안을
        작성해 <b>임시저장</b>합니다. 발행은 검토 후 직접 — 자동 발행은 하지 않습니다.
      </p>

      {/* 조건 입력 */}
      <div className="border border-border rounded-[10px] p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr_auto] gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-fg-2 mb-1.5">카테고리</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-[6px] text-sm outline-none bg-white font-[inherit]"
            >
              {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-fg-2 mb-1.5">관심 키워드 (선택)</label>
            <input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="예: 겨울철 연비, 음주운전 단속, Q7 정비"
              className="w-full px-3 py-2 border border-border rounded-[6px] text-sm outline-none bg-white"
            />
          </div>
          <button
            onClick={fetchTopics}
            disabled={topicsLoading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-[6px] transition-colors font-[inherit] disabled:opacity-60 whitespace-nowrap"
          >
            {topicsLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            {topicsLoading ? '리서치 중…' : '주제 제안받기'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-[8px] mb-6 text-sm"
             style={{ background: '#FFF1F0', color: '#C0392B', border: '1px solid #FFD0D0' }}>
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {topicsLoading && (
        <div className="py-16 text-center text-fg-3">
          <Loader2 size={26} className="text-accent mx-auto mb-3 animate-spin" />
          <p className="text-sm">최신 이슈를 검색하며 주제를 고르는 중입니다… (30초~1분)</p>
        </div>
      )}

      {/* 주제 카드 */}
      {topics && topics.length > 0 && (
        <>
          <div className="text-xs font-bold text-fg-3 mb-3" style={{ letterSpacing: '0.05em' }}>
            제안된 주제 {topics.length}개 — 하나를 선택하면 초안을 생성합니다
            {(() => {
              const b = batches.find((x) => x.id === activeBatchId)
              return b ? ` · ${formatBatchDate(b.created_at)} 생성 묶음` : ''
            })()}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {topics.map((t, i) => {
              const angle = ANGLE_META[t.angle] ?? ANGLE_META.law
              return (
                <div key={i} className="border border-border rounded-[10px] p-4 flex flex-col gap-2.5 hover:border-accent transition-colors">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-block px-2 py-[2px] rounded-sm text-[10px] font-bold"
                          style={{ background: angle.bg, color: angle.color }}>
                      {angle.label}
                    </span>
                    <span className="text-[11px] text-fg-3">{t.category}</span>
                    {t.usedPostId && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-[2px] rounded-sm text-[10px] font-bold"
                            style={{ background: '#ECFDF5', color: '#059669' }}>
                        <FileCheck2 size={10} />글 생성됨
                      </span>
                    )}
                  </div>
                  <div className="text-[0.9375rem] font-bold text-fg leading-snug">{t.title}</div>
                  <p className="text-[13px] text-fg-2 leading-relaxed flex-1">{t.rationale}</p>
                  {t.keywords?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {t.keywords.slice(0, 5).map((k) => (
                        <span key={k} className="px-1.5 py-[1px] bg-surface border border-border rounded text-[10px] text-fg-3">{k}</span>
                      ))}
                    </div>
                  )}
                  {t.recentRefs?.length > 0 && (
                    <div className="flex flex-col gap-0.5">
                      {t.recentRefs.slice(0, 2).map((r, j) => (
                        <a key={j} href={r.url} target="_blank" rel="noopener noreferrer"
                           className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline truncate">
                          <ExternalLink size={10} className="shrink-0" />
                          <span className="truncate">{r.title}</span>
                        </a>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => generateDraft(t, i)}
                    className={
                      t.usedPostId
                        ? 'mt-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-border bg-white text-fg-2 hover:bg-surface text-[13px] font-semibold rounded-[6px] transition-colors font-[inherit]'
                        : 'mt-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-accent hover:bg-accent-hover text-white text-[13px] font-semibold rounded-[6px] transition-colors font-[inherit]'
                    }
                  >
                    <Sparkles size={13} />
                    {t.usedPostId ? '이미 생성됨 — 새로 또 생성' : '이 주제로 글 생성'}
                  </button>
                </div>
              )
            })}
          </div>
          <div className="mt-4">
            <button
              onClick={fetchTopics}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-border rounded-[6px] bg-white text-xs text-fg-2 hover:bg-surface transition-colors font-[inherit]"
            >
              <RefreshCw size={12} />
              다른 주제 제안받기
            </button>
          </div>
        </>
      )}

      {topics && topics.length === 0 && !topicsLoading && (
        <div className="py-12 text-center text-sm text-fg-3">제안된 주제가 없습니다. 키워드를 바꿔 다시 시도해보세요.</div>
      )}

      {/* 저장된 주제 묶음 — 다시 열어도 토큰 소모 없음 */}
      <div className="mt-10">
        <div className="flex items-center gap-1.5 mb-3">
          <History size={14} className="text-fg-3" />
          <span className="text-xs font-bold text-fg-3" style={{ letterSpacing: '0.05em' }}>
            저장된 주제 묶음 {batches.length > 0 ? `${batches.length}개` : ''} — 다시 열어도 토큰이 들지 않습니다
          </span>
        </div>

        {batchesLoading ? (
          <div className="py-6 text-center text-xs text-fg-3">불러오는 중…</div>
        ) : batches.length === 0 ? (
          <div className="border border-dashed border-border rounded-[10px] py-8 text-center text-xs text-fg-3">
            아직 저장된 묶음이 없습니다. &lsquo;주제 제안받기&rsquo;를 실행하면 결과가 자동 저장됩니다.
          </div>
        ) : (
          <div className="border border-border rounded-[10px] overflow-hidden">
            {batches.map((b, idx) => {
              const usedCount = b.topics.filter((t) => t.usedPostId).length
              const isActive = b.id === activeBatchId
              return (
                <div
                  key={b.id}
                  className={
                    'flex items-center gap-3 px-4 py-3' +
                    (idx > 0 ? ' border-t border-border' : '') +
                    (isActive ? ' bg-accent-light' : ' bg-white')
                  }
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-semibold text-fg">{formatBatchDate(b.created_at)}</span>
                      <span className="px-1.5 py-[1px] bg-surface border border-border rounded text-[10px] text-fg-2">
                        {b.category}
                      </span>
                      {b.keywords && (
                        <span className="text-[11px] text-fg-3 truncate max-w-[260px]">키워드: {b.keywords}</span>
                      )}
                    </div>
                    <div className="text-[11px] text-fg-3 mt-0.5">
                      주제 {b.topics.length}개 · 글 생성 {usedCount}개
                    </div>
                  </div>
                  <button
                    onClick={() => viewBatch(b)}
                    className={
                      isActive
                        ? 'shrink-0 px-3 py-1.5 rounded-[6px] bg-accent text-white text-xs font-semibold font-[inherit]'
                        : 'shrink-0 px-3 py-1.5 rounded-[6px] border border-border bg-white text-xs font-semibold text-fg-2 hover:border-accent hover:text-accent transition-colors font-[inherit]'
                    }
                  >
                    {isActive ? '보는 중' : '열기'}
                  </button>
                  <button
                    onClick={() => deleteBatch(b.id)}
                    aria-label="묶음 삭제"
                    className="shrink-0 w-8 h-8 inline-flex items-center justify-center rounded-[6px] border border-border bg-white text-[#aaa] hover:text-[#C0392B] hover:border-[#FFD0D0] transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
