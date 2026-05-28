'use client'

import { useState, useEffect } from 'react'
import { Megaphone, Trash2, Mail, Phone, Building2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { AdInquiryRow, InquiryStatus } from '@/lib/supabase'

const STATUS_META: Record<InquiryStatus, { label: string; bg: string; color: string }> = {
  new:      { label: '신규',     bg: '#EBF3FF', color: '#0070F3' },
  read:     { label: '확인',     bg: '#F3F4F6', color: '#555'    },
  replied:  { label: '답변완료', bg: '#ECFDF5', color: '#059669' },
  archived: { label: '보관',     bg: '#F3F4F6', color: '#999'    },
}
const FILTERS: ('all' | InquiryStatus)[] = ['all', 'new', 'read', 'replied', 'archived']

function formatDate(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' })
}

// Gmail web compose URL — opens in the browser using the currently logged-in
// Gmail account (more convenient than a mailto: that launches a desktop client).
function gmailComposeUrl(to: string, subject: string, body: string) {
  const params = new URLSearchParams({ view: 'cm', fs: '1', to, su: subject, body })
  return `https://mail.google.com/mail/?${params.toString()}`
}

export default function AdminInquiriesManager() {
  const [inquiries, setInquiries] = useState<AdInquiryRow[]>([])
  const [filter,    setFilter]    = useState<'all' | InquiryStatus>('all')
  const [loading,   setLoading]   = useState(true)
  const [toast,     setToast]     = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('ad_inquiries')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setInquiries(data as AdInquiryRow[])
        setLoading(false)
      })
  }, [])

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2200) }

  const setStatus = async (id: number, status: InquiryStatus) => {
    setInquiries((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)))
    const { error } = await supabase.from('ad_inquiries').update({ status }).eq('id', id)
    if (error) flash('상태 변경에 실패했습니다.')
  }

  const remove = async (id: number) => {
    if (!confirm('이 문의를 삭제하시겠습니까? 되돌릴 수 없습니다.')) return
    setInquiries((prev) => prev.filter((q) => q.id !== id))
    const { error } = await supabase.from('ad_inquiries').delete().eq('id', id)
    flash(error ? '삭제에 실패했습니다.' : '문의를 삭제했습니다.')
  }

  const count = (f: 'all' | InquiryStatus) =>
    f === 'all' ? inquiries.length : inquiries.filter((q) => q.status === f).length

  const displayed = filter === 'all' ? inquiries : inquiries.filter((q) => q.status === filter)

  return (
    <div className="p-8 max-w-[860px]">
      <div className="mb-7">
        <h1 className="text-[1.375rem] font-bold text-fg mb-1">광고 문의</h1>
        <p className="text-sm text-fg-3">
          총 {inquiries.length}건 · 신규 {count('new')}건
        </p>
      </div>

      {/* Status filter */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {FILTERS.map((f) => {
          const active = filter === f
          const label = f === 'all' ? '전체' : STATUS_META[f].label
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3.5 py-[5px] text-xs font-semibold rounded-sm border-none font-[inherit] transition-colors"
              style={{ background: active ? '#EBF3FF' : '#F3F4F6', color: active ? '#0070F3' : '#555' }}
            >
              {label} ({count(f)})
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-fg-3">불러오는 중...</div>
      ) : displayed.length === 0 ? (
        <div className="py-16 text-center text-sm text-fg-3 border border-dashed border-border rounded-[8px]">
          <Megaphone size={22} className="mx-auto mb-2 opacity-30" />
          문의가 없습니다.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {displayed.map((q) => {
            const meta = STATUS_META[q.status]
            return (
              <div key={q.id} className="border border-border rounded-[10px] bg-white p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-bold text-fg">{q.name}</span>
                      {q.company && (
                        <span className="inline-flex items-center gap-1 text-xs text-fg-3">
                          <Building2 size={11} />{q.company}
                        </span>
                      )}
                      <span
                        className="px-2 py-[1px] rounded-full text-[10px] font-bold"
                        style={{ background: meta.bg, color: meta.color }}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap text-[12px] text-fg-2">
                      <a href={`mailto:${q.email}`} className="inline-flex items-center gap-1 hover:text-accent">
                        <Mail size={12} />{q.email}
                      </a>
                      {q.phone && (
                        <span className="inline-flex items-center gap-1"><Phone size={12} />{q.phone}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-fg-3 whitespace-nowrap shrink-0">{formatDate(q.created_at)}</span>
                </div>

                <p className="text-sm text-[#444] leading-[1.65] whitespace-pre-wrap break-words mb-3">
                  {q.message}
                </p>

                <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-border">
                  {(['new', 'read', 'replied', 'archived'] as InquiryStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(q.id, s)}
                      disabled={q.status === s}
                      className="px-2.5 py-[4px] rounded-[6px] border-none cursor-pointer text-[11px] font-bold font-[inherit] transition-colors disabled:opacity-100 disabled:cursor-default"
                      style={{
                        background: q.status === s ? STATUS_META[s].bg : '#FAFAFA',
                        color:      q.status === s ? STATUS_META[s].color : '#888',
                        outline:    q.status === s ? `1px solid ${STATUS_META[s].color}40` : '1px solid #EEE',
                      }}
                    >
                      {STATUS_META[s].label}
                    </button>
                  ))}
                  <a
                    href={gmailComposeUrl(
                      q.email,
                      '[Drivever] 광고 문의 회신',
                      `안녕하세요, ${q.name}님.\n\nDrivever 광고 문의 주셔서 감사합니다.\n\n\n------------------------------\n보내주신 문의:\n${q.message}`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto inline-flex items-center gap-1 px-2.5 py-[5px] border border-border rounded-[5px] bg-white text-xs text-fg-2 hover:text-accent hover:border-accent transition-colors"
                  >
                    <Mail size={12} />답장
                  </a>
                  <button
                    onClick={() => remove(q.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-[5px] border border-border rounded-[5px] bg-white text-xs text-[#aaa] hover:text-[#C0392B] hover:border-[#FFD0D0] transition-colors font-[inherit]"
                  >
                    <Trash2 size={12} />삭제
                  </button>
                </div>
              </div>
            )
          })}
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
