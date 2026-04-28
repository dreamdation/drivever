import type { Metadata } from 'next'
import AdminClient from '@/components/admin/AdminClient'

export const metadata: Metadata = { title: '포스트 관리' }

export default function AdminPage() {
  return <AdminClient initialView="dashboard" />
}
