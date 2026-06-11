import { requireAdmin } from '../_lib/auth'
import { runStructured, ApiKeyMissingError, type StructuredSpec } from '../_lib/ai'
import { postToRow } from '@/lib/supabase'
import {
  toHeadingId, toSlug, generateSummaryListHtml, insertSummaryListAfterIntro,
  getCategoryColorFromName,
} from '@/lib/utils'
import type { Post } from '@/lib/types'
import type { Topic } from '../topics/route'
import type { SupabaseClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 300 // 리서치 + 장문 생성: 1~3분 소요

const CATS = ['교통법규', 'Premium Garage', '안전운전', '차량관리'] as const

interface DraftResult {
  title: string
  slug: string
  category: (typeof CATS)[number]
  tags: string[]
  intro: string
  bodyHtml: string
  sources: { title: string; url: string }[]
  youtube: { title: string; videoId: string }[]
  imagePrompt: { ko: string; en: string }
  readTimeMin: number
}

const RECORD_DRAFT: StructuredSpec = {
  name: 'record_draft',
  description: '완성된 블로그 글 초안.',
  schema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: '한국어 제목 (40~60자 내외, 핵심 키워드 포함)' },
      slug: { type: 'string', description: '영문 kebab-case URL 슬러그, 60자 이하 (예: audi-q7-winter-fuel-economy)' },
      category: { type: 'string', enum: [...CATS] },
      tags: { type: 'array', items: { type: 'string' }, description: '한국어 태그 3~6개' },
      intro: { type: 'string', description: '서론 1~2문단. <p>...</p> HTML. 글의 핵심 결론을 먼저 제시.' },
      bodyHtml: { type: 'string', description: '본문 HTML (h2/h3/p/lawbox/tipbox/ul/ol/table). 서론과 요약목록은 제외 — 서버가 합성한다.' },
      sources: {
        type: 'array',
        description: '웹검색으로 확인한 외부 출처 (법령·통계·기사). 본문 주장 근거.',
        items: {
          type: 'object',
          properties: { title: { type: 'string' }, url: { type: 'string' } },
          required: ['title', 'url'],
          additionalProperties: false,
        },
      },
      youtube: {
        type: 'array',
        description: '웹검색으로 실존 확인된 참고 유튜브 영상만. 불확실하면 빈 배열(영상 ID를 지어내지 말 것).',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            videoId: { type: 'string', description: '11자 유튜브 영상 ID' },
          },
          required: ['title', 'videoId'],
          additionalProperties: false,
        },
      },
      imagePrompt: {
        type: 'object',
        description: '상단 썸네일 생성용 이미지 프롬프트 (ChatGPT/DALL·E용)',
        properties: {
          ko: { type: 'string', description: '이미지 컨셉 한국어 설명' },
          en: { type: 'string', description: '실사용 영문 프롬프트. 16:9, no text in image, 한국 도로/차량 맥락' },
        },
        required: ['ko', 'en'],
        additionalProperties: false,
      },
      readTimeMin: { type: 'number', description: '예상 읽기 시간(분)' },
    },
    required: ['title', 'slug', 'category', 'tags', 'intro', 'bodyHtml', 'sources', 'youtube', 'imagePrompt', 'readTimeMin'],
    additionalProperties: false,
  },
}

const SYSTEM = `당신은 한국 자동차·교통 블로그 "Drivever"(drivever.kr)의 전속 작가다. 운영자는 2023년식 Audi Q7 55 TFSI 실소유 오너다.

주어진 주제로 블로그 글 한 편을 완성하라.

## 품질 기준 (AdSense·E-E-A-T — 매우 중요)
- 이 블로그는 AdSense 1차 심사에서 "가치 없는 콘텐츠"로 거절됐다. 어디서나 볼 수 있는 법령 요약 재탕은 금지. 독자가 "이 글에서만 얻는 것"이 분명해야 한다.
- 본문 분량 한국어 4,000자 이상. H2 3~6개, 필요 시 H3.
- 법조항·통계·수치는 web_search로 사실 확인하고 sources에 출처를 담아라. 2026년 기준 최신 정보로.
- 자연스러운 한국어. 번역투·AI 상투어("~에 대해 알아보겠습니다", "오늘은 ~를 소개합니다") 금지. 결론 먼저, 구체적 숫자, 단정할 수 없는 건 솔직하게.
- 과장·허위·клик베이트 금지.

## 본문 HTML 규격 (반드시 준수)
- 단락: <p>...</p> / 소제목: <h2>, <h3> (id 속성 불필요 — 서버가 부여)
- 법조항 인용: <div data-type="lawbox" data-ref="도로교통법 제44조">조문 내용 또는 해설</div>
- 실용 팁: <div data-type="tipbox">팁 내용</div>
- 표가 유용하면 <table> 사용 가능. 이미지 태그는 넣지 말 것(운영자가 직접 업로드).
- 교통법규를 다루면 글 말미에 다음 취지의 디스클레이머를 tipbox로: "본 글은 일반 정보이며, 적용 시점·사안에 따라 달라질 수 있으니 법령 원문과 관할 기관 안내를 확인하세요."

## 경험 주입 슬롯 (필수 2개)
운영자가 본인 경험·사진으로 채울 자리를 본문 중 가장 효과적인 위치 2곳에 다음 형식으로 삽입하라:
<div data-type="tipbox">📷 [경험 슬롯] 여기에 ○○○ 관련 본인 경험 1~2문단과 직접 촬영 사진을 추가하세요. (발행 전 반드시 교체 또는 삭제)</div>
○○○에는 그 위치에 어떤 경험/사진이 들어가면 좋을지 구체적으로 안내하라(예: "실제 주유 영수증과 계기판 연비 화면").

## 출력
완성되면 요구된 구조로 결과만 제출하라. intro에는 서론만, bodyHtml에는 본문만(서론 중복 금지).`

// ── 서버 측 bodyHtml 합성 ────────────────────────────────────────

function addHeadingIds(html: string): string {
  return html.replace(/<h([23])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi, (_m, level, attrs = '', inner) => {
    if (/\sid=/.test(attrs)) return _m
    const text = String(inner).replace(/<[^>]+>/g, '').trim()
    return `<h${level}${attrs} id="${toHeadingId(text)}">${inner}</h${level}>`
  })
}

function composeBodyHtml(d: DraftResult): string {
  let html = d.intro + addHeadingIds(d.bodyHtml)

  // 핵심 목록(헤딩 앵커 요약)을 서론 직후에 — 기존 글과 동일한 포맷
  const summary = generateSummaryListHtml(html)
  html = insertSummaryListAfterIntro(html, summary)

  if (d.youtube.length > 0) {
    const embeds = d.youtube
      .filter((y) => /^[A-Za-z0-9_-]{6,20}$/.test(y.videoId))
      .map((y) =>
        `<div data-type="video-embed" data-src="https://www.youtube.com/embed/${y.videoId}"><iframe src="https://www.youtube.com/embed/${y.videoId}" frameborder="0" allowfullscreen></iframe></div>`
      ).join('')
    if (embeds) html += `<h3 id="${toHeadingId('참고 영상')}">참고 영상</h3>${embeds}`
  }

  if (d.sources.length > 0) {
    const items = d.sources
      .filter((s) => /^https?:\/\//.test(s.url))
      .map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.title)}</a></li>`)
      .join('')
    if (items) html += `<h3 id="${toHeadingId('참고 자료')}">참고 자료</h3><ul>${items}</ul>`
  }

  return html
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function extractDescription(html: string): string {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return text.length > 150 ? text.slice(0, 150) + '…' : text
}

function sanitizeSlug(raw: string, title: string): string {
  const cleaned = raw.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-{2,}/g, '-').replace(/^-|-$/g, '').slice(0, 60)
  return cleaned || toSlug(title)
}

async function dedupeSlug(supabase: SupabaseClient, slug: string): Promise<string> {
  let candidate = slug
  for (let n = 2; n < 20; n++) {
    const { data } = await supabase.from('posts').select('id').eq('slug', candidate).maybeSingle()
    if (!data) return candidate
    candidate = `${slug}-${n}`
  }
  return `${slug}-${Date.now()}`
}

function nowDateString(): string {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000) // KST
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}.${p(d.getUTCMonth() + 1)}.${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`
}

// ── 라우트 ───────────────────────────────────────────────────────

export async function POST(req: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.res

  let topic: Topic
  try {
    const body = await req.json()
    topic = body.topic
    if (!topic?.title) throw new Error()
  } catch {
    return Response.json({ error: 'topic이 필요합니다.' }, { status: 400 })
  }

  const userPrompt = [
    `주제: ${topic.title}`,
    `카테고리: ${topic.category}`,
    `주제 유형: ${topic.angle}`,
    `선정 이유: ${topic.rationale}`,
    `SEO 키워드: ${topic.keywords?.join(', ') ?? ''}`,
    topic.recentRefs?.length
      ? `관련 최신 기사:\n${topic.recentRefs.map((r) => `- ${r.title} (${r.url})`).join('\n')}`
      : '',
    `오늘 날짜: ${new Date().toLocaleDateString('ko-KR')}`,
  ].filter(Boolean).join('\n')

  try {
    const draft = await runStructured<DraftResult>({
      system: SYSTEM,
      user: userPrompt,
      spec: RECORD_DRAFT,
      maxTokens: 24000,
      maxSearches: 6,
    })

    const bodyHtml = composeBodyHtml(draft)
    const slug = await dedupeSlug(auth.supabase, sanitizeSlug(draft.slug, draft.title))
    const category = CATS.includes(draft.category) ? draft.category : topic.category

    const post: Post = {
      id: Date.now(),
      slug,
      category,
      categoryColor: getCategoryColorFromName(category),
      published: false, // 임시저장 — 사람 검수 후 수동 발행 (AdSense 정책상 자동 발행 금지)
      isNew: true,
      title: draft.title,
      description: extractDescription(draft.intro),
      date: nowDateString(),
      readTime: Math.max(1, Math.round(draft.readTimeMin || 7)),
      tags: (draft.tags ?? []).slice(0, 6),
      views: 0,
      content: [],
      bodyHtml,
      deletedAt: null,
    }

    const { error } = await auth.supabase.from('posts').upsert(postToRow(post))
    if (error) {
      return Response.json({ error: `초안 저장 실패: ${error.message}` }, { status: 500 })
    }

    return Response.json({
      id: post.id,
      slug,
      title: post.title,
      imagePrompt: draft.imagePrompt,
    })
  } catch (e) {
    const status = e instanceof ApiKeyMissingError ? 503 : 500
    const message = e instanceof Error ? e.message : '글 생성에 실패했습니다.'
    return Response.json({ error: message }, { status })
  }
}
