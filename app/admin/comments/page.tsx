import type { Metadata } from 'next'
import AdminClient from '@/components/admin/AdminClient'

export const metadata: Metadata = { title: '댓글 관리' }

export default function AdminCommentsPage() {
  return <AdminClient initialView="comments" />
}
