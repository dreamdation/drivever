'use client'

import Image from 'next/image'
import { LayoutGrid, PenSquare, LayoutTemplate, MessageSquare, Trash2, ExternalLink, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AdminView = 'dashboard' | 'editor' | 'hero' | 'comments' | 'trash'

interface AdminSidebarProps {
  view: AdminView
  onNavigate: (v: AdminView) => void
  onLogout: () => void
  onGoSite: () => void
  trashCount?: number
}

const NAV = [
  { id: 'dashboard' as AdminView, icon: LayoutGrid,      label: '포스트 관리' },
  { id: 'editor'    as AdminView, icon: PenSquare,       label: '새 글 작성' },
  { id: 'hero'      as AdminView, icon: LayoutTemplate,  label: '히어로 관리' },
  { id: 'comments'  as AdminView, icon: MessageSquare,   label: '댓글 관리' },
  { id: 'trash'     as AdminView, icon: Trash2,          label: '휴지통' },
]

export default function AdminSidebar({ view, onNavigate, onLogout, onGoSite, trashCount = 0 }: AdminSidebarProps) {
  return (
    <aside
      className="w-[220px] shrink-0 flex flex-col justify-between border-r border-border bg-surface"
      style={{ minHeight: 'calc(100vh - 56px)' }}
    >
      <div className="pt-5">
        {/* Logo */}
        <a
          href="/"
          className="flex items-center gap-2.5 px-5 pb-5 mb-3 border-b border-border hover:opacity-80 transition-opacity"
        >
          <Image src="/favicon-drivever-512.png" width={22} height={22} alt="D" className="object-contain" />
          <div>
            <div className="text-sm font-bold text-fg">Drivever</div>
            <div className="text-[10px] text-fg-3">관리자 패널</div>
          </div>
        </a>

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
              <span className="flex-1">{label}</span>
              {id === 'trash' && trashCount > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-[1px] rounded-full"
                  style={{ background: '#FFE4E1', color: '#C0392B' }}
                >
                  {trashCount}
                </span>
              )}
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
