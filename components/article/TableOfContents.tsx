'use client'

import { ContentBlock } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TOCItem {
  type: 'h2' | 'h3'
  text: string
  idx: number
}

interface TableOfContentsProps {
  content: ContentBlock[]
  activeId: string | null
}

export default function TableOfContents({ content, activeId }: TableOfContentsProps) {
  const items: TOCItem[] = content
    .map((block, i) => ({ ...block, idx: i }))
    .filter((b): b is TOCItem => b.type === 'h2' || b.type === 'h3') as TOCItem[]

  if (!items.length) return null

  const scrollTo = (idx: number) => {
    const el = document.getElementById(`toc-${idx}`)
    if (el) {
      const top = el.getBoundingClientRect().top + window.pageYOffset - 76
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  return (
    <div className="bg-surface border border-border rounded-[8px] px-[18px] py-4 mb-4">
      <div className="text-[11px] font-bold text-fg-3 mb-3" style={{ letterSpacing: '0.06em' }}>목차</div>
      <nav className="flex flex-col gap-0.5">
        {items.map((item) => {
          const id = `toc-${item.idx}`
          const isActive = activeId === id
          const isH3 = item.type === 'h3'
          return (
            <button
              key={item.idx}
              onClick={() => scrollTo(item.idx)}
              className={cn(
                'text-left w-full border-none cursor-pointer font-[inherit] rounded-r-sm transition-colors duration-150',
                isActive ? 'text-accent font-bold bg-accent-light' : 'text-fg-2 font-medium bg-transparent hover:text-accent',
              )}
              style={{
                padding: `5px 8px 5px ${isH3 ? '18px' : '8px'}`,
                fontSize: isH3 ? '12px' : '0.8125rem',
                borderLeft: isActive ? '2px solid #0070F3' : '2px solid transparent',
                lineHeight: 1.4,
              }}
            >
              {item.text}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
