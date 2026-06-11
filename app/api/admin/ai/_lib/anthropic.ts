import Anthropic from '@anthropic-ai/sdk'
import { ApiKeyMissingError, type RunStructuredArgs } from './ai'

// Claude Sonnet — 비용 효율 우선(설계 결정). ANTHROPIC_MODEL로 교체 가능.
const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6'

let _client: Anthropic | null = null

function getAnthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new ApiKeyMissingError('anthropic', 'ANTHROPIC_API_KEY')
  _client ??= new Anthropic() // reads ANTHROPIC_API_KEY from env
  return _client
}

// web_search(server tool)로 리서치 → 마지막에 strict 커스텀 도구 1회 호출로
// 구조화 결과 제출.
//
// tool_choice를 특정 도구로 강제하면 web_search를 쓸 수 없으므로 auto로 두고,
// 시스템 프롬프트 + 사후 검증(미호출 시 재촉 2회)으로 호출을 보장한다.
// 서버 툴 루프가 반복 한도에 걸리면 stop_reason==='pause_turn' — 이어서 재요청.
//
// 프롬프트 캐싱: pause_turn 연속 호출은 직전 대화 전체를 그대로 재전송하므로
// top-level cache_control(자동 배치)로 반복분 입력 비용을 절감한다.
export async function runStructuredAnthropic<T>({ system, user, spec, maxTokens, maxSearches }: RunStructuredArgs): Promise<T> {
  const client = getAnthropic()

  const recordTool: Anthropic.Messages.Tool = {
    name: spec.name,
    description: spec.description,
    strict: true,
    input_schema: spec.schema as Anthropic.Messages.Tool['input_schema'],
  }

  const tools: Anthropic.Messages.ToolUnion[] = [
    { type: 'web_search_20260209', name: 'web_search', max_uses: maxSearches },
    recordTool,
  ]

  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: user }]
  let nudges = 0

  for (let i = 0; i < 8; i++) {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: maxTokens,
      system: `${system}\n\n출력 규칙: 리서치가 끝나면 ${spec.name} 도구를 정확히 1회 호출해 결과를 제출하라.`,
      thinking: { type: 'adaptive' },
      cache_control: { type: 'ephemeral' },
      tools,
      messages,
    })
    const msg = await stream.finalMessage()

    const toolUse = msg.content.find(
      (b): b is Anthropic.Messages.ToolUseBlock => b.type === 'tool_use' && b.name === spec.name
    )
    if (toolUse) return toolUse.input as T

    messages.push({ role: 'assistant', content: msg.content })

    if (msg.stop_reason === 'pause_turn') continue // 서버 툴 루프 계속 — 추가 user 턴 없이 재요청

    if (msg.stop_reason === 'end_turn' && nudges < 2) {
      nudges++
      messages.push({
        role: 'user',
        content: `지금 바로 ${spec.name} 도구를 호출해 최종 결과를 제출하세요. 추가 검색이나 설명 없이 도구 호출만 하세요.`,
      })
      continue
    }

    throw new Error(`AI 응답이 구조화 출력 없이 종료되었습니다 (stop_reason: ${msg.stop_reason}).`)
  }

  throw new Error('AI 구조화 출력을 받지 못했습니다. 잠시 후 다시 시도해주세요.')
}
