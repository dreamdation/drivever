import type { Metadata } from 'next'
import AdminClient from '@/components/admin/AdminClient'

export const metadata: Metadata = { title: '히어로 관리' }

export default function AdminHeroPage() {
  return <AdminClient initialView="hero" />
}
