'use client'

import { cn } from '@/lib/utils'

const CATS = ['전체', '교통법규', 'Premium Garage', '안전운전', '차량관리']

interface CategoryTabsProps {
  active: string
  onChange: (cat: string) => void
  variant?: 'chip' | 'underline'
}

export default function CategoryTabs({ active, onChange, variant = 'chip' }: CategoryTabsProps) {
  if (variant === 'underline') {
    return (
      <div className="flex gap-0 overflow-x-auto">
        {CATS.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={cn(
              'px-4 py-[7px] text-sm font-semibold whitespace-nowrap cursor-pointer border-none bg-transparent font-[inherit] transition-colors duration-150',
              c === active
                ? 'text-accent border-b-2 border-accent'
                : 'text-fg-2 border-b-2 border-transparent hover:text-accent'
            )}
          >
            {c}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-0.5 overflow-x-auto">
      {CATS.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={cn(
            'px-3.5 py-[5px] text-xs font-semibold rounded-sm whitespace-nowrap cursor-pointer border-none font-[inherit] transition-colors duration-150',
            c === active ? 'bg-accent-light text-accent' : 'bg-transparent text-fg-2 hover:text-accent'
          )}
          style={{ letterSpacing: '0.01em' }}
        >
          {c}
        </button>
      ))}
    </div>
  )
}
