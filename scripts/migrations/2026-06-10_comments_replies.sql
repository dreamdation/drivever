-- Drivever Blog: 댓글 대댓글(1단계) + 소프트 삭제(흔적 남기기)
-- Date: 2026-06-10
--
-- 목적:
--   - parent_id 추가로 1단계 대댓글 지원 (대댓글에는 다시 답글 불가).
--   - is_deleted 추가로 "흔적 남기기" 삭제 지원: 자식 대댓글이 달린 부모를
--     실제로 지우면 대화 맥락이 끊기므로, 자식이 있으면 row를 남기고
--     is_deleted=true 로만 표시("삭제된 댓글입니다"), 자식이 없으면 실제 삭제.
--
-- 주의:
--   - parent_id 는 nullable. 최상위 댓글은 NULL, 대댓글은 부모 id.
--   - ON DELETE CASCADE 는 안전망: 클라이언트/RPC 로직상 자식이 있는 부모를
--     hard delete 하지 않으므로 정상 흐름에서는 트리거되지 않음.

ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS parent_id  BIGINT REFERENCES public.comments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS comments_parent_id_idx ON public.comments(parent_id);

-- 방문자 PIN 자가삭제 RPC: 자식이 있으면 soft delete, 없으면 hard delete.
CREATE OR REPLACE FUNCTION public.delete_own_comment(p_id bigint, p_pin_hash text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_owns         boolean;
  v_has_children boolean;
begin
  if not public.throttle_check('comment_delete', 60, 5) then
    raise exception 'rate_limited'
      using message = '시도가 너무 많습니다. 잠시 후 다시 시도해주세요.';
  end if;

  select exists(
    select 1 from public.comments
    where id = p_id
      and is_admin = false
      and password_hash is not null
      and password_hash = p_pin_hash
  ) into v_owns;

  if not v_owns then
    return false;
  end if;

  select exists(select 1 from public.comments where parent_id = p_id) into v_has_children;

  if v_has_children then
    update public.comments
    set is_deleted = true, text = '', name = '', password_hash = null
    where id = p_id;
  else
    delete from public.comments where id = p_id;
  end if;

  return true;
end;
$function$;
