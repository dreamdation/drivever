'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useBlogStore } from '@/store/blogStore'
import AdminSidebar, { AdminView } from './AdminSidebar'
import AdminDashboard from './AdminDashboard'
import AdminEditor from './AdminEditor'
import AdminHeroManager from './AdminHeroManager'
import LoginClient from './LoginClient'
import { Post } from '@/lib/types'

interface AdminClientProps {
  initialView: AdminView
}

export default function AdminClient({ initialView }: AdminClientProps) {
  const router = useRouter()
  const { posts, heroSlides, isLoggedIn, _hydrated, setPosts, setHeroSlides, logout } = useBlogStore()

  const [view, setView] = useState<AdminView>(initialView)
  const [editPost, setEditPost] = useState<Post | null>(null)

  // Sync URL to view
  const handleNavigate = (v: AdminView) => {
    setView(v)
    if (v === 'dashboard') router.replace('/admin')
    else if (v === 'editor') { setEditPost(null); router.replace('/admin/editor') }
    else if (v === 'hero')   router.replace('/admin/hero')
  }

  const handleSavePosts = (updated: Post[]) => {
    setPosts(updated)
    localStorage.setItem('drivever_posts', JSON.stringify(updated))
  }

  const handleSaveHero = (updated: typeof heroSlides) => {
    setHeroSlides(updated)
    localStorage.setItem('drivever_hero', JSON.stringify(updated))
  }

  // Show login if not authenticated (after hydration)
  if (_hydrated && !isLoggedIn) return <LoginClient />

  return (
    <div className="flex" style={{ minHeight: '100vh' }}>
      <AdminSidebar
        view={view}
        onNavigate={handleNavigate}
        onLogout={() => { logout(); router.push('/') }}
        onGoSite={() => router.push('/')}
      />

      <div className="flex-1 overflow-auto bg-white">
        {view === 'dashboard' && (
          <AdminDashboard
            posts={posts}
            onEdit={(p) => { setEditPost(p); setView('editor') }}
            onNew={() => { setEditPost(null); setView('editor') }}
            onTogglePublish={(id) => {
              const updated = posts.map((p) => p.id === id ? { ...p, published: !p.published } : p)
              handleSavePosts(updated)
            }}
            onDelete={(id) => handleSavePosts(posts.filter((p) => p.id !== id))}
          />
        )}
        {view === 'editor' && (
          <AdminEditor
            posts={posts}
            editPost={editPost}
            onBack={() => handleNavigate('dashboard')}
            onSave={(updated) => { handleSavePosts(updated); handleNavigate('dashboard') }}
          />
        )}
        {view === 'hero' && (
          <AdminHeroManager
            posts={posts}
            heroSlides={heroSlides}
            onSave={handleSaveHero}
          />
        )}
      </div>
    </div>
  )
}
