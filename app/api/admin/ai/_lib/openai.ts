import OpenAI from 'openai'
import { ApiKeyMissingError, type RunStructuredArgs } from './ai'

// 기본 GPT-5.5 (2026-04 출시 플래그십). 글 품질이 AdSense 재심사의 핵심이라
// mini 대신 플래그십을 기본값으로 둔다. OPENAI_MODEL 환경변수로 교체 가능
// (예: 비용 절감 시 gpt-5.4-mini).
const MODEL = process.env.OPENAI_MODEL ?? 'gpt-5.5'

let _client: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!process.env.OPENAI_API_KEY) throw new ApiKeyMissingError('openai', 'OPENAI_API_KEY')
  _client ??= new OpenAI() // reads OPENAI_API_KEY from env
  return _client
}

// OpenAI Responses API: 내장 web_search 도구로 리서치(서버사이드 루프),
// text.format=json_schema(strict)로 최종 출력을 스키마에 강제한다.
// Anthropic 경로와 달리 도구 호출 트릭이 필요 없어 단일 호출로 끝난다.
// 프롬프트 캐싱은 OpenAI가 1,024토큰 이상 접두사를 자동 캐싱(설정 불필요).
export async function runStructuredOpenAI<T>({ system, user, spec, maxTokens }: RunStructuredArgs): Promise<T> {
  const client = getOpenAI()

  const resp = await client.responses.create({
    model: MODEL,
    instructions: system,
    input: user,
    tools: [{ type: 'web_search' }],
    text: {
      format: {
        type: 'json_schema',
        name: spec.name,
        description: spec.description,
        schema: spec.schema,
        strict: true,
      },
    },
    max_output_tokens: maxTokens,
  })

  if (resp.status === 'incomplete') {
    const reason = resp.incomplete_details?.reason ?? 'unknown'
    throw new Error(`AI 응답이 완료되지 못했습니다 (reason: ${reason}). max_output_tokens 또는 프롬프트를 조정해 다시 시도하세요.`)
  }

  const text = resp.output_text
  if (!text) throw new Error('AI가 빈 응답을 반환했습니다. 잠시 후 다시 시도해주세요.')

  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error('AI 응답 JSON 파싱에 실패했습니다. 다시 시도해주세요.')
  }
}
