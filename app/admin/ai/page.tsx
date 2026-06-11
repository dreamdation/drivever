import type { Metadata } from 'next'
import AdminClient from '@/components/admin/AdminClient'

export const metadata: Metadata = { title: 'AI 글쓰기' }

export default function AdminAiPage() {
  return <AdminClient initialView="ai" />
}
