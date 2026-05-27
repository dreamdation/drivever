import type { Metadata } from 'next'
import AdminClient from '@/components/admin/AdminClient'

export const metadata: Metadata = { title: '휴지통' }

export default function AdminTrashPage() {
  return <AdminClient initialView="trash" />
}
