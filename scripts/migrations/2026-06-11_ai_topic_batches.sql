-- Drivever Blog: AI 글쓰기 '주제 제안받기' 결과 묶음 저장 테이블
-- Date: 2026-06-11 (Supabase MCP로 프로덕션 적용 완료 — 본 파일은 기록용)
--
-- Purpose:
--   주제 제안 1회 호출(토큰 소모)의 결과를 저장해, 재생성 없이 다시 열람·사용.
--   draft 생성 시 해당 topic에 usedPostId/usedAt을 주입해 중복 작성 방지.
--
-- 접근 제어: 어드민 전용 데이터 — anon 정책 없음, authenticated만 전체 CRUD.

create table if not exists public.ai_topic_batches (
  id         bigint primary key,            -- Date.now() (posts.id와 동일 규약)
  created_at timestamptz not null default now(),
  category   text not null default '전체',  -- 생성 시 선택한 카테고리 필터
  keywords   text not null default '',      -- 생성 시 입력한 관심 키워드
  topics     jsonb not null                 -- Topic[] (사용 시 usedPostId/usedAt 주입)
);

alter table public.ai_topic_batches enable row level security;

create policy ai_topic_batches_select_authenticated
  on public.ai_topic_batches for select to authenticated using (true);
create policy ai_topic_batches_insert_authenticated
  on public.ai_topic_batches for insert to authenticated with check (true);
create policy ai_topic_batches_update_authenticated
  on public.ai_topic_batches for update to authenticated using (true) with check (true);
create policy ai_topic_batches_delete_authenticated
  on public.ai_topic_batches for delete to authenticated using (true);
