'use client'

import { useState, useEffect } from 'react'
import { Trash2, MessageSquare, Crown } from 'lucide-react'
import { Post } from '@/lib/types'
import { supabase, CommentRow } from '@/lib/supabase'

interface CommentWithMeta {
  id: number
  postId: number
  postTitle: string
  name: string
  text: string
  date: string
  created_at: string
  isAdmin: boolean
}

interface AdminCommentsManagerProps {
  posts: Post[]
}

export default function AdminCommentsManager({ posts }: AdminCommentsManagerProps) {
  const [allComments, setAllComments] = useState<CommentWithMeta[]>([])
  const [postFilter, setPostFilter] = useState<number | 'all'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          const postMap = new Map(posts.map((p) => [p.id, p.title]))
          setAllComments(
            (data as CommentRow[]).map((r) => ({
              id:         r.id,
              postId:     r.post_id,
              postTitle:  postMap.get(r.post_id) ?? `포스트 #${r.post_id}`,
              name:       r.name,
              text:       r.text,
              date:       r.date,
              created_at: r.created_at,
              isAdmin:    r.is_admin,
            }))
          )
        }
        setLoading(false)
      })
  }, [posts])

  const handleDelete = async (comment: CommentWithMeta) => {
    if (!confirm(`"${comment.name}"의 댓글을 삭제하시겠습니까?`)) return
    setAllComments((prev) => prev.filter((c) => c.id !== comment.id))
    await supabase.from('comments').delete().eq('id', comment.id)
  }

  const postsWithComments = posts.filter((p) => allComments.some((c) => c.postId === p.id))
  const displayed = postFilter === 'all' ? allComments : allComments.filter((c) => c.postId === postFilter)

  return (
    <div className="p-8 max-w-[960px]">
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

      {/* Table */}
      <div className="border border-border rounded-[8px] overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-surface border-b border-border">
              {['포스트', '작성자', '내용', '작성일', '관리'].map((h) => (
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
                <td className="px-4 py-3 text-xs text-fg-2 max-w-[180px]">
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap">{c.postTitle}</div>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-fg whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    {c.isAdmin && <Crown size={12} style={{ color: '#0070F3' }} />}
                    {c.name}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-fg-2 max-w-[300px]">
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap">{c.text}</div>
                </td>
                <td className="px-4 py-3 text-xs text-fg-3 whitespace-nowrap">{c.date}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleDelete(c)}
                    className="inline-flex items-center gap-1 px-2.5 py-[5px] border border-border rounded-[5px] bg-white text-xs text-[#aaa] hover:text-[#C0392B] hover:border-[#FFD0D0] transition-colors font-[inherit]"
                  >
                    <Trash2 size={13} />삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
