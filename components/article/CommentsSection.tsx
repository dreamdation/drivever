'use client'

import { useState, useEffect, useRef } from 'react'
import { Trash2, Crown, CornerDownRight, Reply } from 'lucide-react'
import { Comment } from '@/lib/types'
import { supabase } from '@/lib/supabaseClient'
import { sha256Hex } from '@/lib/crypto'
import { useAuth } from '@/lib/useAuth'
import { trackEvent } from '@/lib/analytics'

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

  // Inline reply composer: only one open at a time (replyTo = parent comment id).
  const [replyTo,      setReplyTo]      = useState<number | null>(null)
  const [replyName,    setReplyName]    = useState('')
  const [replyPin,     setReplyPin]     = useState('')
  const [replyText,    setReplyText]    = useState('')
  const [replyError,   setReplyError]   = useState<string | null>(null)
  const [replyHp,      setReplyHp]      = useState('')
  const [replyBusy,    setReplyBusy]    = useState(false)

  const [confirmTarget, setConfirmTarget] = useState<Comment | null>(null)
  const [deleting,      setDeleting]      = useState(false)
  const [toast,         setToast]         = useState<string | null>(null)

  // PIN-based self-delete for non-admin visitors (verified server-side via the
  // delete_own_comment RPC against the stored SHA-256 hash of their 4-digit PIN).
  const [pinTarget,  setPinTarget]  = useState<Comment | null>(null)
  const [pinInput,   setPinInput]   = useState('')
  const [pinError,   setPinError]   = useState<string | null>(null)
  const [pinDeleting, setPinDeleting] = useState(false)

  // Lightweight bot defenses (no external captcha): a honeypot field real users
  // never see/fill, plus a minimum dwell time before a submission is accepted.
  const [hp, setHp] = useState('')
  const mountedAt = useRef(Date.now())

  useEffect(() => {
    supabase
      .from('comments')
      .select('id, name, text, date, created_at, is_admin, parent_id, is_deleted')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) {
          setComments(data.map((r) => ({
            id:        r.id,
            name:      r.name,
            text:      r.text,
            date:      r.date,
            isAdmin:   r.is_admin,
            parentId:  r.parent_id,
            isDeleted: r.is_deleted,
          })))
        }
        setLoading(false)
      })
  }, [postId])

  // Shared write path for both top-level comments and replies. Runs the full
  // validation + anti-spam gauntlet, optimistically inserts, then persists.
  // `parentId` is null for top-level comments, or the parent comment id for a reply.
  const createComment = async (opts: {
    rawName: string
    rawPin: string
    rawText: string
    honeypot: string
    parentId: number | null
    setErr: (m: string | null) => void
    setWarn?: (m: string | null) => void
    onAccepted: () => void
  }) => {
    const { rawName, rawPin, rawText, honeypot, parentId, setErr, setWarn, onAccepted } = opts
    setErr(null)
    setWarn?.(null)

    // Bot traps: honeypot filled, or submitted implausibly fast → silently drop.
    if (honeypot.trim() !== '' || Date.now() - mountedAt.current < 2500) {
      setErr('잠시 후 다시 시도해주세요.')
      return
    }

    const trimText = rawText.trim()
    const trimName = isLoggedIn ? ADMIN_NAME : rawName.trim()
    const trimPin  = rawPin.trim()

    if (!trimName || !trimText) {
      setErr('닉네임과 댓글 내용을 모두 입력해주세요.')
      return
    }
    if (!isLoggedIn) {
      if (!trimPin) {
        setErr('비밀번호 4자리를 입력해주세요.')
        return
      }
      if (!PIN_RE.test(trimPin)) {
        setErr('비밀번호는 숫자 4자리로 입력해주세요.')
        return
      }
      if (isForbiddenName(trimName)) {
        setErr('사용할 수 없는 닉네임입니다. 운영자/관리자/블로그 명칭은 사용할 수 없습니다.')
        return
      }
    }
    if (trimName.length > 30) {
      setErr('닉네임은 최대 30자까지 입력 가능합니다.')
      return
    }
    if (trimText.length > 500) {
      setErr('댓글은 최대 500자까지 입력 가능합니다.')
      return
    }

    try {
      const last = localStorage.getItem(COOLDOWN_KEY)
      if (last) {
        const elapsed = Date.now() - Number(last)
        if (elapsed < COOLDOWN_MS) {
          const remaining = Math.ceil((COOLDOWN_MS - elapsed) / 1000)
          setErr(`${remaining}초 후에 다시 댓글을 작성할 수 있습니다.`)
          return
        }
      }
    } catch { /* empty */ }

    if (countUrls(trimText) >= 3) {
      setErr('URL이 과도하게 포함된 댓글은 등록할 수 없습니다.')
      return
    }
    if (hasRepeat(trimText)) {
      setErr('반복 문자가 포함된 댓글은 등록할 수 없습니다.')
      return
    }

    const found = SPAM_KEYWORDS.find((kw) => trimText.includes(kw))
    if (found) setWarn?.('광고성 표현이 포함될 수 있습니다. 댓글 내용을 다시 확인해주세요.')

    const dateStr = new Date().toLocaleDateString('ko-KR')
    const passwordHash = isLoggedIn ? null : await sha256Hex(trimPin)

    const tempId = Date.now()
    const optimistic: Comment = {
      id: tempId, name: trimName, text: trimText, date: dateStr,
      isAdmin: isLoggedIn, parentId, isDeleted: false,
    }
    setComments((prev) => [...prev, optimistic])
    onAccepted()
    try { localStorage.setItem(COOLDOWN_KEY, String(Date.now())) } catch { /* empty */ }

    const { data, error: insertError } = await supabase
      .from('comments')
      .insert({
        post_id:       postId,
        name:          trimName,
        text:          trimText,
        date:          dateStr,
        password_hash: passwordHash,
        is_admin:      isLoggedIn,
        parent_id:     parentId,
      })
      .select('id')
      .single()

    if (insertError) {
      setComments((prev) => prev.filter((c) => c.id !== tempId))
      setErr('댓글 등록에 실패했습니다. 다시 시도해주세요.')
      return
    }

    trackEvent('comment_submit', { post_id: postId, is_reply: parentId !== null })

    if (data) {
      setComments((prev) => prev.map((c) => c.id === tempId ? { ...c, id: data.id } : c))
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    createComment({
      rawName: name, rawPin: pin, rawText: text, honeypot: hp, parentId: null,
      setErr: setError, setWarn: setWarning,
      onAccepted: () => {
        setName(''); setPin(''); setText(''); setSubmitted(true)
        setTimeout(() => { setSubmitted(false); setWarning(null) }, 3000)
      },
    })
  }

  const submitReply = (e: React.FormEvent, parentId: number) => {
    e.preventDefault()
    setReplyBusy(true)
    createComment({
      rawName: replyName, rawPin: replyPin, rawText: replyText, honeypot: replyHp, parentId,
      setErr: setReplyError,
      onAccepted: () => {
        setReplyName(''); setReplyPin(''); setReplyText(''); setReplyTo(null)
      },
    }).finally(() => setReplyBusy(false))
  }

  const openReply = (parentId: number) => {
    setReplyTo(parentId)
    setReplyName(''); setReplyPin(''); setReplyText(''); setReplyError(null); setReplyHp('')
  }

  // Mirror the server's soft/hard delete: a comment with replies leaves a
  // "삭제된 댓글입니다" trace so the thread stays readable; a leaf is removed.
  const applyDeletion = (id: number) => {
    setComments((prev) => {
      const hasChildren = prev.some((c) => c.parentId === id)
      return hasChildren
        ? prev.map((c) => c.id === id ? { ...c, isDeleted: true, text: '', name: '' } : c)
        : prev.filter((c) => c.id !== id)
    })
  }

  const confirmDelete = async () => {
    if (!confirmTarget) return
    setDeleting(true)
    const target = confirmTarget
    const hasChildren = comments.some((c) => c.parentId === target.id)

    const { error: opError } = hasChildren
      ? await supabase.from('comments').update({ is_deleted: true, text: '', name: '' }).eq('id', target.id)
      : await supabase.from('comments').delete().eq('id', target.id)

    if (opError) {
      setDeleting(false)
      setConfirmTarget(null)
      setToast('삭제에 실패했습니다.')
      setTimeout(() => setToast(null), 2500)
      return
    }

    applyDeletion(target.id)
    setDeleting(false)
    setConfirmTarget(null)
    setToast('댓글이 삭제되었습니다.')
    setTimeout(() => setToast(null), 2500)
  }

  // Visitor self-delete: verify the 4-digit PIN server-side (hashed) via RPC.
  // The RPC itself decides soft vs hard delete; we mirror it in the UI.
  const confirmPinDelete = async () => {
    if (!pinTarget) return
    const trimmed = pinInput.trim()
    if (!PIN_RE.test(trimmed)) {
      setPinError('비밀번호는 숫자 4자리입니다.')
      return
    }
    setPinDeleting(true)
    setPinError(null)
    const target = pinTarget
    const hash = await sha256Hex(trimmed)
    const { data, error: rpcError } = await supabase.rpc('delete_own_comment', {
      p_id: target.id,
      p_pin_hash: hash,
    })
    setPinDeleting(false)

    if (rpcError) {
      // e.g. rate-limited (too many attempts)
      setPinError(rpcError.message || '삭제에 실패했습니다. 잠시 후 다시 시도해주세요.')
      return
    }
    if (data !== true) {
      setPinError('비밀번호가 일치하지 않습니다.')
      return
    }

    applyDeletion(target.id)
    setPinTarget(null)
    setPinInput('')
    setToast('댓글이 삭제되었습니다.')
    setTimeout(() => setToast(null), 2500)
  }

  const topLevel    = comments.filter((c) => c.parentId == null)
  const visibleCount = comments.filter((c) => !c.isDeleted).length

  const renderDeleteButton = (c: Comment) => {
    if (c.isDeleted) return null
    if (isLoggedIn) {
      return (
        <button
          type="button"
          onClick={() => setConfirmTarget(c)}
          className="inline-flex items-center gap-1 px-2 py-[3px] border border-border rounded-[5px] bg-white text-[11px] text-[#aaa] hover:text-[#C0392B] hover:border-[#FFD0D0] transition-colors font-[inherit]"
          aria-label="댓글 삭제"
        >
          <Trash2 size={11} />삭제
        </button>
      )
    }
    if (!c.isAdmin) {
      return (
        <button
          type="button"
          onClick={() => { setPinTarget(c); setPinInput(''); setPinError(null) }}
          className="inline-flex items-center gap-1 px-2 py-[3px] border border-border rounded-[5px] bg-white text-[11px] text-[#bbb] hover:text-[#C0392B] hover:border-[#FFD0D0] transition-colors font-[inherit] opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label="내 댓글 삭제 (비밀번호 필요)"
          title="비밀번호로 내 댓글 삭제"
        >
          <Trash2 size={11} />삭제
        </button>
      )
    }
    return null
  }

  const renderComment = (c: Comment, isReply: boolean) => {
    if (c.isDeleted) {
      return (
        <div key={c.id} className="flex gap-3 items-center">
          <div className="w-9 h-9 rounded-full shrink-0 bg-[#ececec]" aria-hidden="true" />
          <p className="text-[0.9rem] text-fg-3 italic">삭제된 댓글입니다.</p>
        </div>
      )
    }

    return (
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
          <div className="flex items-center gap-2 mb-1 flex-wrap">
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
            <span className="ml-auto inline-flex items-center gap-1.5">
              {!isReply && (
                <button
                  type="button"
                  onClick={() => (replyTo === c.id ? setReplyTo(null) : openReply(c.id))}
                  className="inline-flex items-center gap-1 px-2 py-[3px] border border-border rounded-[5px] bg-white text-[11px] text-[#888] hover:text-accent hover:border-accent/40 transition-colors font-[inherit]"
                  aria-label="답글 작성"
                >
                  <Reply size={11} />답글
                </button>
              )}
              {renderDeleteButton(c)}
            </span>
          </div>
          <p className="text-[0.9375rem] text-[#444] leading-[1.65] break-words">{c.text}</p>
        </div>
      </div>
    )
  }

  const renderReplyForm = (parentId: number) => (
    <form
      onSubmit={(e) => submitReply(e, parentId)}
      className="mt-3 bg-surface border border-border rounded-[8px] p-4"
    >
      {/* Honeypot — hidden from users; bots tend to fill every field. */}
      <input
        type="text"
        name="website"
        value={replyHp}
        onChange={(e) => setReplyHp(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
      />
      {isLoggedIn ? (
        <div className="flex items-center gap-1.5 mb-2 text-[11px] text-fg-3">
          <Crown size={12} style={{ color: '#0070F3' }} />
          <span className="font-semibold text-fg">{ADMIN_NAME}</span>로 답글 작성
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-2 mb-2">
          <input
            value={replyName}
            onChange={(e) => { setReplyName(e.target.value); setReplyError(null) }}
            placeholder="닉네임"
            aria-label="닉네임"
            maxLength={30}
            className="w-full px-3 py-2 border border-border rounded-[6px] text-sm outline-none bg-white"
          />
          <input
            value={replyPin}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 4)
              setReplyPin(v); setReplyError(null)
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

      <textarea
        value={replyText}
        onChange={(e) => { setReplyText(e.target.value); setReplyError(null) }}
        placeholder="답글을 입력하세요..."
        rows={2}
        maxLength={500}
        autoFocus
        className="w-full px-3 py-2 border border-border rounded-[6px] text-sm outline-none resize-y bg-white"
      />

      {replyError && (
        <p className="text-xs font-semibold px-3 py-2 rounded-[6px] mt-2"
           style={{ background: '#FFF1F0', color: '#C0392B', border: '1px solid #FFD0D0' }}>
          {replyError}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 mt-2">
        <button
          type="button"
          onClick={() => setReplyTo(null)}
          className="px-3.5 py-1.5 border border-border rounded-[6px] bg-white text-[13px] text-fg-2 hover:bg-white/70 transition-colors font-[inherit]"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={replyBusy}
          className="px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-white text-[13px] font-semibold rounded-[6px] transition-colors duration-150 disabled:opacity-60"
        >
          {replyBusy ? '등록 중...' : '답글 등록'}
        </button>
      </div>
    </form>
  )

  return (
    <div className="mt-12">
      <div className="h-px bg-border mb-7" />
      <h3 className="text-md font-bold text-fg mb-5">
        댓글
        <span className="text-[0.9rem] font-normal text-fg-3 ml-2">{visibleCount}개</span>
      </h3>

      {!loading && topLevel.length > 0 && (
        <div className="flex flex-col gap-6 mb-7">
          {topLevel.map((parent) => {
            const replies = comments.filter((c) => c.parentId === parent.id)
            return (
              <div key={parent.id} className="flex flex-col">
                {renderComment(parent, false)}
                {replyTo === parent.id && renderReplyForm(parent.id)}
                {replies.length > 0 && (
                  <div className="mt-4 ml-5 sm:ml-12 pl-3 sm:pl-4 border-l-2 border-border flex flex-col gap-5">
                    {replies.map((child) => (
                      <div key={child.id} className="flex gap-2 items-start">
                        <CornerDownRight size={14} className="mt-2.5 shrink-0 text-[#cbd2da]" aria-hidden="true" />
                        <div className="flex-1 min-w-0">{renderComment(child, true)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <form onSubmit={submit} className="bg-surface border border-border rounded-[8px] p-5">
        {/* Honeypot — hidden from users; bots tend to fill every field. */}
        <input
          type="text"
          name="website"
          value={hp}
          onChange={(e) => setHp(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
        />
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
              {comments.some((c) => c.parentId === confirmTarget.id) ? (
                <span className="text-xs text-fg-3">대댓글이 있어 &lsquo;삭제된 댓글입니다&rsquo;로 표시됩니다.</span>
              ) : (
                <span className="text-xs text-fg-3">이 작업은 되돌릴 수 없습니다.</span>
              )}
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

      {pinTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => !pinDeleting && setPinTarget(null)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            className="bg-white rounded-[10px] w-full max-w-[360px] p-6"
            style={{ boxShadow: '0 12px 32px rgba(0,0,0,0.18)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-base font-bold text-fg mb-2">내 댓글 삭제</h4>
            <p className="text-sm text-fg-2 leading-relaxed mb-3">
              댓글 작성 시 설정한 <span className="font-semibold text-fg">비밀번호 4자리</span>를 입력하세요.
            </p>
            <input
              value={pinInput}
              onChange={(e) => { setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4)); setPinError(null) }}
              onKeyDown={(e) => { if (e.key === 'Enter') confirmPinDelete() }}
              placeholder="••••"
              inputMode="numeric"
              type="password"
              maxLength={4}
              autoFocus
              className="w-full px-3 py-2 border border-border rounded-[6px] text-sm outline-none bg-white tracking-[0.4em] text-center mb-2"
            />
            {pinError && (
              <p className="text-xs font-semibold px-3 py-2 rounded-[6px] mb-2"
                 style={{ background: '#FFF1F0', color: '#C0392B', border: '1px solid #FFD0D0' }}>
                {pinError}
              </p>
            )}
            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                disabled={pinDeleting}
                onClick={() => setPinTarget(null)}
                className="px-4 py-2 border border-border rounded-[6px] bg-white text-sm text-fg-2 hover:bg-surface transition-colors font-[inherit] disabled:opacity-60"
              >
                취소
              </button>
              <button
                type="button"
                disabled={pinDeleting}
                onClick={confirmPinDelete}
                className="px-4 py-2 rounded-[6px] text-sm font-semibold text-white transition-colors font-[inherit] disabled:opacity-60"
                style={{ background: '#C0392B' }}
              >
                {pinDeleting ? '삭제 중...' : '삭제'}
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
