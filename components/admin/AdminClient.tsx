'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useBlogStore } from '@/store/blogStore'
import AdminSidebar, { AdminView } from './AdminSidebar'
import AdminDashboard from './AdminDashboard'
import AdminEditor from './AdminEditor'
import AdminHeroManager from './AdminHeroManager'
import AdminCommentsManager from './AdminCommentsManager'
import LoginClient from './LoginClient'
import { Post } from '@/lib/types'
import { supabase, postToRow, rowToPost, PostRow } from '@/lib/supabase'

interface AdminClientProps {
  initialView: AdminView
}

export default function AdminClient({ initialView }: AdminClientProps) {
  const router = useRouter()
  const { posts, heroSlides, isLoggedIn, _hydrated, setPosts, setHeroSlides, logout } = useBlogStore()

  const [view, setView] = useState<AdminView>(initialView)
  const [editPost, setEditPost] = useState<Post | null>(null)
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>({})
  const supaLoadedRef = useRef(false)

  // Fetch comment counts from Supabase for dashboard display
  useEffect(() => {
    supabase.from('comments').select('post_id').then(({ data }) => {
      if (!data) return
      const counts: Record<number, number> = {}
      data.forEach((row: { post_id: number }) => {
        counts[row.post_id] = (counts[row.post_id] ?? 0) + 1
      })
      setCommentCounts(counts)
    })
  }, [])

  // Sync Supabase posts into store (once after hydration)
  // Covers posts imported externally (e.g. WordPress XML) that aren't in localStorage
  useEffect(() => {
    if (!_hydrated || supaLoadedRef.current) return
    supaLoadedRef.current = true
    supabase.from('posts').select('*').then(({ data }) => {
      if (!data?.length) return
      const storeIds = new Set(posts.map((p) => p.id))
      const incoming = data
        .filter((r) => !storeIds.has((r as PostRow).id))
        .map((r) => rowToPost(r as PostRow))
      if (incoming.length === 0) return
      const merged = [...posts, ...incoming].sort((a, b) => b.date.localeCompare(a.date))
      setPosts(merged)
    })
  }, [_hydrated]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync URL to view
  const handleNavigate = (v: AdminView) => {
    setView(v)
    if (v === 'dashboard') router.replace('/admin')
    else if (v === 'editor')   { setEditPost(null); router.replace('/admin/editor') }
    else if (v === 'hero')     router.replace('/admin/hero')
    else if (v === 'comments') router.replace('/admin/comments')
  }

  const handleSavePosts = async (updated: Post[]) => {
    setPosts(updated)
    localStorage.setItem('drivever_posts', JSON.stringify(updated))

    // Find the new or changed post (compared to current store)
    const changed = updated.find((p) => {
      const prev = posts.find((o) => o.id === p.id)
      return !prev || JSON.stringify(prev) !== JSON.stringify(p)
    })
    if (changed) {
      await supabase.from('posts').upsert(postToRow(changed))
    }
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

      <div className="flex-1 bg-white" style={{ height: '100vh', overflowY: 'auto' }}>
        {view === 'dashboard' && (
          <AdminDashboard
            posts={posts}
            commentCounts={commentCounts}
            onEdit={(p) => { setEditPost(p); setView('editor') }}
            onNew={() => { setEditPost(null); setView('editor') }}
            onTogglePublish={async (id) => {
              const target = posts.find((p) => p.id === id)
              const updated = posts.map((p) => p.id === id ? { ...p, published: !p.published } : p)
              handleSavePosts(updated)
              if (target) {
                await supabase.from('posts').update({ published: !target.published }).eq('id', id)
              }
            }}
            onDelete={async (id) => {
              handleSavePosts(posts.filter((p) => p.id !== id))
              await supabase.from('posts').delete().eq('id', id)
            }}
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
        {view === 'comments' && (
          <AdminCommentsManager posts={posts} />
        )}
      </div>
    </div>
  )
}
