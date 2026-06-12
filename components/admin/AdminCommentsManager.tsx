'use client'

import { useState, useEffect, useRef } from 'react'
import { Trash2, MessageSquare, Crown, ExternalLink } from 'lucide-react'
import { Post } from '@/lib/types'
import { supabase } from '@/lib/supabaseClient'
import { CommentRow } from '@/lib/supabase'

interface CommentWithMeta {
  id: number
  postId: number
  postTitle: string
  postSlug: string | null
  name: string
  text: string
  date: string
  created_at: string
  isAdmin: boolean
  parentId: number | null
  isDeleted: boolean
}

interface AdminCommentsManagerProps {
  posts: Post[]
}

// 포스트(제목) 열을 제외한 고정 폭 합계 — 드래그 시 테이블 최소 너비 계산용
const FIXED_W = 160 /*작성자*/ + 300 /*내용*/ + 120 /*작성일*/ + 96 /*관리*/

export default function AdminCommentsManager({ posts }: AdminCommentsManagerProps) {
  const [allComments, setAllComments] = useState<CommentWithMeta[]>([])
  const [postFilter, setPostFilter] = useState<number | 'all'>('all')
  const [loading, setLoading] = useState(true)

  // 포스트(제목) 열 사용자 조절 폭 — 대시보드와 동일한 인터랙션
  const [titleWidth, setTitleWidth] = useState(240)
  const [isDragging, setIsDragging] = useState(false)
  const resizingRef = useRef(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  useEffect(() => {
    supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          const titleMap = new Map(posts.map((p) => [p.id, p.title]))
          const slugMap = new Map(posts.map((p) => [p.id, p.slug]))
          setAllComments(
            (data as CommentRow[]).map((r) => ({
              id:         r.id,
              postId:     r.post_id,
              postTitle:  titleMap.get(r.post_id) ?? `포스트 #${r.post_id}`,
              postSlug:   slugMap.get(r.post_id) ?? null,
              name:       r.name,
              text:       r.text,
              date:       r.date,
              created_at: r.created_at,
              isAdmin:    r.is_admin,
              parentId:   r.parent_id,
              isDeleted:  r.is_deleted,
            }))
          )
        }
        setLoading(false)
      })
  }, [posts])

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    resizingRef.current   = true
    startXRef.current     = e.clientX
    startWidthRef.current = titleWidth
    setIsDragging(true)

    const onMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return
      const next = Math.max(120, Math.min(640, startWidthRef.current + ev.clientX - startXRef.current))
      setTitleWidth(next)
    }
    const onUp = () => {
      resizingRef.current = false
      setIsDragging(false)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const handleDelete = async (comment: CommentWithMeta) => {
    // A comment with replies leaves a "삭제된 댓글" trace (soft delete) so the
    // thread stays readable; a leaf is removed outright. Matches the public view.
    const hasChildren = allComments.some((c) => c.parentId === comment.id)
    if (!confirm(`"${comment.name}"의 댓글을 삭제하시겠습니까?`)) return

    if (hasChildren) {
      setAllComments((prev) => prev.map((c) =>
        c.id === comment.id ? { ...c, isDeleted: true, text: '', name: '' } : c))
      await supabase.from('comments').update({ is_deleted: true, text: '', name: '' }).eq('id', comment.id)
    } else {
      setAllComments((prev) => prev.filter((c) => c.id !== comment.id))
      await supabase.from('comments').delete().eq('id', comment.id)
    }
  }

  const postsWithComments = posts.filter((p) => allComments.some((c) => c.postId === p.id))
  const displayed = postFilter === 'all' ? allComments : allComments.filter((c) => c.postId === postFilter)

  return (
    <div className="p-8 max-w-[1100px]">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-[1.375rem] font-bold text-fg mb-1">댓글 관리</h1>
        <p className="text-sm text-fg-3">총 {allComments.length}개 댓글</p>
      </div>

      {/* Post filter */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        <button
          onClick={() => setPostFilter('all')}
          className="px-3.5 py-[5px] text-xs font-semibold rounded-sm border-none font-[inherit] transition-colors"
          style={{ background: postFilter === 'all' ? '#EBF3FF' : '#F3F4F6', color: postFilter === 'all' ? '#0070F3' : '#555' }}
        >
          전체
        </button>
        {postsWithComments.map((p) => (
          <button
            key={p.id}
            onClick={() => setPostFilter(p.id)}
            className="px-3.5 py-[5px] text-xs font-semibold rounded-sm border-none font-[inherit] transition-colors max-w-[220px] truncate"
            style={{ background: postFilter === p.id ? '#EBF3FF' : '#F3F4F6', color: postFilter === p.id ? '#0070F3' : '#555' }}
          >
            {p.title}
          </button>
        ))}
      </div>

      {/* Table — title column is user-resizable (drag the grip on its header) */}
      <div className="border border-border rounded-[8px] overflow-x-auto">
        <table className="border-collapse" style={{ tableLayout: 'fixed', width: '100%', minWidth: titleWidth + FIXED_W }}>
          <colgroup>
            <col style={{ width: titleWidth }} />
            <col style={{ width: 160 }} />
            <col />
            <col style={{ width: 120 }} />
            <col style={{ width: 96 }} />
          </colgroup>
          <thead>
            <tr className="bg-surface border-b border-border">
              <th className="relative px-4 py-2.5 text-left text-[11px] font-bold text-fg-3" style={{ letterSpacing: '0.04em' }}>
                포스트
                <div
                  onMouseDown={startResize}
                  title="드래그하여 포스트 열 너비 조절"
                  className="group/handle"
                  style={{
                    position: 'absolute', right: 0, top: 0, bottom: 0,
                    width: 14, cursor: 'col-resize', zIndex: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '0 2px 2px 0',
                    background: isDragging ? 'rgba(0,112,243,0.08)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  {isDragging ? (
                    <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 2, background: '#0070F3', borderRadius: 1 }} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="group-hover/handle:bg-accent"
                          style={{ width: 3, height: 3, borderRadius: '50%', background: '#C8CDD8', transition: 'background 0.15s' }} />
                      ))}
                    </div>
                  )}
                </div>
              </th>
              {['작성자', '내용', '작성일', '관리'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-[11px] font-bold text-fg-3" style={{ letterSpacing: '0.04em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-fg-3">
                  불러오는 중...
                </td>
              </tr>
            ) : displayed.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-fg-3">
                  <MessageSquare size={20} className="mx-auto mb-2 opacity-30" />
                  댓글이 없습니다.
                </td>
              </tr>
            ) : displayed.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface transition-colors duration-100">
                <td className="px-4 py-3 text-xs text-fg-2">
                  {c.postSlug ? (
                    <a
                      href={`/blog/${c.postSlug}#comments`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={c.postTitle}
                      className="group inline-flex items-center gap-1 max-w-full text-fg-2 hover:text-accent transition-colors"
                    >
                      <span className="overflow-hidden text-ellipsis whitespace-nowrap">{c.postTitle}</span>
                      <ExternalLink size={11} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ) : (
                    <div className="overflow-hidden text-ellipsis whitespace-nowrap" title={c.postTitle}>{c.postTitle}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-fg whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    {c.parentId != null && <span className="text-[10px] font-bold text-accent" title="대댓글">↳</span>}
                    {c.isAdmin && <Crown size={12} style={{ color: '#0070F3' }} />}
                    {c.isDeleted ? <span className="text-fg-3 font-normal italic">(삭제됨)</span> : c.name}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-fg-2">
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {c.isDeleted ? <span className="text-fg-3 italic">삭제된 댓글입니다.</span> : c.text}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-fg-3 whitespace-nowrap">{c.date}</td>
                <td className="px-4 py-3">
                  {!c.isDeleted && (
                    <button
                      onClick={() => handleDelete(c)}
                      className="inline-flex items-center gap-1 px-2.5 py-[5px] border border-border rounded-[5px] bg-white text-xs text-[#aaa] hover:text-[#C0392B] hover:border-[#FFD0D0] transition-colors font-[inherit]"
                    >
                      <Trash2 size={13} />삭제
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
