'use client'

import Image from 'next/image'
import { LayoutGrid, PenSquare, LayoutTemplate, ExternalLink, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AdminView = 'dashboard' | 'editor' | 'hero'

interface AdminSidebarProps {
  view: AdminView
  onNavigate: (v: AdminView) => void
  onLogout: () => void
  onGoSite: () => void
}

const NAV = [
  { id: 'dashboard' as AdminView, icon: LayoutGrid,      label: '포스트 관리' },
  { id: 'editor'    as AdminView, icon: PenSquare,       label: '새 글 작성' },
  { id: 'hero'      as AdminView, icon: LayoutTemplate,  label: '히어로 관리' },
]

export default function AdminSidebar({ view, onNavigate, onLogout, onGoSite }: AdminSidebarProps) {
  return (
    <aside
      className="w-[220px] shrink-0 flex flex-col justify-between border-r border-border bg-surface"
      style={{ minHeight: 'calc(100vh - 56px)' }}
    >
      <div className="pt-5">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 pb-5 mb-3 border-b border-border">
          <Image src="/favicon-drivever-512.png" width={22} height={22} alt="D" className="object-contain" />
          <div>
            <div className="text-sm font-bold text-fg">Drivever</div>
            <div className="text-[10px] text-fg-3">관리자 패널</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 px-2.5">
          {NAV.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={cn(
                'flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-[6px] text-sm font-medium transition-colors duration-150 border-none font-[inherit]',
                view === id ? 'bg-accent-light text-accent' : 'bg-transparent text-fg-2 hover:bg-surface-hover'
              )}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Bottom actions */}
      <div className="flex flex-col gap-0.5 px-2.5 py-4 border-t border-border">
        <button
          onClick={onGoSite}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-[6px] text-sm text-fg-3 hover:bg-surface-hover transition-colors duration-150 border-none bg-transparent font-[inherit]"
        >
          <ExternalLink size={13} />
          사이트 보기
        </button>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-[6px] text-sm hover:bg-surface-hover transition-colors duration-150 border-none bg-transparent font-[inherit]"
          style={{ color: '#C0392B' }}
        >
          <LogOut size={13} />
          로그아웃
        </button>
      </div>
    </aside>
  )
}
