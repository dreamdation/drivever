'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'

export default function LoginClient() {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pw,
    })

    if (error) {
      setErr('이메일 또는 비밀번호가 올바르지 않습니다.')
      setLoading(false)
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div
        className="bg-white border border-border rounded-xl p-10 w-[400px]"
        style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
      >
        <Link href="/" className="flex items-center justify-center gap-2 mb-6 group">
          <Image src="/favicon-drivever-512.png" width={36} height={36} alt="Drivever" className="object-contain" />
          <span className="text-md font-bold text-fg group-hover:text-accent transition-colors" style={{ letterSpacing: '-0.02em' }}>Drivever</span>
        </Link>

        <h1 className="text-[1.375rem] font-bold text-fg text-center mb-1.5">관리자 로그인</h1>
        <p className="text-sm text-fg-3 text-center mb-6 leading-relaxed">
          블로그 관리 페이지에 접근하려면 로그인이 필요합니다.
        </p>

        <form onSubmit={handle} className="flex flex-col gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-fg-2 mb-1.5">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErr('') }}
              placeholder="admin@example.com"
              autoFocus
              autoComplete="email"
              className="w-full px-3 py-2.5 border border-border rounded-[6px] text-[0.9375rem] outline-none transition-colors focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-fg-2 mb-1.5">비밀번호</label>
            <input
              type="password"
              value={pw}
              onChange={(e) => { setPw(e.target.value); setErr('') }}
              placeholder="••••••••••"
              autoComplete="current-password"
              className="w-full px-3 py-2.5 border border-border rounded-[6px] text-[0.9375rem] outline-none transition-colors focus:border-accent"
            />
          </div>

          {err && (
            <div
              className="px-3.5 py-2.5 text-sm rounded-[6px]"
              style={{ background: '#FFF0F0', border: '1px solid #FFD0D0', color: '#C0392B' }}
            >
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="py-3 bg-accent hover:bg-accent-hover text-white text-[0.9375rem] font-semibold rounded-[6px] border-none transition-colors font-[inherit] disabled:opacity-70"
          >
            {loading ? '확인 중...' : '로그인'}
          </button>
        </form>

      </div>
    </div>
  )
}
