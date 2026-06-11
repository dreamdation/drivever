// 프로바이더 중립 AI 호출 레이어.
//
// 라우트는 이 파일의 runStructured()만 사용한다 — OpenAI(GPT)와 Anthropic(Claude)
// 구현이 동일한 시그니처를 받으므로, 프로바이더 전환은 환경변수 한 줄이다:
//
//   AI_PROVIDER=openai     → OpenAI Responses API (web_search + json_schema)
//   AI_PROVIDER=anthropic  → Anthropic Messages API (web_search + strict tool_use)
//   (미설정 시: OPENAI_API_KEY가 있으면 openai, 아니면 anthropic)

import { runStructuredOpenAI } from './openai'
import { runStructuredAnthropic } from './anthropic'

/** 구조화 출력 사양 — 두 프로바이더 공통. schema는 strict 규격(JSON Schema,
 *  모든 필드 required + additionalProperties:false)을 따라야 한다. */
export interface StructuredSpec {
  name: string
  description: string
  schema: Record<string, unknown>
}

export interface RunStructuredArgs {
  system: string
  user: string
  spec: StructuredSpec
  maxTokens: number
  /** 웹검색 호출 상한(비용 가드). OpenAI는 상한 미지원이라 무시됨. */
  maxSearches: number
}

export class ApiKeyMissingError extends Error {
  constructor(provider: string, envName: string) {
    super(`${envName}가 설정되지 않았습니다 (AI 프로바이더: ${provider}). .env.local과 Vercel 환경변수에 키를 등록하세요.`)
  }
}

export type AiProvider = 'openai' | 'anthropic'

export function resolveProvider(): AiProvider {
  const explicit = process.env.AI_PROVIDER?.toLowerCase()
  if (explicit === 'openai' || explicit === 'anthropic') return explicit
  return process.env.OPENAI_API_KEY ? 'openai' : 'anthropic'
}

export async function runStructured<T>(args: RunStructuredArgs): Promise<T> {
  return resolveProvider() === 'openai'
    ? runStructuredOpenAI<T>(args)
    : runStructuredAnthropic<T>(args)
}
