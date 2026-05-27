'use client'

import { useState } from 'react'
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react'
import { Post } from '@/lib/types'

const CAT_COLOR: Record<string, string> = {
  '교통법규':       '#0070F3',
  'Premium Garage': '#7C3AED',
  '안전운전':       '#059669',
  '차량관리':       '#D97706',
}

interface AdminTrashManagerProps {
  posts: Post[]
  onRestore: (id: number) => Promise<void> | void
  onPurge:   (id: number) => Promise<void> | void
}

function formatTrashedAt(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('ko-KR')
}

export default function AdminTrashManager({ posts, onRestore, onPurge }: AdminTrashManagerProps) {
  const [purgeTarget,  setPurgeTarget]  = useState<Post | null>(null)
  const [busyId,       setBusyId]       = useState<number | null>(null)
  const [toast,        setToast]        = useState<string | null>(null)

  const sorted = [...posts].sort((a, b) => (b.deletedAt ?? '').localeCompare(a.deletedAt ?? ''))

  const handleRestore = async (id: number) => {
    setBusyId(id)
    await onRestore(id)
    setBusyId(null)
    setToast('포스트를 복원했습니다.')
    setTimeout(() => setToast(null), 2500)
  }

  const handleConfirmPurge = async () => {
    if (!purgeTarget) return
    setBusyId(purgeTarget.id)
    await onPurge(purgeTarget.id)
    setBusyId(null)
    setPurgeTarget(null)
    setToast('포스트를 완전 삭제했습니다.')
    setTimeout(() => setToast(null), 2500)
  }

  return (
    <div className="p-8 max-w-[1200px]">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-[1.375rem] font-bold text-fg mb-1">휴지통</h1>
          <p className="text-sm text-fg-3">
            총 {posts.length}개 · 완전 삭제 시 본문과 댓글까지 함께 영구 삭제됩니다.
          </p>
        </div>
      </div>

      <div className="border border-border rounded-[8px] overflow-hidden bg-surface">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-surface border-b border-border">
              {['제목', '카테고리', '작성일', '삭제일', '관리'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-left text-[11px] font-bold text-fg-3"
                  style={{ letterSpacing: '0.04em' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-14 text-center text-sm text-fg-3 bg-white">
                  <Trash2 size={22} className="mx-auto mb-2 opacity-30" />
                  휴지통이 비어 있습니다.
                </td>
              </tr>
            ) : sorted.map((p) => {
              const cc = CAT_COLOR[p.category] ?? '#555'
              return (
                <tr key={p.id} className="bg-white border-b border-border last:border-0 hover:bg-surface transition-colors duration-100">
                  <td className="px-4 py-3 text-sm font-semibold text-fg max-w-[420px]">
                    <div className="overflow-hidden text-ellipsis whitespace-nowrap">{p.title}</div>
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
                  <td className="px-4 py-3 text-xs text-fg-3 whitespace-nowrap">{formatTrashedAt(p.deletedAt)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleRestore(p.id)}
                        disabled={busyId === p.id}
                        className="inline-flex items-center gap-1 px-2.5 py-[5px] border border-border rounded-[5px] bg-white text-xs text-fg-2 hover:text-accent hover:border-accent transition-colors font-[inherit] disabled:opacity-50"
                      >
                        <RotateCcw size={13} />복원
                      </button>
                      <button
                        onClick={() => setPurgeTarget(p)}
                        disabled={busyId === p.id}
                        className="inline-flex items-center gap-1 px-2.5 py-[5px] border border-border rounded-[5px] bg-white text-xs text-[#aaa] hover:text-[#C0392B] hover:border-[#FFD0D0] transition-colors font-[inherit] disabled:opacity-50"
                      >
                        <Trash2 size={13} />완전 삭제
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {purgeTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => busyId === null && setPurgeTarget(null)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            className="bg-white rounded-[10px] w-full max-w-[400px] p-6"
            style={{ boxShadow: '0 12px 32px rgba(0,0,0,0.2)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: '#FFF0F0', color: '#C0392B' }}
              >
                <AlertTriangle size={18} />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-bold text-fg mb-1">포스트를 완전 삭제할까요?</h4>
                <p className="text-sm text-fg-2 leading-relaxed">
                  <span className="font-semibold text-fg">{purgeTarget.title}</span>
                </p>
              </div>
            </div>
            <p className="text-xs text-fg-3 leading-relaxed mb-5 px-1">
              이 작업은 되돌릴 수 없습니다. 포스트 본문, 댓글이 모두 영구적으로 삭제되며,
              연결된 히어로 슬라이드는 분리됩니다.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={busyId !== null}
                onClick={() => setPurgeTarget(null)}
                className="px-4 py-2 border border-border rounded-[6px] bg-white text-sm text-fg-2 hover:bg-surface transition-colors font-[inherit] disabled:opacity-60"
              >
                취소
              </button>
              <button
                type="button"
                disabled={busyId !== null}
                onClick={handleConfirmPurge}
                className="px-4 py-2 rounded-[6px] text-sm font-semibold text-white transition-colors font-[inherit] disabled:opacity-60"
                style={{ background: '#C0392B' }}
              >
                {busyId !== null ? '삭제 중...' : '완전 삭제'}
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
