# AI 자동 포스트 생성 기능 — 제작 사양서

> Drivever 블로그 어드민에 Claude API 기반 "AI 글쓰기" 기능을 추가하기 위한 구현 사양.
> 작성일: 2026-05-29 · 대상 브랜치: `dev-drivever`

---

## 0. 목표 (요구사항 원문 기준)

1. **주제 제안** — 블로그에 어울리는 주제 자동 제안
   - 아우디 차량 및 Q7 관련 운용기·팁
   - 한국의 교통법규·교통규칙
   - 위 두 영역의 **최근 이슈** (→ Claude `web_search`로 실시간 반영)
2. **글 작성** — 선택한 주제로, 블로그 형식 + 구글 SEO / AdSense 승인 기준에 맞는 글 생성
3. **에디터 임시저장** — 생성 결과를 에디터 항목에 자동 채워 **바로 임시저장**
   - 필수: 타이틀, 본문(H태그 위계), 핵심목록, 서론, 태그, URL 슬러그, 카테고리
   - 보완: 외부 정보 출처 링크, 참고 유튜브 영상 삽입
4. **메인 이미지 프롬프트** — 상단 썸네일용 이미지의 ChatGPT/DALL·E용 생성 프롬프트 제안

### 확정된 설계 결정 (사용자 승인 2026-05-29)
- **모델:** Claude **Sonnet** 기본 (`claude-sonnet-4-x`). 비용 효율 우선.
- **저장 방식:** 생성 즉시 Supabase에 `published:false`(임시저장)로 저장 → `/admin/editor?id=`로 이동해 검토·보정.
- **이미지:** **프롬프트 텍스트만 생성**(복사 버튼). 실제 이미지는 직접 생성·업로드.

---

## 1. 현행 코드베이스 전제 (반드시 준수)

| 항목 | 사실 | 출처 |
|---|---|---|
| 프레임워크 | Next.js 15.5 App Router, Vercel 서울(icn1) 서버리스 | `package.json`, `vercel.json` |
| API 라우트 | **현재 없음** — 전부 클라이언트 + Supabase 직접 | `app/api/` 부재 |
| 포스트 스키마 | `lib/types.ts` `Post` | 아래 §3 |
| 저장 매핑 | `lib/supabase.ts` `postToRow()` → `posts` 테이블 upsert | `AdminClient.handleSavePosts` |
| 본문 형식 | HTML 문자열(`bodyHtml`). 커스텀 블록 존재 | `TiptapEditor.tsx` |
| 카테고리 | `교통법규` / `Premium Garage` / `안전운전` / `차량관리` (4종 고정) | `AdminEditor.tsx` `CATS` |
| 인증 | `middleware.ts`가 `/admin/*`만 쿠키 세션 게이트. 단일 관리자 | `middleware.ts` |
| 임시저장 | `published === false` | `AdminEditor.tsx` |
| 슬러그 | `toSlug()` 유틸, 비면 제목에서 생성 | `lib/utils.ts` |

### 본문 HTML 규격 (AI 출력이 맞춰야 할 형식)
TiptapEditor가 인식하는 태그/블록:
- 단락: `<p>...</p>`
- 소제목: `<h2>...</h2>`, `<h3>...</h3>`
- **법률 박스(lawbox):** `<div data-type="lawbox" data-ref="도로교통법 제44조">...</div>`
- **팁 박스(tipbox):** `<div data-type="tipbox">...</div>`
- 링크: `<a href="https://...">...</a>` (외부 출처 링크용)
- 이미지: `<img src="...">` (본문 최상단 이미지가 자동 썸네일이 됨)
- 영상 임베드: YouTube/Vimeo. TiptapEditor는 `videoEmbed` 노드를 `<iframe src="https://www.youtube.com/embed/{id}">`로 직렬화.
  - **AI 출력은 `<div data-youtube-video><iframe src="https://www.youtube.com/embed/{VIDEO_ID}"></iframe></div>` 형태로 생성**하고, 보안 sanitize(`lib/sanitize.ts`)가 YouTube/Vimeo iframe만 허용함을 전제.

> ⚠️ `description`은 본문에서 자동 추출(`extractDescription`)되므로 AI가 별도 필드로 줄 필요는 없으나, 품질 위해 첫 문단(서론)을 잘 쓰면 자동 설명도 좋아진다. 슬러그는 한글 제목 → `toSlug` 결과가 빈 문자열이 될 수 있으니 **AI가 영문 슬러그를 직접 제안**한다.

---

## 2. 시스템 아키텍처

```
[어드민 'AI 글쓰기' 페이지  /admin/ai]
   │ ① 카테고리 선택 + (선택)관심 키워드 입력
   ▼
POST /api/admin/ai/topics
   │   Claude Sonnet + web_search (최근 이슈)
   │   → 주제 후보 N개(JSON 배열)
   ▼ ② 사용자가 주제 카드 1개 선택
POST /api/admin/ai/draft
   │   Claude Sonnet + web_search (팩트 보완·출처 수집)
   │   → 전체 글(JSON: 메타 + 본문HTML + 출처 + 유튜브 + 이미지프롬프트)
   ▼ ③ 서버에서 Supabase posts에 published:false 로 upsert
   ▼
클라이언트가 /admin/editor?id={newId} 로 이동 → 검토·보정 → 발행
```

### 보안 (필수)
- `ANTHROPIC_API_KEY`는 **서버 전용 env**. 절대 `NEXT_PUBLIC_` 접두사 금지, 클라이언트 번들 미포함.
- API 라우트는 **요청마다 Supabase 세션 검증**:
  - `@supabase/ssr`의 `createServerClient`로 쿠키에서 세션 읽어 `auth.getUser()` 확인. 없으면 `401`.
  - 추가로 `middleware.ts`의 `matcher`에 `/api/admin/:path*` 포함(이중 방어).
- 단일 관리자 모델이므로 별도 RBAC 불필요. (이메일 화이트리스트 `dreamdation@gmail.com` 체크를 옵션으로 추가 가능.)
- Supabase 쓰기는 **route handler에서 인증된 세션 클라이언트**로 수행(RLS의 `authenticated` 정책 통과). service_role 키는 사용하지 않는다.

---

## 3. 데이터 계약 (JSON 스키마)

### 3.1 `/api/admin/ai/topics` 응답
```jsonc
{
  "topics": [
    {
      "title": "Q7 장거리 운행 후 꼭 점검해야 할 5가지",   // 한국어 제목
      "category": "Premium Garage",                       // 4종 중 1
      "angle": "owner_tip | law | recent_issue",          // 주제 유형
      "rationale": "왜 지금 이 주제가 좋은지 (트래픽/시의성)",
      "keywords": ["Q7 점검", "아우디 정비", ...],          // SEO 키워드
      "recentRefs": [                                       // angle=recent_issue일 때
        { "title": "...", "url": "https://...", "date": "2026-05" }
      ]
    }
    // ... 총 6~8개
  ]
}
```

### 3.2 `/api/admin/ai/draft` 응답
```jsonc
{
  "title": "...",
  "slug": "audi-q7-long-trip-checklist",     // 영문 kebab-case, 60자 이하
  "category": "Premium Garage",               // 4종 중 1
  "tags": ["아우디", "Q7", "차량점검", ...],   // 3~6개
  "intro": "<p>...</p>",                       // 서론(1~2문단, HTML)
  "keyPoints": ["핵심 1", "핵심 2", ...],      // 핵심목록(본문 상단 요약)
  "bodyHtml": "<h2>...</h2><p>...</p><div data-type=\"tipbox\">...</div> ...",
  "sources": [                                 // 외부 출처 링크
    { "title": "도로교통공단 ...", "url": "https://..." }
  ],
  "youtube": [                                 // 참고 유튜브(선택)
    { "title": "...", "videoId": "abc123", "url": "https://youtu.be/abc123" }
  ],
  "imagePrompt": {                             // ChatGPT/DALL·E용
    "ko": "한국어 설명",
    "en": "A photorealistic wide shot of ...,16:9, ..."  // 실제 사용 프롬프트
  },
  "readTimeMin": 7                             // 예상 읽기 시간
}
```

> **bodyHtml 조립 규칙:** 서버에서 `keyPoints`를 본문 최상단의 `<div data-type="tipbox">`(또는 별도 핵심요약 박스)로, `intro`를 그 다음에, `bodyHtml` 본문을 이어 붙이고, `sources`를 글 말미 `<h3>참고 자료</h3><ul><li><a>...</a></li></ul>`로, `youtube`를 본문 적절 위치/말미에 iframe으로 주입한다. 즉 **최종 `bodyHtml`은 서버에서 합성**해 `postToRow`에 넣는다.

### 3.3 구조화 출력 방식
- Anthropic Messages API **tool_use**로 위 스키마를 강제(`tools`에 `record_topics` / `record_draft` 정의, `tool_choice` 강제). 모델 출력 파싱 안정성 확보.
- `web_search`는 별도 server tool(`type: "web_search_20250305"`)로 함께 전달. 모델이 검색 → 결과 인용 → 최종 tool_use로 구조화 응답.

---

## 4. API 라우트 구현

### 4.1 `app/api/admin/ai/_lib/auth.ts`
- `requireAdmin(req)` — 쿠키 세션 검증, 실패 시 `Response 401`.

### 4.2 `app/api/admin/ai/_lib/anthropic.ts`
- `@anthropic-ai/sdk` 클라이언트 싱글톤(`process.env.ANTHROPIC_API_KEY`).
- 모델 상수 `MODEL = 'claude-sonnet-4-x'`(정확한 ID는 구현 시 확정).
- 공통 호출 헬퍼: messages.create + web_search tool + 구조화 tool_use.

### 4.3 `app/api/admin/ai/topics/route.ts`  (`POST`)
- body: `{ category?: string, keywords?: string }`
- 시스템 프롬프트(§5.1) + web_search → `record_topics` tool_use → JSON 반환.
- `export const runtime = 'nodejs'`, `maxDuration` 적절히(예: 60).

### 4.4 `app/api/admin/ai/draft/route.ts`  (`POST`)
- body: `{ topic: Topic }`(3.1의 항목 1개)
- 시스템 프롬프트(§5.2) + web_search → `record_draft` tool_use.
- 응답 후 **서버에서 bodyHtml 합성 + Post 객체 구성 + Supabase upsert**:
  - `id`: `Date.now()`(현행 신규 포스트 ID 규약과 동일).
  - `published: false`, `date: 현재시각`, `categoryColor: getCategoryColorFromName(category)`.
  - 슬러그 중복 검사: 동일 slug 존재 시 `-2`, `-3` 접미사.
  - `postToRow()`로 변환 후 `from('posts').upsert(...)`.
- 반환: `{ id }` → 클라이언트가 `/admin/editor?id={id}`로 push.

---

## 5. 프롬프트 설계 (SEO / AdSense / E-E-A-T 게이트)

> 참고 프레임워크: 오픈소스 `claude-blog`, `seomachine`의 다단계 품질 게이트 개념 차용
> (research→outline→draft→QA, E-E-A-T, 스키마, 팩트검증). 구현은 자작.

### 공통 규칙(두 엔드포인트 system 프롬프트에 포함)
- 출력 언어: **자연스러운 한국어**(번역투/AI 상투어 금지).
- 카테고리는 반드시 4종 중 하나로 매핑.
- 본문 분량 **1,500자 이상**, H2 3~6개 + 필요 시 H3로 위계 구성.
- **AdSense 정책 준수:** 독창적·실용적 가치, 얇은/스팸성/중복 콘텐츠 금지, 과장·허위 금지.
- **E-E-A-T:** 구체적 경험·근거 제시, 통계·법조항엔 출처 명시(`sources`).
- **교통법규 글 디스클레이머:** "본 글은 일반 정보이며, 정확한 사항은 도로교통법 원문·관할 기관 확인 필요" 류 문구를 `tipbox`로 삽입.
- 법조항 인용은 **lawbox**(`data-ref`에 조문 명시).
- 실용 팁은 **tipbox**.
- 광고 친화: 충분한 단락 수(스크롤 길이) 확보하되 키워드 스터핑 금지.

### 5.1 topics 시스템 프롬프트 (요지)
- 역할: Drivever(한국 자동차/교통 블로그) 콘텐츠 전략가.
- 3축(아우디·Q7 운용 / 교통법규 / 두 영역의 최근 이슈)에서 6~8개 제안.
- `recent_issue` 축은 **반드시 web_search로 2026년 최신 사안** 확인 후 `recentRefs` 첨부.
- 각 주제에 SEO 키워드·검색의도·추천 카테고리·선정 이유.

### 5.2 draft 시스템 프롬프트 (요지)
- 입력 주제로 §3.2 스키마의 전체 글 작성.
- web_search로 **사실 검증 + 출처 URL 수집**(법조항·통계·차량 스펙 등).
- 서론(intro) → 핵심목록(keyPoints) → 본문(H2/H3, lawbox/tipbox) → 참고자료(sources).
- 유튜브는 실재 가능성이 높은 검색 키워드/채널을 제안하되, **존재 불확실한 영상 ID를 지어내지 말 것**(검색으로 확인된 것만 `youtube`에 포함, 불확실하면 빈 배열).
- `imagePrompt.en`: 16:9, 사진풍/일러스트 등 주제에 맞는 스타일, 텍스트 없는 이미지, 한국 도로/차량 맥락 반영한 DALL·E 친화 프롬프트.

---

## 6. 어드민 UI

### 6.1 사이드바
- `components/admin/AdminSidebar.tsx`에 `'ai'` 뷰 추가(아이콘 예: `Sparkles`). 라벨 "AI 글쓰기".
- `AdminView` 타입 + `AdminClient.handleNavigate`에 `/admin/ai` 라우팅 추가.

### 6.2 페이지·컴포넌트
- `app/admin/ai/page.tsx` → `<AdminClient initialView="ai" />` (또는 전용 `AdminAiWriter` 컴포넌트 마운트).
- `components/admin/AdminAiWriter.tsx` (신규):
  - **Step 1 — 주제 받기:** 카테고리 셀렉트 + 키워드 입력 + "주제 제안받기" 버튼 → `/api/admin/ai/topics` 호출 → 로딩 스피너 → 주제 카드 그리드(제목·이유·키워드·최근이슈 출처 배지).
  - **Step 2 — 생성:** 카드의 "이 주제로 글 생성" → `/api/admin/ai/draft` 호출(진행 표시: "리서치 중 → 작성 중") → 완료 시 `router.push('/admin/editor?id={id}')`.
  - 이미지 프롬프트는 에디터 진입 후 사이드 패널/토스트로 노출하거나, 생성 완료 화면에 **복사 버튼**과 함께 표시.
- 로딩·에러·재시도 UX 포함(웹검색 포함 호출은 20~60초 소요 가능 → 명확한 진행 표시).

### 6.3 이미지 프롬프트 전달
- draft 응답의 `imagePrompt`를 `posts` 행에 같이 저장하긴 어려움(스키마 외) → **두 경로 중 택1**:
  - (간단) draft API 응답에 `imagePrompt` 포함 → 클라이언트가 에디터 이동 전 토스트/모달로 보여주고 복사.
  - (영속) `posts` 테이블에 `ai_image_prompt text` 컬럼 추가 후 에디터 사이드바에 표시. → **추가 마이그레이션 필요**. 1차 구현은 간단 경로 권장.

---

## 7. 환경 변수 · 의존성

### 추가 의존성
```
npm install @anthropic-ai/sdk --legacy-peer-deps
```
(현행 설치는 tiptap peer 충돌로 `--legacy-peer-deps` 필요 — `.npmrc`에 이미 설정됨.)

### 환경 변수 (`.env.local` + Vercel Project Settings)
```
ANTHROPIC_API_KEY=sk-ant-...        # 서버 전용. NEXT_PUBLIC_ 금지.
# 모델/검색 한도 등은 코드 상수로 관리(필요 시 env로 분리)
```
- Vercel: Production/Preview 양쪽 env에 등록. icn1 리전 서버리스에서 실행.

### 비용 안내 (사용자 인지용)
- API는 Claude.ai 구독과 **별도 청구** → `console.anthropic.com`에서 키 발급 + 크레딧 충전 필요.
- 웹검색: $10 / 1,000회 (≈ 호출당 $0.01) + 토큰 비용.
- 글 1편(주제 제안 + 초안, web_search 수회) ≈ 수백 원 수준(Sonnet 기준 추정).

---

## 8. 구현 단계 (체크리스트)

- [ ] **P0. 사전** — `@anthropic-ai/sdk` 설치, `ANTHROPIC_API_KEY` env 등록(로컬+Vercel).
- [ ] **P1. 보안 기반** — `middleware.ts` matcher에 `/api/admin/:path*` 추가, `requireAdmin()` 헬퍼.
- [ ] **P2. Anthropic 헬퍼** — `_lib/anthropic.ts`(클라이언트, web_search + tool_use 호출 래퍼).
- [ ] **P3. topics 라우트** — `/api/admin/ai/topics` + system 프롬프트 + 스키마.
- [ ] **P4. draft 라우트** — `/api/admin/ai/draft` + bodyHtml 합성 + Supabase upsert(슬러그 중복 처리).
- [ ] **P5. UI** — 사이드바 'AI 글쓰기', `AdminAiWriter`(2-step 플로우), 에디터 이동.
- [ ] **P6. 이미지 프롬프트** — 복사 UI(간단 경로).
- [ ] **P7. 검증** — 로컬 로그인 후 전체 플로우, 비로그인 401 확인, 생성 글이 에디터에 lawbox/tipbox/H태그/유튜브로 올바로 표시되는지, `tsc --noEmit` 통과.
- [ ] **P8. 빌드** — dev 서버 끄고 `npm run build`(`.next` 충돌 회피).

---

## 9. 리스크 · 열린 항목

- **모델 ID 확정:** 구현 시점의 정확한 Sonnet 모델 ID와 `web_search` tool 버전 문자열 확인 필요.
- **web_search 지원 모델:** Sonnet 4.x 지원 확인됨(Opus/Sonnet/Haiku 계열). 구현 시 호출 1회로 스모크 테스트.
- **유튜브/출처 환각 방지:** 프롬프트에서 "검색으로 확인된 것만" 강제하되, 검토 단계(사람)에서 링크 유효성 최종 확인.
- **교통법규 정확성:** 법조항은 lawbox + 디스클레이머 + 출처. 발행 전 사람 검수 필수(AdSense·법적 리스크).
- **serverless 타임아웃:** web_search 다회 + 장문 생성은 수십 초 → `maxDuration` 상향, 클라이언트 타임아웃·진행표시.
- **AdSense:** 자동 생성 글도 **사람 검수 후 발행**이 원칙(대량 자동발행은 정책 위반 위험). 본 기능은 "임시저장까지"가 기본 동작이라 이 원칙과 부합.
- **(확장) 이미지 자동 생성:** 추후 OpenAI 이미지 API 연동 시 별도 키·비용·업로드 파이프라인(`posts/{id}/` 컨벤션) 추가.

---

## 부록 A. 참고 자료
- Claude 공식 Web search tool: https://docs.claude.com/en/docs/agents-and-tools/tool-use/web-search-tool
- Web search API 발표: https://www.anthropic.com/news/web-search-api
- 프롬프트 프레임워크 참고: `TheCraigHewitt/seomachine`, `AgriciDaniel/claude-blog` (Claude Code 스킬 — 런타임 차용 아님, 설계 참고용)
