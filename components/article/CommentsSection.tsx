'use client'

import { useState, useEffect } from 'react'
import { Trash2, Crown } from 'lucide-react'
import { Comment } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { sha256Hex } from '@/lib/crypto'
import { useAuth } from '@/lib/useAuth'

const AVATAR_COLORS = ['#0070F3', '#7C3AED', '#059669', '#D97706', '#DB2777']

function avatarColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

const COOLDOWN_KEY  = 'dv_comment_cooldown'
const COOLDOWN_MS   = 60 * 1000
const SPAM_KEYWORDS = ['광고', '홍보', '클릭', '구매', '판매']
const URL_RE        = /https?:\/\/[^\s]+/g
const PIN_RE        = /^\d{4}$/
// Mirrors DB check constraint comments_no_impersonation
const FORBIDDEN_NAME_RE = /(운영자|관리자|드림데이션|dreamdation|drivever|드라이브에버)/i
const ADMIN_NAME = '운영자'

function countUrls(t: string) { return (t.match(URL_RE) ?? []).length }
function hasRepeat(t: string)  { return /(.)\1{9,}/.test(t) }
function isForbiddenName(name: string): boolean {
  return FORBIDDEN_NAME_RE.test(name.replace(/\s+/g, ''))
}

interface CommentsSectionProps {
  postId: number
}

export default function CommentsSection({ postId }: CommentsSectionProps) {
  const { isLoggedIn } = useAuth()

  const [comments,  setComments]  = useState<Comment[]>([])
  const [name,      setName]      = useState('')
  const [pin,       setPin]       = useState('')
  const [text,      setText]      = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [warning,   setWarning]   = useState<string | null>(null)
  const [loading,   setLoading]   = useState(true)

  const [confirmTarget, setConfirmTarget] = useState<Comment | null>(null)
  const [deleting,      setDeleting]      = useState(false)
  const [toast,         setToast]         = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('comments')
      .select('id, name, text, date, created_at, is_admin')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) {
          setComments(data.map((r) => ({
            id:      r.id,
            name:    r.name,
            text:    r.text,
            date:    r.date,
            isAdmin: r.is_admin,
          })))
        }
        setLoading(false)
      })
  }, [postId])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setWarning(null)

    const trimText = text.trim()
    const trimName = isLoggedIn ? ADMIN_NAME : name.trim()
    const trimPin  = pin.trim()

    if (!trimName || !trimText) {
      setError('닉네임과 댓글 내용을 모두 입력해주세요.')
      return
    }
    if (!isLoggedIn) {
      if (!trimPin) {
        setError('비밀번호 4자리를 입력해주세요.')
        return
      }
      if (!PIN_RE.test(trimPin)) {
        setError('비밀번호는 숫자 4자리로 입력해주세요.')
        return
      }
      if (isForbiddenName(trimName)) {
        setError('사용할 수 없는 닉네임입니다. 운영자/관리자/블로그 명칭은 사용할 수 없습니다.')
        return
      }
    }
    if (trimName.length > 30) {
      setError('닉네임은 최대 30자까지 입력 가능합니다.')
      return
    }
    if (trimText.length > 500) {
      setError('댓글은 최대 500자까지 입력 가능합니다.')
      return
    }

    try {
      const last = localStorage.getItem(COOLDOWN_KEY)
      if (last) {
        const elapsed = Date.now() - Number(last)
        if (elapsed < COOLDOWN_MS) {
          const remaining = Math.ceil((COOLDOWN_MS - elapsed) / 1000)
          setError(`${remaining}초 후에 다시 댓글을 작성할 수 있습니다.`)
          return
        }
      }
    } catch { /* empty */ }

    if (countUrls(trimText) >= 3) {
      setError('URL이 과도하게 포함된 댓글은 등록할 수 없습니다.')
      return
    }
    if (hasRepeat(trimText)) {
      setError('반복 문자가 포함된 댓글은 등록할 수 없습니다.')
      return
    }

    const found = SPAM_KEYWORDS.find((kw) => trimText.includes(kw))
    if (found) setWarning('광고성 표현이 포함될 수 있습니다. 댓글 내용을 다시 확인해주세요.')

    const dateStr = new Date().toLocaleDateString('ko-KR')
    const passwordHash = isLoggedIn ? null : await sha256Hex(trimPin)

    const tempId = Date.now()
    const optimistic: Comment = {
      id: tempId, name: trimName, text: trimText, date: dateStr, isAdmin: isLoggedIn,
    }
    setComments((prev) => [...prev, optimistic])
    setName('')
    setPin('')
    setText('')
    setSubmitted(true)
    try { localStorage.setItem(COOLDOWN_KEY, String(Date.now())) } catch { /* empty */ }
    setTimeout(() => { setSubmitted(false); setWarning(null) }, 3000)

    const { data, error: insertError } = await supabase
      .from('comments')
      .insert({
        post_id:       postId,
        name:          trimName,
        text:          trimText,
        date:          dateStr,
        password_hash: passwordHash,
        is_admin:      isLoggedIn,
      })
      .select('id')
      .single()

    if (insertError) {
      setComments((prev) => prev.filter((c) => c.id !== tempId))
      setError('댓글 등록에 실패했습니다. 다시 시도해주세요.')
      return
    }

    if (data) {
      setComments((prev) => prev.map((c) => c.id === tempId ? { ...c, id: data.id } : c))
    }
  }

  const confirmDelete = async () => {
    if (!confirmTarget) return
    setDeleting(true)
    const target = confirmTarget
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', target.id)

    if (deleteError) {
      setDeleting(false)
      setConfirmTarget(null)
      setToast('삭제에 실패했습니다.')
      setTimeout(() => setToast(null), 2500)
      return
    }

    setComments((prev) => prev.filter((c) => c.id !== target.id))
    setDeleting(false)
    setConfirmTarget(null)
    setToast('댓글이 삭제되었습니다.')
    setTimeout(() => setToast(null), 2500)
  }

  return (
    <div className="mt-12">
      <div className="h-px bg-border mb-7" />
      <h3 className="text-md font-bold text-fg mb-5">
        댓글
        <span className="text-[0.9rem] font-normal text-fg-3 ml-2">{comments.length}개</span>
      </h3>

      {!loading && comments.length > 0 && (
        <div className="flex flex-col gap-5 mb-7">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3 items-start group">
              {c.isAdmin ? (
                <div
                  className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white"
                  style={{ background: '#0070F3' }}
                  aria-label="운영자"
                  title="운영자"
                >
                  <Crown size={16} />
                </div>
              ) : (
                <div
                  className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: avatarColor(c.name) }}
                >
                  {c.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-fg">{c.name}</span>
                  {c.isAdmin && (
                    <span
                      className="inline-flex items-center gap-0.5 px-1.5 py-[1px] rounded text-[10px] font-bold text-white"
                      style={{ background: '#0070F3', letterSpacing: '0.02em' }}
                    >
                      <Crown size={9} />운영자
                    </span>
                  )}
                  <span className="text-[11px] text-[#bbb]">{c.date}</span>
                  {isLoggedIn && (
                    <button
                      type="button"
                      onClick={() => setConfirmTarget(c)}
                      className="ml-auto inline-flex items-center gap-1 px-2 py-[3px] border border-border rounded-[5px] bg-white text-[11px] text-[#aaa] hover:text-[#C0392B] hover:border-[#FFD0D0] transition-colors font-[inherit]"
                      aria-label="댓글 삭제"
                    >
                      <Trash2 size={11} />삭제
                    </button>
                  )}
                </div>
                <p className="text-[0.9375rem] text-[#444] leading-[1.65] break-words">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="bg-surface border border-border rounded-[8px] p-5">
        {isLoggedIn ? (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-[6px] bg-white border border-border">
            <div
              className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white"
              style={{ background: '#0070F3' }}
            >
              <Crown size={13} />
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm font-semibold text-fg">{ADMIN_NAME}</span>
              <span
                className="inline-flex items-center gap-0.5 px-1.5 py-[1px] rounded text-[10px] font-bold text-white"
                style={{ background: '#0070F3', letterSpacing: '0.02em' }}
              >
                <Crown size={9} />운영자
              </span>
              <span className="text-[11px] text-fg-3 ml-1">로 댓글 작성</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-2 mb-3">
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null) }}
              placeholder="닉네임"
              aria-label="닉네임"
              maxLength={30}
              className="w-full px-3 py-2 border border-border rounded-[6px] text-sm outline-none bg-white"
            />
            <input
              value={pin}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 4)
                setPin(v); setError(null)
              }}
              placeholder="비번 4자리"
              aria-label="비밀번호 4자리"
              inputMode="numeric"
              type="password"
              maxLength={4}
              className="w-full px-3 py-2 border border-border rounded-[6px] text-sm outline-none bg-white tracking-widest"
            />
          </div>
        )}

        <div className="mb-3">
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setError(null) }}
            placeholder="댓글을 입력하세요..."
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 border border-border rounded-[6px] text-sm outline-none resize-y bg-white"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[11px] text-fg-3">
              {isLoggedIn
                ? '운영자로 작성하면 댓글 옆에 왕관 배지가 표시됩니다.'
                : '댓글 작성 시 4자리 비밀번호를 설정하면 추후 본인 확인용으로 사용됩니다.'}
            </span>
            <span className="text-[11px]" style={{ color: text.length > 450 ? '#D97706' : '#bbb' }}>
              {text.length}/500
            </span>
          </div>
        </div>

        {(error || warning) && (
          <div className="flex flex-col gap-2 mb-3">
            {error && (
              <p className="text-xs font-semibold px-3 py-2 rounded-[6px]"
                 style={{ background: '#FFF1F0', color: '#C0392B', border: '1px solid #FFD0D0' }}>
                {error}
              </p>
            )}
            {warning && (
              <p className="text-xs font-semibold px-3 py-2 rounded-[6px]"
                 style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}>
                ⚠ {warning}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          {submitted
            ? <span className="text-xs text-success font-semibold">✓ 댓글이 등록되었습니다</span>
            : <span />
          }
          <button
            type="submit"
            className="px-[18px] py-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-[6px] transition-colors duration-150"
          >
            댓글 등록
          </button>
        </div>
      </form>

      {confirmTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => !deleting && setConfirmTarget(null)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            className="bg-white rounded-[10px] w-full max-w-[360px] p-6"
            style={{ boxShadow: '0 12px 32px rgba(0,0,0,0.18)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-base font-bold text-fg mb-2">댓글 삭제</h4>
            <p className="text-sm text-fg-2 leading-relaxed mb-5">
              <span className="font-semibold text-fg">{confirmTarget.name}</span>님의 댓글을 삭제하시겠습니까?
              <br />
              <span className="text-xs text-fg-3">이 작업은 되돌릴 수 없습니다.</span>
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirmTarget(null)}
                className="px-4 py-2 border border-border rounded-[6px] bg-white text-sm text-fg-2 hover:bg-surface transition-colors font-[inherit] disabled:opacity-60"
              >
                취소
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="px-4 py-2 rounded-[6px] text-sm font-semibold text-white transition-colors font-[inherit] disabled:opacity-60"
                style={{ background: '#C0392B' }}
              >
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-[6px] text-sm font-semibold text-white"
          style={{ background: 'rgba(20,20,20,0.92)', boxShadow: '0 6px 18px rgba(0,0,0,0.18)' }}
          role="status"
          aria-live="polite"
        >
          {toast}
        </div>
      )}
    </div>
  )
}
