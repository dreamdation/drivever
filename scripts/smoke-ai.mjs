#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * AI 글쓰기 기능 스모크 테스트 (1회용, 비용 수 센트).
 * OpenAI Responses API: 키 유효성 + 모델명 + web_search 도구 + json_schema strict 출력 검증.
 *
 * Usage: node scripts/smoke-ai.mjs
 */
import OpenAI from 'openai'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// .env.local 로더 (기존 마이그레이션 스크립트와 동일 패턴)
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
for (const line of readFileSync(join(ROOT, '.env.local'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.+?)\s*$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
}

const MODEL = process.env.OPENAI_MODEL ?? 'gpt-5.5'
const client = new OpenAI()

console.log(`[1/2] 모델 확인: ${MODEL}`)
try {
  await client.models.retrieve(MODEL)
  console.log('  → 모델 OK')
} catch (e) {
  console.error(`  ✗ 모델 "${MODEL}" 조회 실패: ${e.status} ${e.message}`)
  console.log('  사용 가능한 gpt-5 계열 모델:')
  const models = await client.models.list()
  for (const m of models.data) {
    if (m.id.startsWith('gpt-5')) console.log(`   - ${m.id}`)
  }
  process.exit(1)
}

console.log('[2/2] web_search + json_schema strict 출력 테스트 (30초 내외)…')
const t0 = Date.now()
const resp = await client.responses.create({
  model: MODEL,
  instructions: '웹검색으로 사실을 확인한 뒤, 요구된 JSON 구조로만 답하라.',
  input: '2026년 한국 자동차/교통 관련 최신 뉴스 1건을 웹검색으로 찾아 제목과 URL을 보고해.',
  tools: [{ type: 'web_search' }],
  text: {
    format: {
      type: 'json_schema',
      name: 'report',
      schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          url: { type: 'string' },
          searched: { type: 'boolean', description: '웹검색을 실제 수행했는지' },
        },
        required: ['title', 'url', 'searched'],
        additionalProperties: false,
      },
      strict: true,
    },
  },
  max_output_tokens: 4000,
})

console.log(`  status: ${resp.status} (${((Date.now() - t0) / 1000).toFixed(1)}s)`)
const usedSearch = resp.output?.some((o) => o.type === 'web_search_call')
console.log(`  web_search 호출됨: ${usedSearch ? 'YES' : 'NO'}`)
const parsed = JSON.parse(resp.output_text)
console.log('  구조화 출력:', parsed)
console.log(`  사용 토큰: in ${resp.usage?.input_tokens} / out ${resp.usage?.output_tokens}`)
console.log('\n✅ 스모크 테스트 통과 — 키·모델·웹검색·strict 스키마 모두 정상')
