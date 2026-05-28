'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useBlogStore } from '@/store/blogStore'
import { useAuth } from '@/lib/useAuth'
import AdminSidebar, { AdminView } from './AdminSidebar'
import AdminDashboard from './AdminDashboard'
import AdminEditor from './AdminEditor'
import AdminHeroManager from './AdminHeroManager'
import AdminCommentsManager from './AdminCommentsManager'
import AdminInquiriesManager from './AdminInquiriesManager'
import AdminTrashManager from './AdminTrashManager'
import LoginClient from './LoginClient'
import { Post } from '@/lib/types'
import { supabase } from '@/lib/supabaseClient'
import { postToRow, rowToPost, PostRow, fetchHeroSlides, saveHeroSlides } from '@/lib/supabase'

interface AdminClientProps {
  initialView: AdminView
  editPostId?: number
  returnUrl?: string
}

export default function AdminClient({ initialView, editPostId, returnUrl }: AdminClientProps) {
  const router = useRouter()
  const { posts, heroSlides, _hydrated, setPosts, setHeroSlides } = useBlogStore()
  const { isLoggedIn, loading: authLoading } = useAuth()

  const [view, setView] = useState<AdminView>(initialView)
  const [editPost, setEditPost] = useState<Post | null>(null)
  const [editPostReady, setEditPostReady] = useState(!editPostId)
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>({})
  const [newInquiryCount, setNewInquiryCount] = useState(0)
  const supaLoadedRef = useRef(false)
  const editPostSetRef = useRef(false)

  // Hero config is DB-backed — load it so the admin edits the live, shared
  // version (not a stale per-browser localStorage copy).
  useEffect(() => {
    fetchHeroSlides(supabase).then((slides) => { if (slides) setHeroSlides(slides) })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Unread ('new') ad-inquiry count for the sidebar badge.
  useEffect(() => {
    supabase
      .from('ad_inquiries')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new')
      .then(({ count }) => setNewInquiryCount(count ?? 0))
  }, [view])

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

  // Sync Supabase posts into store (once after hydration).
  // Includes trashed posts (admin sees all) — UI filters by view.
  useEffect(() => {
    if (!_hydrated || supaLoadedRef.current) return
    supaLoadedRef.current = true
    supabase
      .from('posts')
      .select('id, slug, category, category_color, published, is_new, title, description, date, read_time, tags, thumbnail, views, deleted_at')
      .then(async ({ data }) => {
        if (!data?.length) return

        type PostRowLite = Pick<PostRow,
          'id' | 'slug' | 'category' | 'category_color' | 'published' | 'is_new' |
          'title' | 'description' | 'date' | 'read_time' | 'tags' | 'thumbnail' |
          'views' | 'deleted_at'
        >
        const rows = data as PostRowLite[]

        const corrupted = rows.filter((r) => !r.slug || r.slug.trim() === '')
        if (corrupted.length > 0) {
          await Promise.all(corrupted.map((r) => supabase.from('posts').delete().eq('id', r.id)))
        }

        const storeIds = new Set(posts.map((p) => p.id))
        const incoming: Post[] = rows
          .filter((r) => !storeIds.has(r.id) && r.slug && r.slug.trim() !== '')
          .map((r) => ({
            id:            r.id,
            slug:          r.slug,
            category:      r.category,
            categoryColor: r.category_color as Post['categoryColor'],
            published:     r.published,
            isNew:         r.is_new,
            title:         r.title,
            description:   r.description,
            date:          r.date,
            readTime:      r.read_time,
            tags:          r.tags,
            thumbnail:     r.thumbnail ?? undefined,
            views:         r.views,
            content:       [],
            deletedAt:     r.deleted_at,
          }))
        if (incoming.length === 0) return
        const merged = [...posts, ...incoming].sort((a, b) => b.date.localeCompare(a.date))
        setPosts(merged)
      })
  }, [_hydrated]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch full post body before opening the editor (covers store-lite rows)
  const loadFullPost = async (id: number): Promise<Post | null> => {
    const { data } = await supabase.from('posts').select('*').eq('id', id).single()
    return data ? rowToPost(data as PostRow) : null
  }

  // The store already holds the full body for seed posts (and for any post the
  // admin previously edited). Only hit the DB to fetch the body of "lite" rows
  // — DB-only posts synced without their content. Using the store first also
  // prevents a stale DB copy from overriding freshly-edited seed content.
  const hasBody = (p: Post) => (p.content?.length ?? 0) > 0 || !!p.bodyHtml

  const enterEditor = (p: Post) => {
    // /admin and /admin/editor are separate route segments — navigating mounts a
    // fresh AdminClient. Pass ?id= so that instance loads the post via the effect
    // below; setting state here would be discarded on the route change (which is
    // why edit was opening blank "새 글 작성" mode).
    router.push(`/admin/editor?id=${p.id}`)
  }

  // Auto-load post when navigating via ?id= URL param
  useEffect(() => {
    if (!editPostId || !_hydrated || editPostSetRef.current) return
    const post = posts.find((p) => p.id === editPostId)
    if (!post) return
    editPostSetRef.current = true
    const ready = hasBody(post) ? Promise.resolve(post) : loadFullPost(post.id)
    ready.then((full) => {
      setEditPost(full ?? post)
      setEditPostReady(true)
    })
  }, [editPostId, _hydrated, posts]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleNavigate = (v: AdminView) => {
    setView(v)
    if (v === 'dashboard')      router.replace('/admin')
    else if (v === 'editor')   { setEditPost(null); router.replace('/admin/editor') }
    else if (v === 'hero')      router.replace('/admin/hero')
    else if (v === 'comments')  router.replace('/admin/comments')
    else if (v === 'inquiries') router.replace('/admin/inquiries')
    else if (v === 'trash')     router.replace('/admin/trash')
  }

  const handleSavePosts = async (updated: Post[]) => {
    setPosts(updated)
    localStorage.setItem('drivever_posts', JSON.stringify(updated))

    // Persist EVERY changed/new post, not just the first one — bulk edits used to
    // silently drop all but one row.
    const changed = updated.filter((p) => {
      const prev = posts.find((o) => o.id === p.id)
      return !prev || JSON.stringify(prev) !== JSON.stringify(p)
    })
    if (changed.length > 0) {
      await supabase.from('posts').upsert(changed.map(postToRow))
    }
  }

  // Trash: soft-delete (set deleted_at = NOW())
  const trashPost = async (id: number) => {
    const nowIso = new Date().toISOString()
    setPosts(posts.map((p) => p.id === id ? { ...p, deletedAt: nowIso } : p))
    await supabase.from('posts').update({ deleted_at: nowIso }).eq('id', id)
  }

  // Bulk status change from the dashboard checkboxes.
  // published → 발행, draft → 임시저장, trash → 휴지통(soft-delete).
  const bulkStatus = async (ids: number[], status: 'published' | 'draft' | 'trash') => {
    if (ids.length === 0) return
    const idSet = new Set(ids)
    const nowIso = new Date().toISOString()
    const updated = posts.map((p) => {
      if (!idSet.has(p.id)) return p
      if (status === 'trash')     return { ...p, deletedAt: nowIso }
      return { ...p, published: status === 'published', deletedAt: null }
    })
    setPosts(updated)
    localStorage.setItem('drivever_posts', JSON.stringify(updated))

    if (status === 'trash') {
      await supabase.from('posts').update({ deleted_at: nowIso }).in('id', ids)
    } else {
      await supabase.from('posts').update({ published: status === 'published', deleted_at: null }).in('id', ids)
    }
  }

  // Restore: clear deleted_at
  const restorePost = async (id: number) => {
    setPosts(posts.map((p) => p.id === id ? { ...p, deletedAt: null } : p))
    await supabase.from('posts').update({ deleted_at: null }).eq('id', id)
  }

  // Permanent delete: remove row (CASCADE wipes comments) + clean storage folders
  const purgePost = async (id: number) => {
    setPosts(posts.filter((p) => p.id !== id))
    await Promise.all([
      removeStorageFolder(`posts/${id}`),
      removeStorageFolder(`thumbnails/${id}`),
    ])
    await supabase.from('posts').delete().eq('id', id)
  }

  // Removes all objects under a prefix in the post-images bucket.
  // No-op if the folder is empty or doesn't exist.
  const removeStorageFolder = async (prefix: string) => {
    const { data, error } = await supabase.storage.from('post-images').list(prefix, { limit: 1000 })
    if (error || !data?.length) return
    const paths = data.filter((f) => f.name).map((f) => `${prefix}/${f.name}`)
    if (paths.length) await supabase.storage.from('post-images').remove(paths)
  }

  const handleSaveHero = async (updated: typeof heroSlides) => {
    setHeroSlides(updated)                       // instant UI
    const { error } = await saveHeroSlides(supabase, updated)  // durable, shared (DB)
    if (error) {
      console.error('Hero save failed:', error)
      alert('히어로 저장에 실패했습니다. 다시 시도해주세요.')
    }
  }

  // Show login if not authenticated (after auth check resolved)
  if (!authLoading && !isLoggedIn) return <LoginClient />

  const livePosts    = posts.filter((p) => !p.deletedAt)
  const trashedPosts = posts.filter((p) =>  p.deletedAt)

  return (
    <div className="flex" style={{ minHeight: '100vh' }}>
      <AdminSidebar
        view={view}
        onNavigate={handleNavigate}
        onLogout={async () => {
          await supabase.auth.signOut()
          router.push('/')
        }}
        onGoSite={() => router.push('/')}
        trashCount={trashedPosts.length}
        newInquiryCount={newInquiryCount}
      />

      <div className="flex-1 bg-white" style={{ height: '100vh', overflowY: 'auto' }}>
        {view === 'dashboard' && (
          <AdminDashboard
            posts={livePosts}
            commentCounts={commentCounts}
            heroPostIds={heroSlides.map((s) => s.postId).filter((id): id is number => typeof id === 'number')}
            onEdit={(p) => enterEditor(p)}
            onNew={() => { setEditPost(null); setEditPostReady(true); setView('editor'); router.replace('/admin/editor') }}
            onTogglePublish={async (id) => {
              const target = posts.find((p) => p.id === id)
              const updated = posts.map((p) => p.id === id ? { ...p, published: !p.published } : p)
              handleSavePosts(updated)
              if (target) {
                await supabase.from('posts').update({ published: !target.published }).eq('id', id)
              }
            }}
            onTrash={(id) => trashPost(id)}
            onBulkStatus={bulkStatus}
          />
        )}
        {view === 'editor' && !editPostReady && (
          <div className="flex items-center justify-center text-sm text-fg-3" style={{ height: 'calc(100vh - 60px)' }}>
            포스트 불러오는 중…
          </div>
        )}
        {view === 'editor' && editPostReady && (
          <AdminEditor
            key={editPost?.id ?? 'new'}
            posts={posts}
            editPost={editPost}
            onBack={() => returnUrl ? router.push(returnUrl) : handleNavigate('dashboard')}
            onSave={async (updated) => {
              await handleSavePosts(updated)
              if (returnUrl) router.push(returnUrl)
              else handleNavigate('dashboard')
            }}
            onTrash={editPost ? async () => {
              await trashPost(editPost.id)
              if (returnUrl) router.push(returnUrl)
              else handleNavigate('dashboard')
            } : undefined}
          />
        )}
        {view === 'hero' && (
          <AdminHeroManager
            posts={livePosts}
            heroSlides={heroSlides}
            onSave={handleSaveHero}
          />
        )}
        {view === 'comments' && (
          <AdminCommentsManager posts={posts} />
        )}
        {view === 'inquiries' && (
          <AdminInquiriesManager />
        )}
        {view === 'trash' && (
          <AdminTrashManager
            posts={trashedPosts}
            onRestore={restorePost}
            onPurge={purgePost}
          />
        )}
      </div>
    </div>
  )
}
