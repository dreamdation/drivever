import type { Metadata } from 'next'
import AdminClient from '@/components/admin/AdminClient'

export const metadata: Metadata = { title: '광고 문의' }

export default function AdminInquiriesPage() {
  return <AdminClient initialView="inquiries" />
}
