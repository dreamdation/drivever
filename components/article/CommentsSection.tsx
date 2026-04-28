'use client'

import { useState, useEffect } from 'react'
import { Comment } from '@/lib/types'

const AVATAR_COLORS = ['#0070F3', '#7C3AED', '#059669', '#D97706', '#DB2777']

function avatarColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

interface CommentsSectionProps {
  postId: number
}

export default function CommentsSection({ postId }: CommentsSectionProps) {
  const key = `dv_comments_${postId}`
  const [comments, setComments] = useState<Comment[]>([])
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    try {
      const s = localStorage.getItem(key)
      if (s) setComments(JSON.parse(s))
    } catch { /* empty */ }
  }, [key])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !text.trim()) return
    const newC: Comment = {
      id: Date.now(),
      name: name.trim(),
      text: text.trim(),
      date: new Date().toLocaleDateString('ko-KR'),
    }
    const updated = [...comments, newC]
    setComments(updated)
    localStorage.setItem(key, JSON.stringify(updated))
    setName('')
    setText('')
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <div className="mt-12">
      <div className="h-px bg-border mb-7" />
      <h3 className="text-md font-bold text-fg mb-5">
        댓글
        <span className="text-[0.9rem] font-normal text-fg-3 ml-2">{comments.length}개</span>
      </h3>

      {/* Comment list */}
      {comments.length > 0 && (
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
      <form
        onSubmit={submit}
        className="bg-surface border border-border rounded-[8px] p-5"
      >
        <div className="mb-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름"
            className="w-full px-3 py-2 border border-border rounded-[6px] text-sm outline-none bg-white"
          />
        </div>
        <div className="mb-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="댓글을 입력하세요..."
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-[6px] text-sm outline-none resize-y bg-white"
          />
        </div>
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
