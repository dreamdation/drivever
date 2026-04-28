import type { Metadata } from 'next'
import AdminClient from '@/components/admin/AdminClient'

export const metadata: Metadata = { title: '새 글 작성' }

export default function AdminEditorPage() {
  return <AdminClient initialView="editor" />
}
