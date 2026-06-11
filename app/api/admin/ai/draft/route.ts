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
      intro: { type: 'string', description: '서론 <p> 문단. 공백 포함 250~300자. <strong>드라이브에버(Drivever)</strong>를 한 번 볼드로 포함. 해요체+하십시오체 혼용.' },
      bodyHtml: { type: 'string', description: '본문 HTML (h2→h3 위계, p/lawbox/tipbox/ul/ol/table). h1 금지. 공백 포함 평균 3,000자·최대 5,000자. 마지막 <p>에 <strong>드라이브에버(Drivever)</strong> 볼드 포함. 서론·요약목록 제외(서버 합성).' },
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

const SYSTEM = `당신은 한국 자동차·교통 블로그 "드라이브에버(Drivever)"(drivever.kr)의 전속 작가다. 운영자는 2023년식 Audi Q7 55 TFSI 실소유 오너다.

주어진 주제로 블로그 글 한 편을 완성하라.

## 어조 (매우 중요 — 매번 일관되게)
- 정중한 구어체 '해요체'를 기본으로, 격식체 '하십시오체(다·나·까)'를 자연스럽게 섞어 쓴다.
- 다음과 같은 어미를 적극 활용: "~하죠?", "~텐데요", "~있습니다", "~겠습니다", "~보시죠", "~했나요?", "~인데요", "~거예요".
- 독자에게 말 거는 느낌으로 질문형("~헷갈리시죠?", "~궁금하지 않으세요?")을 군데군데 넣는다.
- 반말('~다', '~했다', '~이다'만 쓰는 평서체)로만 쓰지 말 것. 딱딱한 보고서 톤 금지.
- 번역투·AI 상투어("~에 대해 알아보겠습니다", "오늘은 ~를 소개합니다") 금지.

## 분량 (반드시 지킬 것)
- intro(서론): **공백 포함 250~300자**. 글을 여는 첫 문단.
- bodyHtml(본문): **공백 포함 평균 3,000자, 최대 5,000자를 절대 넘기지 말 것.** 장황하게 늘리지 말고 핵심만 밀도 있게.

## 서론·마무리 규칙 (필수)
- intro 서론 문단에 반드시 **<strong>드라이브에버(Drivever)</strong>** 를 자연스럽게 한 번 볼드로 넣는다.
- bodyHtml의 가장 마지막 문단도 글을 마무리하는 <p> 문단으로 끝맺고, 거기에도 반드시 **<strong>드라이브에버(Drivever)</strong>** 를 한 번 볼드로 넣는다(예: "앞으로도 드라이브에버(Drivever)가 ~ 전해드릴게요").

## 구조 / SEO (Google 기준)
- 글 제목(title)이 곧 H1이므로, **본문(bodyHtml) 안에는 절대 <h1>을 쓰지 말 것.**
- 본문 소제목은 <h2>를 메인 섹션(3~5개)으로, 그 하위 세부 항목은 <h3>로 위계를 만든다. (h2 없이 h3만 쓰지 말 것 — h2 → h3 순서 준수)
- 각 소제목에는 핵심 키워드를 자연스럽게 포함한다(키워드 스터핑 금지).
- 단락은 2~4문장으로 짧게 끊어 가독성을 확보한다.

## 품질 기준 (AdSense·E-E-A-T)
- 이 블로그는 AdSense 1차 심사에서 "가치 없는 콘텐츠"로 거절됐다. 어디서나 볼 수 있는 재탕 금지. 독자가 "이 글에서만 얻는 것"이 분명해야 한다.
- 법조항·통계·수치는 web_search로 사실 확인하고 sources에 출처를 담아라. 2026년 기준 최신 정보로. 단정할 수 없는 건 솔직하게.
- 과장·허위·클릭베이트 금지.

## 본문 HTML 규격 (반드시 준수)
- 단락: <p>...</p> / 소제목: <h2>, <h3> (id 속성 불필요 — 서버가 부여)
- 강조: <strong>...</strong>
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
  let batchId: number | null = null
  let topicIndex: number | null = null
  try {
    const body = await req.json()
    topic = body.topic
    if (!topic?.title) throw new Error()
    if (typeof body.batchId === 'number') batchId = body.batchId
    if (typeof body.topicIndex === 'number') topicIndex = body.topicIndex
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

    // 저장된 주제 묶음에 사용 흔적 기록(usedPostId/usedAt) — 중복 작성 방지 배지용.
    // 실패해도 글 생성 자체는 성공이므로 비치명.
    if (batchId !== null && topicIndex !== null) {
      try {
        const { data: batch } = await auth.supabase
          .from('ai_topic_batches').select('topics').eq('id', batchId).maybeSingle()
        const topics = (batch?.topics ?? null) as Topic[] | null
        if (topics?.[topicIndex]) {
          topics[topicIndex] = { ...topics[topicIndex], usedPostId: post.id, usedAt: new Date().toISOString() }
          await auth.supabase.from('ai_topic_batches').update({ topics }).eq('id', batchId)
        }
      } catch { /* non-fatal */ }
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
