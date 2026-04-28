'use client'

import { useState } from 'react'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { Post } from '@/lib/types'
import { getCategoryStyle } from '@/lib/utils'

const CAT_COLOR: Record<string, string> = {
  '교통법규': '#0070F3',
  'Premium Garage': '#7C3AED',
  '안전운전': '#059669',
  '차량관리': '#D97706',
}

interface AdminDashboardProps {
  posts: Post[]
  onEdit: (post: Post) => void
  onNew: () => void
  onTogglePublish: (id: number) => void
  onDelete: (id: number) => void
}

export default function AdminDashboard({ posts, onEdit, onNew, onTogglePublish, onDelete }: AdminDashboardProps) {
  const [filter, setFilter] = useState('전체')
  const [search, setSearch] = useState('')

  const filtered = posts.filter((p) => {
    const matchCat =
      filter === '전체' ||
      (filter === '발행' && p.published !== false) ||
      (filter === '임시저장' && p.published === false)
    const matchQ = !search || p.title.includes(search) || p.category.includes(search)
    return matchCat && matchQ
  })

  return (
    <div className="p-8 max-w-[960px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-[1.375rem] font-bold text-fg mb-1">포스트 관리</h1>
          <p className="text-sm text-fg-3">
            총 {posts.length}개 포스트 · 발행 {posts.filter((p) => p.published !== false).length}개
          </p>
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-[6px] transition-colors border-none font-[inherit]"
        >
          <Plus size={14} strokeWidth={2.5} />
          새 글 작성
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex gap-3 items-center mb-5">
        <div className="flex gap-1">
          {['전체', '발행', '임시저장'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3.5 py-[5px] text-xs font-semibold rounded-sm border-none font-[inherit] transition-colors"
              style={{
                background: filter === f ? '#EBF3FF' : '#F3F4F6',
                color: filter === f ? '#0070F3' : '#555',
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 border border-border rounded-[6px] px-3 py-1.5 bg-white">
          <Search size={13} className="text-[#aaa]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="제목·카테고리 검색..."
            className="border-none outline-none text-sm text-fg w-[200px] bg-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-[8px] overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-surface border-b border-border">
              {['제목', '카테고리', '작성일', '읽는 시간', '상태', '관리'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-[11px] font-bold text-fg-3" style={{ letterSpacing: '0.04em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => {
              const cc = CAT_COLOR[p.category] || '#555'
              return (
                <tr
                  key={p.id}
                  className="border-b border-border last:border-0 hover:bg-surface transition-colors duration-100"
                >
                  <td className="px-4 py-3 text-sm font-semibold text-fg max-w-[280px]">
                    <div className="overflow-hidden text-ellipsis whitespace-nowrap">{p.title}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className="px-2 py-[2px] rounded-sm text-[11px] font-semibold"
                      style={{ background: `${cc}18`, color: cc }}
                    >
                      {p.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-fg-3">{p.date}</td>
                  <td className="px-4 py-3 text-xs text-fg-3">{p.readTime}분</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onTogglePublish(p.id)}
                      className="px-2.5 py-[3px] rounded-full border-none cursor-pointer text-[11px] font-bold font-[inherit] transition-all duration-150"
                      style={{
                        background: p.published !== false ? '#ECFDF5' : '#F3F4F6',
                        color: p.published !== false ? '#059669' : '#888',
                      }}
                    >
                      {p.published !== false ? '발행중' : '임시저장'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => onEdit(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-[5px] border border-border rounded-[5px] bg-white text-xs text-fg-2 hover:text-accent hover:border-accent transition-colors font-[inherit]"
                      >
                        <Pencil size={13} />수정
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('이 포스트를 삭제하시겠습니까?')) onDelete(p.id)
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-[5px] border border-border rounded-[5px] bg-white text-xs text-[#aaa] hover:text-[#C0392B] hover:border-[#FFD0D0] transition-colors font-[inherit]"
                      >
                        <Trash2 size={13} />삭제
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-fg-3">
                  검색 결과가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
