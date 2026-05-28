'use client'

import { useState, useRef } from 'react'
import { Megaphone, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

const COOLDOWN_KEY = 'dv_inquiry_cooldown'
const COOLDOWN_MS  = 60 * 1000
const EMAIL_RE     = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function AdInquiryForm() {
  const [company, setCompany] = useState('')
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [phone,   setPhone]   = useState('')
  const [message, setMessage] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [done,       setDone]       = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  // Lightweight bot defenses (no external captcha): honeypot + minimum dwell time.
  const [hp, setHp] = useState('')
  const mountedAt = useRef(Date.now())

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (hp.trim() !== '' || Date.now() - mountedAt.current < 2500) {
      setError('잠시 후 다시 시도해주세요.')
      return
    }

    const c = company.trim()
    const n = name.trim()
    const em = email.trim()
    const ph = phone.trim()
    const msg = message.trim()

    if (!n || !em || !msg) {
      setError('담당자명, 이메일, 문의 내용은 필수 항목입니다.')
      return
    }
    if (!EMAIL_RE.test(em)) {
      setError('올바른 이메일 주소를 입력해주세요.')
      return
    }
    if (n.length > 50 || c.length > 80) {
      setError('이름/회사명이 너무 깁니다.')
      return
    }
    if (msg.length > 2000) {
      setError('문의 내용은 최대 2000자까지 입력 가능합니다.')
      return
    }

    try {
      const last = localStorage.getItem(COOLDOWN_KEY)
      if (last && Date.now() - Number(last) < COOLDOWN_MS) {
        const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - Number(last))) / 1000)
        setError(`${remaining}초 후에 다시 문의를 보낼 수 있습니다.`)
        return
      }
    } catch { /* ignore */ }

    setSubmitting(true)
    // No .select() — ad_inquiries has no anon read policy (inquiries are private).
    const { error: insertError } = await supabase.from('ad_inquiries').insert({
      company: c || null,
      name:    n,
      email:   em,
      phone:   ph || null,
      message: msg,
      status:  'new',
    })
    setSubmitting(false)

    if (insertError) {
      setError('문의 전송에 실패했습니다. 잠시 후 다시 시도해주세요.')
      return
    }

    try { localStorage.setItem(COOLDOWN_KEY, String(Date.now())) } catch { /* ignore */ }
    setCompany(''); setName(''); setEmail(''); setPhone(''); setMessage('')
    setDone(true)
  }

  if (done) {
    return (
      <div className="border border-border rounded-[10px] bg-surface p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-accent-light flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 size={24} className="text-accent" />
        </div>
        <h2 className="text-lg font-bold text-fg mb-1.5">문의가 접수되었습니다</h2>
        <p className="text-sm text-fg-2 leading-relaxed mb-5">
          담당자가 확인 후 입력하신 이메일로 연락드리겠습니다. 감사합니다.
        </p>
        <button
          onClick={() => setDone(false)}
          className="px-4 py-2 border border-border rounded-[6px] bg-white text-sm text-fg-2 hover:bg-surface transition-colors font-[inherit]"
        >
          새 문의 작성
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="border border-border rounded-[10px] bg-surface p-5 md:p-6">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <Field label="회사 / 브랜드명">
          <input
            value={company}
            onChange={(e) => { setCompany(e.target.value); setError(null) }}
            placeholder="(선택) 회사 또는 브랜드명"
            maxLength={80}
            className="w-full px-3 py-2 border border-border rounded-[6px] text-sm outline-none bg-white"
          />
        </Field>
        <Field label="담당자명" required>
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); setError(null) }}
            placeholder="이름"
            maxLength={50}
            className="w-full px-3 py-2 border border-border rounded-[6px] text-sm outline-none bg-white"
          />
        </Field>
        <Field label="이메일" required>
          <input
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null) }}
            placeholder="reply@example.com"
            type="email"
            className="w-full px-3 py-2 border border-border rounded-[6px] text-sm outline-none bg-white"
          />
        </Field>
        <Field label="연락처">
          <input
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setError(null) }}
            placeholder="(선택) 010-0000-0000"
            maxLength={30}
            className="w-full px-3 py-2 border border-border rounded-[6px] text-sm outline-none bg-white"
          />
        </Field>
      </div>

      <Field label="문의 내용" required>
        <textarea
          value={message}
          onChange={(e) => { setMessage(e.target.value); setError(null) }}
          placeholder="광고 형태(배너/콘텐츠 등), 희망 기간, 예산 등을 자유롭게 적어주세요."
          rows={6}
          maxLength={2000}
          className="w-full px-3 py-2 border border-border rounded-[6px] text-sm outline-none resize-y bg-white"
        />
        <div className="flex justify-end mt-1">
          <span className="text-[11px]" style={{ color: message.length > 1800 ? '#D97706' : '#bbb' }}>
            {message.length}/2000
          </span>
        </div>
      </Field>

      {error && (
        <p className="text-xs font-semibold px-3 py-2 rounded-[6px] mb-3"
           style={{ background: '#FFF1F0', color: '#C0392B', border: '1px solid #FFD0D0' }}>
          {error}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-fg-3">입력하신 정보는 광고 문의 답변 목적으로만 사용됩니다.</span>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-1.5 px-[18px] py-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-[6px] transition-colors duration-150 disabled:opacity-60"
        >
          <Megaphone size={14} />
          {submitting ? '전송 중...' : '문의 보내기'}
        </button>
      </div>
    </form>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-fg-2 mb-1.5">
        {label}{required && <span className="text-[#C0392B] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
