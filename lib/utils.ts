import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { CategoryColor, ContentBlock } from './types'

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

export function toHeadingId(text: string): string {
  return text.trim().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9가-힣-]/g, '')
    .slice(0, 60)
}

export function blocksToHtmlWithIds(blocks: ContentBlock[]): string {
  return blocks.map((b) => {
    if (b.type === 'h2') return `<h2 id="${toHeadingId(b.text)}">${b.text}</h2>`
    if (b.type === 'h3') return `<h3 id="${toHeadingId(b.text)}">${b.text}</h3>`
    if (b.type === 'lawbox') return `<div data-type="lawbox" data-ref="${b.ref}">${b.text}</div>`
    if (b.type === 'tipbox') return `<div data-type="tipbox">${b.text}</div>`
    return `<p>${b.text}</p>`
  }).join('')
}

export function generateSummaryListHtml(bodyHtml: string, title = '핵심 목록'): string {
  const regex = /<h([23])(?:[^>]*)>(.*?)<\/h\1>/gi
  const items: { level: number; text: string; id: string }[] = []
  let match: RegExpExecArray | null
  while ((match = regex.exec(bodyHtml)) !== null) {
    const text = match[2].replace(/<[^>]+>/g, '').trim()
    if (text) items.push({ level: parseInt(match[1]), text, id: toHeadingId(text) })
  }
  if (items.length === 0) return ''
  let h2Count = 0, h3Count = 0
  const lis = items.map((it) => {
    let label: string
    if (it.level === 2) { h2Count++; h3Count = 0; label = `${h2Count}.` }
    else { h3Count++; label = `${h2Count}.${h3Count}` }
    return `<li data-level="${it.level}"><span class="summary-num">${label}</span><a href="#${it.id}">${it.text}</a></li>`
  }).join('')
  return `<div data-type="summary-list" data-title="${title}"><ol>${lis}</ol></div>`
}

export function insertSummaryListAfterIntro(html: string, summaryHtml: string): string {
  if (!summaryHtml) return html
  const idx = html.indexOf('</p>')
  if (idx === -1) return summaryHtml + html
  return html.slice(0, idx + 4) + summaryHtml + html.slice(idx + 4)
}

export function toSlug(title: string): string {
  return title
    .trim()
    .replace(/[—–·×÷()/\\%&@#$^*+=\[\]{}<>~`"'!?|]/g, ' ')
    .replace(/[^가-힣a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}
