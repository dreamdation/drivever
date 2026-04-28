'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useBlogStore } from '@/store/blogStore'

export default function LoginClient() {
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login } = useBlogStore()

  const handle = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      if (id === 'admin' && pw === 'drivever2024') {
        login()
        router.push('/admin')
      } else {
        setErr('아이디 또는 비밀번호가 올바르지 않습니다.')
        setLoading(false)
      }
    }, 600)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div
        className="bg-white border border-border rounded-xl p-10 w-[400px]"
        style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Image src="/favicon-drivever-512.png" width={36} height={36} alt="Drivever" className="object-contain" />
          <span className="text-md font-bold text-fg" style={{ letterSpacing: '-0.02em' }}>Drivever</span>
        </div>

        <h1 className="text-[1.375rem] font-bold text-fg text-center mb-1.5">관리자 로그인</h1>
        <p className="text-sm text-fg-3 text-center mb-6 leading-relaxed">
          블로그 관리 페이지에 접근하려면 로그인이 필요합니다.
        </p>

        <form onSubmit={handle} className="flex flex-col gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-fg-2 mb-1.5">아이디</label>
            <input
              value={id}
              onChange={(e) => { setId(e.target.value); setErr('') }}
              placeholder="admin"
              autoFocus
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

        <div className="mt-3.5 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-fg-3 bg-transparent border-none cursor-pointer font-[inherit] hover:text-accent transition-colors"
          >
            ← 블로그로 돌아가기
          </button>
        </div>

        <div className="mt-5 px-3 py-3 bg-surface rounded-[6px] text-[11px] text-[#aaa] text-center">
          <span className="font-semibold">테스트 계정</span> — ID: admin / PW: drivever2024
        </div>
      </div>
    </div>
  )
}
