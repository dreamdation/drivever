'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Header from './Header'
import SearchOverlay from './SearchOverlay'
import { useBlogStore } from '@/store/blogStore'

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    useBlogStore.persist.rehydrate()
  }, [])
  const pathname = usePathname()
  const { posts, _hydrated } = useBlogStore()

  // Hide header on login and admin pages
  const hideHeader = pathname === '/login' || pathname.startsWith('/admin')

  return (
    <>
      {!hideHeader && <Header onSearchOpen={() => setSearchOpen(true)} />}
      <main id="main-content">{children}</main>
      {searchOpen && _hydrated && (
        <SearchOverlay posts={posts} onClose={() => setSearchOpen(false)} />
      )}
    </>
  )
}
