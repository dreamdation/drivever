# Drivever Blog

실전 자동차·교통 정보 블로그. Next.js 15 App Router 기반.

## 기술 스택

- **Next.js 15.5** (App Router) · React 19 · TypeScript
- **Tailwind CSS v3** (디자인 토큰: `tailwind.config.ts`)
- **Supabase** — 포스트/댓글/히어로/광고문의 저장, Auth(관리자 로그인), Storage(이미지)
  - 클라이언트: `@supabase/ssr`(쿠키 세션, 브라우저) + `@supabase/supabase-js`(서버 anon 읽기)
- **Zustand** — UI 상태(히어로 슬라이드만 영속; 포스트는 매 요청 SSR로 새로 읽음)
- **Tiptap** — 관리자 글 편집기
- **Lucide React** — 아이콘

## 로컬 개발

```bash
npm install --legacy-peer-deps   # tiptap peer 충돌 때문에 --legacy-peer-deps 필요
npm run dev                      # http://localhost:3000
npm run build                    # 프로덕션 빌드 (dev 서버를 끄고 실행할 것)
```

> ⚠️ `npm run build`는 dev 서버가 켜진 채로 돌리면 `.next` 충돌로 "Cannot find module for page" 에러가 납니다. dev 서버를 끄고 빌드하세요. 타입만 빠르게 확인하려면 `npx tsc --noEmit`.

## 환경 변수 (`.env.local`)

| 변수 | 노출 | 용도 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 공개 | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 공개(정상) | anon 키. 브라우저 노출은 설계 의도이며 RLS가 데이터를 보호함 |
| `NEXT_PUBLIC_KAKAO_JS_KEY` | 공개 | 카카오톡 공유 SDK(도메인 제한) |
| `NEXT_PUBLIC_SITE_URL` | 공개 | canonical/OG/sitemap/robots 기준 origin (기본 `https://drivever.kr`) |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | 공개 | AdSense 게시자 ID(`ca-pub-...`). 설정 시 로더 스크립트 주입 |
| `SUPABASE_SERVICE_ROLE_KEY` | **비밀** | **앱은 사용 안 함.** 아래 데이터 마이그레이션 스크립트 전용 |

**보안 주의**
- `NEXT_PUBLIC_` 접두사가 붙은 변수만 브라우저 번들에 포함됩니다.
- `SUPABASE_SERVICE_ROLE_KEY`는 **RLS를 전부 우회하는 관리자 키**입니다. 절대 `NEXT_PUBLIC_` 접두사를 붙이거나, 커밋하거나, 프로덕션 런타임 환경변수에 넣지 마세요(앱이 쓰지 않습니다).
- 현재 `.env.local`에는 이 키를 비워두고, 마이그레이션을 돌릴 때만 셸에 임시 주입하는 방식을 권장합니다(아래 참조).

## 데이터베이스 마이그레이션

마이그레이션은 두 종류입니다.

### 1) 스키마 변경 — `.sql` 파일

`scripts/migrations/*.sql`. Supabase 대시보드 **SQL Editor**에 붙여넣어 실행하거나, Supabase CLI/MCP로 적용합니다.

| 파일 | 내용 |
|---|---|
| `2026-05-19_comments_password.sql` | 댓글에 `password_hash` 컬럼 추가(본인 삭제용 PIN) |
| `2026-05-27_ad_inquiries.sql` | 광고 문의 테이블 + RLS 정책 |

> 이후의 스키마 변경(서버 rate-limit 트리거, `delete_own_comment` RPC 등)은 Supabase 마이그레이션 기록에 직접 적용되어 있습니다. 스키마를 새 환경에 재현해야 한다면 Supabase 대시보드의 마이그레이션 히스토리를 기준으로 삼으세요.

### 2) 데이터/스토리지 마이그레이션 — `.mjs` 스크립트

`scripts/migrations/*.mjs`. Node로 실행하는 **일회성** 스크립트이며, RLS를 우회하기 위해 `SUPABASE_SERVICE_ROLE_KEY`가 필요합니다.

| 스크립트 | 내용 |
|---|---|
| `2026-05-20_ingest_wp_images.mjs` | 레거시 WordPress(`drivever.kr`) 이미지를 Supabase `post-images` 버킷으로 이전 + DB URL 재작성 |
| `2026-05-20_rewrite_wp_navlinks.mjs` | 본문 내 `drivever.kr/{slug}` 링크를 내부 경로 `/blog/{slug}`로 변환 |
| `2026-05-20_storage_folder_restructure.mjs` | `post-images` 버킷을 `posts/`·`thumbnails/`·`hero/`·`legacy/` 구조로 재정리 |

**실행 방법**

스크립트는 `.env.local`에서 `NEXT_PUBLIC_*` 값을 자동으로 읽습니다. **셸 환경변수가 `.env.local`보다 우선**하므로, 서비스 롤 키만 셸에 임시로 주입하면 됩니다. 실행 후 셸을 닫으면 키는 메모리에서 사라집니다.

서비스 롤 키는 Supabase 대시보드 → **Settings → API → `service_role` secret**에서 복사하세요.

```powershell
# Windows PowerShell
$env:SUPABASE_SERVICE_ROLE_KEY = "<service_role 키 붙여넣기>"
node scripts/migrations/2026-05-20_ingest_wp_images.mjs            # 기본: dry-run (미리보기)
node scripts/migrations/2026-05-20_ingest_wp_images.mjs --execute  # 실제 실행
```

```bash
# macOS / Linux (bash) — 한 줄로 주입하면 해당 명령에만 적용됨
SUPABASE_SERVICE_ROLE_KEY="<service_role 키>" node scripts/migrations/2026-05-20_ingest_wp_images.mjs --execute
```

**공통 규칙**
- 인자 없이 실행하면 **dry-run**(변경 없이 미리보기). 실제 반영은 `--execute`.
- 대부분 멱등(idempotent)하게 작성되어 재실행해도 안전합니다.

**스크립트별 옵션**
- `2026-05-20_ingest_wp_images.mjs` — `--limit=N`(앞에서 N개만), `--post=ID`(특정 글만)
- `2026-05-20_storage_folder_restructure.mjs` — `--orphan=legacy`(기본) | `--orphan=hero` | `--orphan=skip`

## 디렉터리 개요

```
app/                 App Router 라우트 (page/layout, robots.ts, sitemap.ts, manifest.ts, opengraph-image.tsx)
components/          UI 컴포넌트 (layout/ blog/ article/ admin/ contact/)
lib/                 supabase 클라이언트, 유틸, 타입, sanitize, adsense 설정 등
store/               Zustand 스토어
scripts/migrations/  마이그레이션 스크립트(.sql / .mjs)
middleware.ts        /admin 서버사이드 인증 게이트(쿠키 세션)
```

## 관리자

- `/login` — Supabase Auth(이메일/비밀번호) 로그인
- `/admin` — 대시보드, Tiptap 편집기, 히어로/댓글/문의/휴지통 관리
- `/admin/*`는 `middleware.ts`가 쿠키 세션으로 서버에서 보호하며, 데이터는 Supabase RLS(쓰기 authenticated 전용)로 보호됩니다.
