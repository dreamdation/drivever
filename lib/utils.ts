import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { CategoryColor } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCategoryStyle(color: CategoryColor | string) {
  switch (color) {
    case 'green':  return { bg: '#ECFDF5', text: '#059669' }
    case 'purple': return { bg: '#F3EEFF', text: '#7C3AED' }
    default:       return { bg: '#EBF3FF', text: '#0070F3' }
  }
}

export function getCategoryColorFromName(category: string): CategoryColor {
  const map: Record<string, CategoryColor> = {
    '교통법규':       'blue',
    'Premium Garage': 'purple',
    '안전운전':       'green',
    '차량관리':       'blue',
  }
  return map[category] ?? 'blue'
}

export function formatDate(iso: string): string {
  return iso.replace(/-/g, '.')
}
