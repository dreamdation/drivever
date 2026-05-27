'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Search, Pencil, Trash2, CheckCircle2, FileText } from 'lucide-react'
import { Post } from '@/lib/types'

const CAT_COLOR: Record<string, string> = {
  '교통법규':       '#0070F3',
  'Premium Garage': '#7C3AED',
  '안전운전':       '#059669',
  '차량관리':       '#D97706',
}
const CATS = ['전체', '교통법규', 'Premium Garage', '안전운전', '차량관리']

type SortKey = 'date' | 'status' | 'views' | 'comments'
export type BulkStatus = 'published' | 'draft' | 'trash'

type ColDef = { key: string; label: string; sortable?: SortKey }

const COLS: ColDef[] = [
  { key: 'no',      label: 'No.' },
  { key: 'title',    label: '제목' },
  { key: 'category', label: '카테고리' },
  { key: 'date',     label: '작성일',    sortable: 'date' },
  { key: 'views',    label: '조회수',    sortable: 'views' },
  { key: 'comments', label: '댓글수',    sortable: 'comments' },
  { key: 'readTime', label: '읽는 시간' },
  { key: 'status',   label: '상태',      sortable: 'status' },
  { key: 'actions',  label: '관리' },
]

// Fixed widths (px) for every non-title column. The title column gets a
// user-resizable width; a trailing spacer column absorbs leftover space so the
// table fills the wrapper at wide widths. The wrapper itself grows past the
// viewport (w-fit) when the columns need more room, so the last column ('휴지통')
// is never clipped — the content area scrolls instead.
const COL_W = { select: 44, no: 52, category: 130, date: 128, views: 88, comments: 88, readTime: 92, status: 100, actions: 130 }
const FIXED_W = Object.values(COL_W).reduce((a, b) => a + b, 0)

interface AdminDashboardProps {
  posts: Post[]
  commentCounts?: Record<number, number>
  heroPostIds?: number[]
  onEdit: (post: Post) => void
  onNew: () => void
  onTogglePublish: (id: number) => void
  onTrash: (id: number) => void
  onBulkStatus: (ids: number[], status: BulkStatus) => void
}

export default function AdminDashboard({ posts, commentCounts = {}, heroPostIds = [], onEdit, onNew, onTogglePublish, onTrash, onBulkStatus }: AdminDashboardProps) {
  const [statusFilter, setStatusFilter] = useState('전체')
  const [catFilter,    setCatFilter]    = useState('전체')
  const [search,       setSearch]       = useState('')
  const [sortKey,      setSortKey]      = useState<SortKey | null>(null)
  const [sortDir,      setSortDir]      = useState<'asc' | 'desc'>('desc')
  const [selected,     setSelected]     = useState<Set<number>>(new Set())
  const [titleWidth,   setTitleWidth]   = useState(460)
  const [isDragging,   setIsDragging]   = useState(false)
  const selectAllRef = useRef<HTMLInputElement>(null)
  const resizingRef   = useRef(false)
  const startXRef     = useRef(0)
  const startWidthRef = useRef(0)

  // Posts currently registered to a hero slide — their titles render in blue.
  const heroSet = new Set(heroPostIds)

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    resizingRef.current   = true
    startXRef.current     = e.clientX
    startWidthRef.current = titleWidth
    setIsDragging(true)

    const onMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return
      const next = Math.max(120, Math.min(720, startWidthRef.current + ev.clientX - startXRef.current))
      setTitleWidth(next)
    }
    const onUp = () => {
      resizingRef.current = false
      setIsDragging(false)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup',   onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup',   onUp)
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  // Stable post number: oldest = 1, newest = N (independent of display sort)
  const postNoMap = new Map(
    [...posts].sort((a, b) => a.date.localeCompare(b.date)).map((p, i) => [p.id, i + 1])
  )

  const catCount = (cat: string) =>
    cat === '전체' ? posts.length : posts.filter((p) => p.category === cat).length

  const filtered = posts.filter((p) => {
    const matchStatus =
      statusFilter === '전체' ||
      (statusFilter === '발행'     && p.published !== false) ||
      (statusFilter === '임시저장' && p.published === false)
    const matchCat = catFilter === '전체' || p.category === catFilter
    const q = search.toLowerCase()
    const matchQ = !search || p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    return matchStatus && matchCat && matchQ
  })

  const sorted = [...filtered].sort((a, b) => {
    if (!sortKey) return 0
    if (sortKey === 'date') {
      const cmp = a.date.localeCompare(b.date)
      return sortDir === 'desc' ? -cmp : cmp
    }
    if (sortKey === 'views') {
      const cmp = (a.views ?? 0) - (b.views ?? 0)
      return sortDir === 'desc' ? -cmp : cmp
    }
    if (sortKey === 'comments') {
      const cmp = (commentCounts[a.id] ?? 0) - (commentCounts[b.id] ?? 0)
      return sortDir === 'desc' ? -cmp : cmp
    }
    // status
    const aVal = a.published !== false ? 1 : 0
    const bVal = b.published !== false ? 1 : 0
    return sortDir === 'desc' ? bVal - aVal : aVal - bVal
  })

  // ── Selection ──────────────────────────────────────────────
  const allVisibleSelected = sorted.length > 0 && sorted.every((p) => selected.has(p.id))
  const someVisibleSelected = sorted.some((p) => selected.has(p.id))

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someVisibleSelected && !allVisibleSelected
    }
  }, [someVisibleSelected, allVisibleSelected])

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) sorted.forEach((p) => next.delete(p.id))
      else                    sorted.forEach((p) => next.add(p.id))
      return next
    })
  }

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else              next.add(id)
      return next
    })
  }

  const applyBulk = (status: BulkStatus) => {
    const ids = [...selected]
    if (ids.length === 0) return
    if (status === 'trash' && !confirm(`선택한 ${ids.length}개 포스트를 휴지통으로 이동하시겠습니까?`)) return
    onBulkStatus(ids, status)
    setSelected(new Set())
  }

  return (
    <div className="p-8">
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
      <div className="flex flex-col gap-2 mb-5">
        {/* Row 1: status chips + search */}
        <div className="flex gap-3 items-center">
          <div className="flex gap-1">
            {['전체', '발행', '임시저장'].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className="px-3.5 py-[5px] text-xs font-semibold rounded-sm border-none font-[inherit] transition-colors"
                style={{
                  background: statusFilter === f ? '#EBF3FF' : '#F3F4F6',
                  color:      statusFilter === f ? '#0070F3' : '#555',
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

        {/* Row 2: category chips with post counts */}
        <div className="flex gap-1 flex-wrap">
          {CATS.map((cat) => {
            const color = CAT_COLOR[cat] ?? '#0070F3'
            const active = catFilter === cat
            return (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className="px-3 py-[4px] text-xs font-semibold rounded-full border-none font-[inherit] transition-colors"
                style={{
                  background: active ? `${color}18` : '#F3F4F6',
                  color:      active ? color : '#555',
                  border:     active ? `1px solid ${color}40` : '1px solid transparent',
                }}
              >
                {cat} ({catCount(cat)})
              </button>
            )
          })}
        </div>
      </div>

      {/* Bulk action bar — shown when one or more posts are selected */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-3 px-4 py-2.5 rounded-[8px] border border-accent-border bg-accent-light flex-wrap">
          <span className="text-sm font-bold text-accent">{selected.size}개 선택됨</span>
          <span className="text-xs text-fg-3">상태 일괄 변경:</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => applyBulk('published')}
              className="inline-flex items-center gap-1 px-3 py-[5px] rounded-[6px] border-none cursor-pointer text-xs font-bold font-[inherit] transition-colors"
              style={{ background: '#ECFDF5', color: '#059669' }}
            >
              <CheckCircle2 size={13} /> 발행
            </button>
            <button
              onClick={() => applyBulk('draft')}
              className="inline-flex items-center gap-1 px-3 py-[5px] rounded-[6px] border-none cursor-pointer text-xs font-bold font-[inherit] transition-colors"
              style={{ background: '#F3F4F6', color: '#555' }}
            >
              <FileText size={13} /> 임시저장
            </button>
            <button
              onClick={() => applyBulk('trash')}
              className="inline-flex items-center gap-1 px-3 py-[5px] rounded-[6px] border-none cursor-pointer text-xs font-bold font-[inherit] transition-colors"
              style={{ background: '#FFF0F0', color: '#C0392B' }}
            >
              <Trash2 size={13} /> 휴지통
            </button>
          </div>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs text-fg-3 hover:text-fg bg-transparent border-none cursor-pointer font-[inherit]"
          >
            선택 해제
          </button>
        </div>
      )}

      {/* Table — the box (w-fit min-w-full) fills the area at wide widths and
          grows past it when columns need more room, so '휴지통' is never clipped. */}
      <div className="border border-border rounded-[8px] overflow-hidden bg-surface w-fit min-w-full">
        <table
          className="border-collapse"
          style={{ tableLayout: 'fixed', width: '100%', minWidth: titleWidth + FIXED_W }}
        >
          <colgroup>
            <col style={{ width: COL_W.select }} />
            <col style={{ width: COL_W.no }} />
            <col style={{ width: titleWidth }} />
            <col style={{ width: COL_W.category }} />
            <col style={{ width: COL_W.date }} />
            <col style={{ width: COL_W.views }} />
            <col style={{ width: COL_W.comments }} />
            <col style={{ width: COL_W.readTime }} />
            <col style={{ width: COL_W.status }} />
            <col style={{ width: COL_W.actions }} />
            <col />
          </colgroup>
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-2.5 text-center">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleAll}
                  className="w-4 h-4 cursor-pointer align-middle"
                  style={{ accentColor: '#0070F3' }}
                  aria-label="전체 선택"
                />
              </th>
              {COLS.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-2.5 text-[11px] font-bold text-fg-3 select-none whitespace-nowrap"
                  style={{
                    letterSpacing: '0.04em',
                    cursor: col.sortable ? 'pointer' : 'default',
                    position: col.key === 'title' ? 'relative' : undefined,
                    textAlign: col.key === 'no' ? 'center' : 'left',
                  }}
                  onClick={() => col.sortable && handleSort(col.sortable)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <span
                        className="text-[10px] leading-none"
                        style={{ color: sortKey === col.sortable ? '#0070F3' : '#ccc' }}
                      >
                        {sortKey === col.sortable ? (sortDir === 'desc' ? '▼' : '▲') : '▲▼'}
                      </span>
                    )}
                  </span>
                  {col.key === 'title' && (
                    <div
                      onMouseDown={startResize}
                      onClick={(e) => e.stopPropagation()}
                      title="드래그하여 제목 열 너비 조절"
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
                      {isDragging && (
                        <div style={{
                          position: 'absolute', right: 0, top: 0, bottom: 0,
                          width: 2, background: '#0070F3', borderRadius: 1,
                        }} />
                      )}
                      {!isDragging && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              className="group-hover/handle:bg-accent"
                              style={{
                                width: 3, height: 3, borderRadius: '50%',
                                background: '#C8CDD8',
                                transition: 'background 0.15s',
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => {
              const cc = CAT_COLOR[p.category] || '#555'
              const inHero = heroSet.has(p.id)
              const isSel = selected.has(p.id)
              return (
                <tr
                  key={p.id}
                  className="bg-white border-b border-border last:border-0 hover:bg-surface transition-colors duration-100"
                  style={isSel ? { background: '#F5F9FF' } : undefined}
                >
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={() => toggleOne(p.id)}
                      className="w-4 h-4 cursor-pointer align-middle"
                      style={{ accentColor: '#0070F3' }}
                      aria-label={`${p.title} 선택`}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-fg-3 tabular-nums text-center whitespace-nowrap">{postNoMap.get(p.id)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-fg">
                    <button
                      onClick={() => onEdit(p)}
                      title={inHero ? '히어로 슬라이드에 등록된 포스트' : undefined}
                      className="overflow-hidden text-ellipsis whitespace-nowrap text-left w-full border-none bg-transparent font-semibold font-[inherit] text-sm transition-colors cursor-pointer"
                      style={inHero ? { color: '#0070F3' } : undefined}
                    >
                      {p.title}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    <span
                      className="px-2 py-[2px] rounded-sm text-[11px] font-semibold"
                      style={{ background: `${cc}18`, color: cc }}
                    >
                      {p.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-fg-3 whitespace-nowrap">{p.date}</td>
                  <td className="px-4 py-3 text-xs text-fg-3 tabular-nums whitespace-nowrap">
                    {(p.views ?? 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-fg-3 tabular-nums whitespace-nowrap">
                    {(commentCounts[p.id] ?? 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-fg-3 whitespace-nowrap">{p.readTime}분</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => onTogglePublish(p.id)}
                      className="px-2.5 py-[3px] rounded-full border-none cursor-pointer text-[11px] font-bold font-[inherit] transition-all duration-150 whitespace-nowrap"
                      style={{
                        background: p.published !== false ? '#ECFDF5' : '#F3F4F6',
                        color:      p.published !== false ? '#059669' : '#888',
                      }}
                    >
                      {p.published !== false ? '발행중' : '임시저장'}
                    </button>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => onEdit(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-[5px] border border-border rounded-[5px] bg-white text-xs text-fg-2 hover:text-accent hover:border-accent transition-colors font-[inherit] whitespace-nowrap"
                      >
                        <Pencil size={13} />수정
                      </button>
                      <button
                        onClick={() => { if (confirm('이 포스트를 휴지통으로 보내시겠습니까?\n휴지통에서 복원하거나 완전 삭제할 수 있습니다.')) onTrash(p.id) }}
                        className="inline-flex items-center gap-1 px-2.5 py-[5px] border border-border rounded-[5px] bg-white text-xs text-[#aaa] hover:text-[#C0392B] hover:border-[#FFD0D0] transition-colors font-[inherit] whitespace-nowrap"
                        title="휴지통으로 이동"
                      >
                        <Trash2 size={13} />휴지통
                      </button>
                    </div>
                  </td>
                  <td />
                </tr>
              )
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-10 text-center text-sm text-fg-3">
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
