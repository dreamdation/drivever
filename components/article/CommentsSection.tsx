'use client'

import { useState, useEffect } from 'react'
import { Comment } from '@/lib/types'
import { supabase } from '@/lib/supabase'

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

function countUrls(t: string) { return (t.match(URL_RE) ?? []).length }
function hasRepeat(t: string)  { return /(.)\1{9,}/.test(t) }

interface CommentsSectionProps {
  postId: number
}

export default function CommentsSection({ postId }: CommentsSectionProps) {
  const [comments,  setComments]  = useState<Comment[]>([])
  const [name,      setName]      = useState('')
  const [text,      setText]      = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [warning,   setWarning]   = useState<string | null>(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    supabase
      .from('comments')
      .select('id, name, text, date, created_at')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) {
          setComments(data.map((r) => ({ id: r.id, name: r.name, text: r.text, date: r.date })))
        }
        setLoading(false)
      })
  }, [postId])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setWarning(null)

    const trimName = name.trim()
    const trimText = text.trim()

    if (!trimName || !trimText) {
      setError('이름과 댓글 내용을 입력해주세요.')
      return
    }
    if (trimName.length > 30) {
      setError('이름은 최대 30자까지 입력 가능합니다.')
      return
    }
    if (trimText.length > 500) {
      setError('댓글은 최대 500자까지 입력 가능합니다.')
      return
    }

    // Rate limit: 60s cooldown (device-local is intentional)
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

    // Optimistic update
    const tempId = Date.now()
    const optimistic: Comment = { id: tempId, name: trimName, text: trimText, date: dateStr }
    setComments((prev) => [...prev, optimistic])
    setName('')
    setText('')
    setSubmitted(true)
    try { localStorage.setItem(COOLDOWN_KEY, String(Date.now())) } catch { /* empty */ }
    setTimeout(() => { setSubmitted(false); setWarning(null) }, 3000)

    // Persist to Supabase
    const { data, error: insertError } = await supabase
      .from('comments')
      .insert({ post_id: postId, name: trimName, text: trimText, date: dateStr })
      .select('id')
      .single()

    if (insertError) {
      // Roll back optimistic update
      setComments((prev) => prev.filter((c) => c.id !== tempId))
      setError('댓글 등록에 실패했습니다. 다시 시도해주세요.')
      return
    }

    // Replace temp id with real id from Supabase
    if (data) {
      setComments((prev) => prev.map((c) => c.id === tempId ? { ...c, id: data.id } : c))
    }
  }

  return (
    <div className="mt-12">
      <div className="h-px bg-border mb-7" />
      <h3 className="text-md font-bold text-fg mb-5">
        댓글
        <span className="text-[0.9rem] font-normal text-fg-3 ml-2">{comments.length}개</span>
      </h3>

      {/* Comment list */}
      {!loading && comments.length > 0 && (
        <div className="flex flex-col gap-5 mb-7">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3 items-start">
              <div
                className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white font-bold text-sm"
                style={{ background: avatarColor(c.name) }}
              >
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-fg">{c.name}</span>
                  <span className="text-[11px] text-[#bbb]">{c.date}</span>
                </div>
                <p className="text-[0.9375rem] text-[#444] leading-[1.65]">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment form */}
      <form onSubmit={submit} className="bg-surface border border-border rounded-[8px] p-5">
        <div className="mb-3">
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); setError(null) }}
            placeholder="이름"
            maxLength={30}
            className="w-full px-3 py-2 border border-border rounded-[6px] text-sm outline-none bg-white"
          />
        </div>
        <div className="mb-3">
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setError(null) }}
            placeholder="댓글을 입력하세요..."
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 border border-border rounded-[6px] text-sm outline-none resize-y bg-white"
          />
          <div className="flex justify-end mt-1">
            <span className="text-[11px]" style={{ color: text.length > 450 ? '#D97706' : '#bbb' }}>
              {text.length}/500
            </span>
          </div>
        </div>

        {/* Feedback messages */}
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
    </div>
  )
}
