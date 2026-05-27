import type { Metadata } from 'next'
import AdminClient from '@/components/admin/AdminClient'

export const metadata: Metadata = { title: '새 글 작성' }

interface Props {
  searchParams: Promise<{ id?: string; from?: string }>
}

export default async function AdminEditorPage({ searchParams }: Props) {
  const { id, from } = await searchParams
  return <AdminClient initialView="editor" editPostId={id ? Number(id) : undefined} returnUrl={from} />
}
