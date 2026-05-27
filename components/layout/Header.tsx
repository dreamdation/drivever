'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search, User, Menu, X, Pencil } from 'lucide-react'
import { useBlogStore } from '@/store/blogStore'
import { useAuth } from '@/lib/useAuth'
import { cn } from '@/lib/utils'

type NavLink = {
  href:  string
  label: string
  path?: string   // exact pathname match
  cat?:  string   // /blog?cat=xxx match
}

const NAV_LINKS: NavLink[] = [
  { href: '/',                         label: '홈' },
  { href: '/about',                    label: '블로그 소개',    path: '/about' },
  { href: '/blog?cat=교통법규',        label: '교통법규',       cat: '교통법규' },
  { href: '/blog?cat=안전운전',        label: '안전운전',       cat: '안전운전' },
  { href: '/blog?cat=Premium Garage',  label: 'Premium Garage', cat: 'Premium Garage' },
]

// Inner component that reads searchParams — must be inside Suspense
function NavLinks({ mobile, onMobileClose }: { mobile?: boolean; onMobileClose?: () => void }) {
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  const isActive = (link: NavLink) => {
    if (link.cat)  return pathname === '/blog' && searchParams.get('cat') === link.cat
    if (link.path) return pathname === link.path
    return pathname === '/'
  }

  if (mobile) {
    return (
      <>
        {NAV_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            onClick={onMobileClose}
            className={cn(
              'px-3 py-2.5 text-sm font-medium rounded-[6px] transition-colors',
              isActive(l) ? 'text-accent bg-accent-light' : 'text-fg-2'
            )}
          >
            {l.label}
          </Link>
        ))}
      </>
    )
  }

  return (
    <>
      {NAV_LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-[6px] transition-colors duration-150',
            isActive(l)
              ? 'text-accent bg-accent-light'
              : 'text-fg-2 hover:text-accent'
          )}
        >
          {l.label}
        </Link>
      ))}
    </>
  )
}

// Fallback: same links without active state (shown during SSR/suspense)
function NavLinksFallback({ mobile }: { mobile?: boolean }) {
  if (mobile) {
    return (
      <>
        {NAV_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="px-3 py-2.5 text-sm font-medium rounded-[6px] text-fg-2">
            {l.label}
          </Link>
        ))}
      </>
    )
  }
  return (
    <>
      {NAV_LINKS.map((l) => (
        <Link key={l.href} href={l.href} className="px-3 py-1.5 text-sm font-medium rounded-[6px] text-fg-2 hover:text-accent transition-colors duration-150">
          {l.label}
        </Link>
      ))}
    </>
  )
}

interface HeaderProps {
  onSearchOpen: () => void
}

export default function Header({ onSearchOpen }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { posts, _hydrated, activePost } = useBlogStore()
  const { isLoggedIn } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  // The post to edit on a blog post page. `activePost` (published by ArticleClient
  // from SSR) is authoritative and covers DB-only posts; the slug lookup is a
  // fallback so seed posts show the button instantly before that effect runs.
  const postSlugMatch = pathname.match(/^\/blog\/(.+)$/)
  const currentPostSlug = postSlugMatch
    ? (() => { try { return decodeURIComponent(postSlugMatch[1]) } catch { return postSlugMatch[1] } })()
    : null
  const fallbackPost = _hydrated && currentPostSlug ? posts.find((p) => p.slug === currentPostSlug) : null
  const editTarget = activePost ?? (fallbackPost ? { id: fallbackPost.id, slug: fallbackPost.slug } : null)

  return (
    <header
      className="sticky top-0 z-50 h-[56px] flex items-center"
      style={{
        background: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderBottom: '1px solid #EAEAEA',
      }}
    >
      <div className="w-full max-w-[1080px] mx-auto px-6 flex items-center gap-0">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-8 shrink-0">
          <Image
            src="/favicon-drivever-512.png"
            width={26} height={26}
            alt="Drivever"
            className="object-contain"
          />
          <span
            className="font-bold text-[1.0625rem] text-fg"
            style={{ letterSpacing: '-0.02em' }}
          >
            Drivever
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-0.5 flex-1">
          <Suspense fallback={<NavLinksFallback />}>
            <NavLinks />
          </Suspense>
        </nav>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onSearchOpen}
            className="w-[34px] h-[34px] rounded-[6px] border border-border bg-transparent flex items-center justify-center text-fg-2 hover:bg-surface transition-colors duration-150"
            aria-label="검색"
          >
            <Search size={15} />
          </button>

          {isLoggedIn && editTarget && (
            <Link
              href={`/admin/editor?id=${editTarget.id}&from=/blog/${editTarget.slug}`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-[6px] border border-accent text-accent hover:bg-accent-light transition-colors duration-150"
            >
              <Pencil size={13} />
              수정
            </Link>
          )}

          {isLoggedIn ? (
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-[6px] bg-accent text-white hover:bg-accent-hover transition-colors duration-150"
            >
              <User size={13} />
              관리자
            </button>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="px-3.5 py-1.5 text-sm font-semibold rounded-[6px] border border-border bg-white text-fg-2 hover:bg-surface transition-colors duration-150"
            >
              로그인
            </button>
          )}

          {/* Mobile menu toggle */}
          <button
            className="md:hidden w-[34px] h-[34px] flex items-center justify-center text-fg-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="메뉴"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="absolute top-[56px] left-0 right-0 bg-white border-b border-border z-40 md:hidden"
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
        >
          <nav className="flex flex-col py-2 px-4">
            <Suspense fallback={<NavLinksFallback mobile />}>
              <NavLinks mobile onMobileClose={() => setMobileOpen(false)} />
            </Suspense>
          </nav>
        </div>
      )}
    </header>
  )
}
