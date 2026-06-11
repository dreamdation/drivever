import { requireAdmin } from '../_lib/auth'
import { runStructured, ApiKeyMissingError, type StructuredSpec } from '../_lib/ai'

export const runtime = 'nodejs'
export const maxDuration = 300 // web_search 다회 호출 — Vercel fluid compute 기준

const CATS = ['교통법규', 'Premium Garage', '안전운전', '차량관리'] as const

export interface Topic {
  title: string
  category: (typeof CATS)[number]
  angle: 'owner_tip' | 'law' | 'recent_issue'
  rationale: string
  keywords: string[]
  recentRefs: { title: string; url: string; date: string }[]
}

const RECORD_TOPICS: StructuredSpec = {
  name: 'record_topics',
  description: '최종 블로그 주제 제안 목록. 6~8개.',
  schema: {
    type: 'object',
    properties: {
      topics: {
        type: 'array',
        description: '6~8개의 주제 제안',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string', description: '한국어 블로그 글 제목(클릭을 부르되 낚시성 금지)' },
            category: { type: 'string', enum: [...CATS] },
            angle: { type: 'string', enum: ['owner_tip', 'law', 'recent_issue'] },
            rationale: { type: 'string', description: '왜 지금 이 주제인지(검색수요/시의성) 1~2문장' },
            keywords: { type: 'array', items: { type: 'string' }, description: 'SEO 키워드 3~6개' },
            recentRefs: {
              type: 'array',
              description: 'angle이 recent_issue일 때 웹검색으로 확인한 근거 기사. 그 외에는 빈 배열.',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  url: { type: 'string' },
                  date: { type: 'string', description: 'YYYY-MM 형식' },
                },
                required: ['title', 'url', 'date'],
                additionalProperties: false,
              },
            },
          },
          required: ['title', 'category', 'angle', 'rationale', 'keywords', 'recentRefs'],
          additionalProperties: false,
        },
      },
    },
    required: ['topics'],
    additionalProperties: false,
  },
}

const SYSTEM = `당신은 한국 자동차·교통 블로그 "Drivever"(drivever.kr)의 콘텐츠 전략가다.

블로그 정체성:
- 2023년식 Audi Q7 55 TFSI를 실소유한 운영자가 직접 쓰는 블로그
- 3개 축: ① 아우디/Q7 실오너 운용기·팁 ② 한국 교통법규·교통규칙 해설 ③ 두 영역의 최근 이슈
- 차별화 무기는 "실제 경험"(영수증·계기판·실측 데이터). AdSense 1차 심사에서 '가치 없는 콘텐츠'로 거절된 적이 있어, 흔한 재탕 주제보다 독창적 각도가 중요하다.

임무: 지금 쓰기 좋은 블로그 주제 6~8개를 제안하라.

규칙:
- recent_issue 축은 반드시 web_search로 2026년 최신 사안(법 개정, 단속 정책, 리콜, 시장 이슈)을 확인하고 recentRefs에 실제 기사 출처를 첨부할 것. 검색으로 확인 안 된 이슈는 제안 금지.
- owner_tip 축은 실오너만 쓸 수 있는 1인칭 경험 주제로(예: 실유지비, 정비 견적, 실연비 측정).
- law 축은 운전자가 실제로 헷갈려하는 검색 수요 높은 질문형 주제로.
- 세 축이 골고루 섞이게 하라(각 축 최소 2개).
- 카테고리는 반드시 4종 중 하나로 매핑: ${CATS.join(', ')}.
- 리서치가 끝나면 요구된 구조로 결과만 제출하라. 장문 설명은 불필요.`

export async function POST(req: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.res

  let body: { category?: string; keywords?: string } = {}
  try { body = await req.json() } catch { /* empty body 허용 */ }

  const userParts = ['블로그 주제를 제안해줘.']
  if (body.category && body.category !== '전체') userParts.push(`카테고리 우선순위: ${body.category}`)
  if (body.keywords?.trim()) userParts.push(`관심 키워드: ${body.keywords.trim()}`)
  userParts.push(`오늘 날짜: ${new Date().toLocaleDateString('ko-KR')}`)

  try {
    const result = await runStructured<{ topics: Topic[] }>({
      system: SYSTEM,
      user: userParts.join('\n'),
      spec: RECORD_TOPICS,
      maxTokens: 8000,
      maxSearches: 4,
    })
    return Response.json(result)
  } catch (e) {
    const status = e instanceof ApiKeyMissingError ? 503 : 500
    const message = e instanceof Error ? e.message : '주제 제안에 실패했습니다.'
    return Response.json({ error: message }, { status })
  }
}
