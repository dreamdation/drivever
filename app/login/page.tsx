import type { Metadata } from 'next'
import LoginClient from '@/components/admin/LoginClient'

export const metadata: Metadata = {
  title: '관리자 로그인',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return <LoginClient />
}
