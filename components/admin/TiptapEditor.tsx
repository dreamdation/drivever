'use client'

import { useState, useRef, useEffect } from 'react'
import { useEditor, EditorContent, NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer, NodeViewProps } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import LinkExt from '@tiptap/extension-link'
import ImageExt from '@tiptap/extension-image'
import ColorExt from '@tiptap/extension-color'
import { TextStyle as TextStyleExt } from '@tiptap/extension-text-style'
import { Node, mergeAttributes } from '@tiptap/core'
import Heading from '@tiptap/extension-heading'
import { toHeadingId } from '@/lib/utils'
import imageCompression from 'browser-image-compression'
import { supabase } from '@/lib/supabase'
import { Bold, Italic, Strikethrough, Heading2, Heading3, List, ListOrdered, Link, Scale, Lightbulb, Unlink, ImageIcon, Loader2, Minus, Video, ListChecks } from 'lucide-react'

// ── Video URL parser ─────────────────────────────────────────────

function parseVideoUrl(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'www.youtube.com' || u.hostname === 'youtube.com') {
      const v = u.searchParams.get('v')
      if (v) return `https://www.youtube.com/embed/${v}`
      if (u.pathname.startsWith('/embed/')) return url
    }
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.slice(1).split('?')[0]
      if (id) return `https://www.youtube.com/embed/${id}`
    }
    if (u.hostname === 'vimeo.com' || u.hostname === 'www.vimeo.com') {
      const id = u.pathname.split('/').filter(Boolean)[0]
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`
    }
  } catch {}
  return null
}

// ── Custom node: LawBox ─────────────────────────────────────────

function LawBoxView({ node, updateAttributes }: NodeViewProps) {
  return (
    <NodeViewWrapper>
      <div style={{ borderLeft: '4px solid #0070F3', background: '#FAFAFA', padding: '14px 18px', margin: '20px 0', borderRadius: 0 }}>
        <input
          value={(node.attrs.ref as string) ?? ''}
          onChange={(e) => updateAttributes({ ref: e.target.value })}
          placeholder="법률 출처 (예: 도로교통법 제44조)"
          style={{ display: 'block', width: '100%', border: 'none', background: 'transparent', fontSize: '11px', fontWeight: 700, color: '#0070F3', letterSpacing: '0.06em', outline: 'none', marginBottom: '6px', fontFamily: 'inherit' }}
        />
        <NodeViewContent style={{ fontSize: '0.9375rem', color: '#333', lineHeight: 1.65 }} />
      </div>
    </NodeViewWrapper>
  )
}

const LawBoxNode = Node.create({
  name: 'lawbox',
  group: 'block',
  content: 'inline*',
  addAttributes() {
    return { ref: { default: '' } }
  },
  parseHTML() {
    return [{ tag: 'div[data-type="lawbox"]' }]
  },
  renderHTML({ node, HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'lawbox', 'data-ref': node.attrs.ref }), 0]
  },
  addNodeView() {
    return ReactNodeViewRenderer(LawBoxView)
  },
})

// ── Custom node: TipBox ─────────────────────────────────────────

function TipBoxView(_props: NodeViewProps) {
  return (
    <NodeViewWrapper>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: '#EBF3FF', borderRadius: '8px', padding: '14px 18px', margin: '20px 0' }}>
        <div style={{ flexShrink: 0, marginTop: '1px', width: '22px', height: '22px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0070F3', fontWeight: 700, fontSize: '13px', fontFamily: 'serif' }}>i</div>
        <NodeViewContent style={{ fontSize: '0.9rem', lineHeight: 1.65, color: '#1a4fa3' }} />
      </div>
    </NodeViewWrapper>
  )
}

const TipBoxNode = Node.create({
  name: 'tipbox',
  group: 'block',
  content: 'inline*',
  parseHTML() {
    return [{ tag: 'div[data-type="tipbox"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'tipbox' }), 0]
  },
  addNodeView() {
    return ReactNodeViewRenderer(TipBoxView)
  },
})

// ── Custom node: SummaryList ────────────────────────────────────

interface SummaryItem { level: 2 | 3; text: string; id: string }

function SummaryListView({ node, updateAttributes }: NodeViewProps) {
  const title = (node.attrs.title as string) ?? '핵심 목록'
  const items = (node.attrs.items as SummaryItem[]) ?? []

  const scrollToHeading = (id: string) => {
    const el =
      Array.from(document.querySelectorAll('.ProseMirror h2, .ProseMirror h3'))
        .find((h) => toHeadingId(h.textContent ?? '') === id)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  let h2Count = 0
  let h3Count = 0
  const labeled = items.map((item) => {
    if (item.level === 2) { h2Count++; h3Count = 0; return { ...item, label: `${h2Count}.` } }
    h3Count++
    return { ...item, label: `${h2Count}.${h3Count}` }
  })

  return (
    <NodeViewWrapper contentEditable={false}>
      <div style={{ background: '#F0F7FF', border: '1.5px solid #B3D4FC', borderRadius: '8px', padding: '16px 20px', margin: '20px 0', userSelect: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <ListChecks size={14} color="#0070F3" style={{ flexShrink: 0 }} />
          <input
            value={title}
            onChange={(e) => updateAttributes({ title: e.target.value })}
            placeholder="요약 제목"
            style={{ border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 700, color: '#0070F3', outline: 'none', fontFamily: 'inherit', flex: 1 }}
          />
        </div>
        {labeled.length > 0 ? (
          <div style={{ padding: 0, margin: 0 }}>
            {labeled.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '5px', paddingLeft: item.level === 3 ? '1.25rem' : '0' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: item.level === 2 ? '#0070F3' : '#4a7fc1', minWidth: item.level === 3 ? '32px' : '22px', flexShrink: 0 }}>
                  {item.label}
                </span>
                <button
                  type="button"
                  onClick={() => scrollToHeading(item.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: item.level === 2 ? '13px' : '12px', fontWeight: item.level === 2 ? 600 : 400, color: item.level === 2 ? '#1a3a6e' : '#4a7fc1', fontFamily: 'inherit', textAlign: 'left', lineHeight: 1.5 }}
                >
                  {item.text}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>H2·H3 헤딩이 없습니다. 본문에 헤딩 추가 후 다시 삽입하세요.</p>
        )}
      </div>
    </NodeViewWrapper>
  )
}

const SummaryListNode = Node.create({
  name: 'summaryList',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      title: { default: '핵심 목록' },
      items: {
        default: [],
        parseHTML: (el) => {
          const result: SummaryItem[] = []
          el.querySelectorAll('li[data-level]').forEach((li) => {
            const a = li.querySelector('a')
            if (a) result.push({
              level: parseInt(li.getAttribute('data-level') ?? '2') as 2 | 3,
              text: a.textContent ?? '',
              id: (a.getAttribute('href') ?? '').slice(1),
            })
          })
          return result
        },
        renderHTML: () => ({}),
      },
    }
  },
  parseHTML() {
    return [{ tag: 'div[data-type="summary-list"]' }]
  },
  renderHTML({ node }) {
    const title = node.attrs.title as string
    const items = (node.attrs.items as SummaryItem[]) ?? []
    let h2Count = 0, h3Count = 0
    const ol: unknown[] = ['ol', {}]
    for (const item of items) {
      let label: string
      if (item.level === 2) { h2Count++; h3Count = 0; label = `${h2Count}.` }
      else { h3Count++; label = `${h2Count}.${h3Count}` }
      ol.push(['li', { 'data-level': String(item.level) },
        ['span', { class: 'summary-num' }, label],
        ['a', { href: `#${item.id}` }, item.text],
      ])
    }
    return ['div', { 'data-type': 'summary-list', 'data-title': title }, ol]
  },
  addNodeView() {
    return ReactNodeViewRenderer(SummaryListView)
  },
})

// ── Heading with auto ID ─────────────────────────────────────────

const HeadingWithId = Heading.extend({
  renderHTML({ node, HTMLAttributes }) {
    const level = node.attrs.level as number
    const id = toHeadingId(node.textContent)
    return [`h${level}`, mergeAttributes(HTMLAttributes, { id }), 0]
  },
})

// ── Custom node: VideoEmbed ─────────────────────────────────────

function VideoEmbedView({ node, selected }: NodeViewProps) {
  return (
    <NodeViewWrapper>
      {/* max-width matches article page content width (~680px) */}
      <div
        contentEditable={false}
        style={{
          maxWidth: 680,
          aspectRatio: '16 / 9',
          position: 'relative',
          overflow: 'hidden',
          margin: '20px 0',
          borderRadius: '8px',
          outline: selected ? '2px solid #0070F3' : '2px solid transparent',
          background: '#000',
        }}
      >
        <iframe
          src={node.attrs.src as string}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        />
      </div>
    </NodeViewWrapper>
  )
}

const VideoEmbedNode = Node.create({
  name: 'videoEmbed',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-src') ?? '',
      },
    }
  },
  parseHTML() {
    return [{ tag: 'div[data-type="video-embed"]' }]
  },
  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'video-embed', 'data-src': node.attrs.src }),
      ['iframe', {
        src: node.attrs.src,
        frameborder: '0',
        allowfullscreen: '',
        allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
      }],
    ]
  },
  addNodeView() {
    return ReactNodeViewRenderer(VideoEmbedView)
  },
})

// ── Image node (selectable / draggable / cut & paste across editors) ──
// Extending the default Image node with `draggable` lets the user grab an
// inserted image and move it to another position. Because the src is a public
// URL, the default HTML clipboard handles cut/copy/paste — including pasting
// into a different editor instance.
const DraggableImage = ImageExt.extend({ draggable: true })

// ── Color presets ────────────────────────────────────────────────

const PRESET_COLORS = [
  '#111111', '#555555', '#888888', '#AAAAAA',
  '#0070F3', '#7C3AED', '#059669', '#C0392B',
  '#D97706', '#db2777', '#0891b2', '#65a30d',
]

// ── Toolbar ─────────────────────────────────────────────────────

type Editor = ReturnType<typeof useEditor>

function ToolBtn({ active, onClick, title, children }: { active?: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      className="w-[30px] h-[30px] rounded-[5px] flex items-center justify-center transition-colors font-[inherit]"
      style={{ background: active ? '#EBF3FF' : 'transparent', color: active ? '#0070F3' : '#555', border: active ? '1px solid #B3D4FC' : '1px solid transparent' }}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div style={{ width: '1px', height: '20px', background: '#EAEAEA', margin: '0 4px' }} />
}

function Toolbar({ editor, extraRight }: { editor: Editor | null; extraRight?: React.ReactNode }) {
  const [showColors, setShowColors] = useState(false)
  const colorPickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showColors) return
    const onClickOutside = (e: MouseEvent) => {
      if (!colorPickerRef.current?.contains(e.target as HTMLElement)) setShowColors(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [showColors])

  if (!editor) return null

  const currentColor = (editor.getAttributes('textStyle') as { color?: string }).color ?? null

  const addLink = () => {
    const prev = (editor.getAttributes('link').href as string) ?? ''
    const url = window.prompt('링크 URL', prev)
    if (url === null) return
    if (url === '') { editor.chain().focus().unsetLink().run(); return }
    editor.chain().focus().setLink({ href: url }).run()
  }

  const addVideo = () => {
    const url = window.prompt('영상 URL을 입력하세요\n(YouTube, Vimeo 지원)')
    if (!url) return
    const embedUrl = parseVideoUrl(url.trim())
    if (!embedUrl) {
      alert('지원하지 않는 영상 URL입니다.\nYouTube 또는 Vimeo URL을 입력해주세요.')
      return
    }
    editor.chain().focus().insertContent({ type: 'videoEmbed', attrs: { src: embedUrl } }).run()
  }

  const addSummaryList = () => {
    const items: SummaryItem[] = []
    editor.state.doc.forEach((node) => {
      if (node.type.name === 'heading' && (node.attrs.level === 2 || node.attrs.level === 3)) {
        const text = node.textContent.trim()
        if (text) items.push({ level: node.attrs.level as 2 | 3, text, id: toHeadingId(text) })
      }
    })
    editor.chain().focus().insertContent({
      type: 'summaryList',
      attrs: { title: '핵심 목록', items },
    }).run()
  }

  return (
    // sticky top-[60px]: AdminEditor 저장 툴바(≈60px) 바로 아래에 고정
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-border bg-[#FAFAFA] sticky top-[60px] z-10 rounded-t-[8px]">
      <ToolBtn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="소제목 H2">
        <Heading2 size={14} />
      </ToolBtn>
      <ToolBtn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="소제목 H3">
        <Heading3 size={14} />
      </ToolBtn>
      <Divider />
      <ToolBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="굵게">
        <Bold size={13} />
      </ToolBtn>
      <ToolBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="기울임">
        <Italic size={13} />
      </ToolBtn>
      <ToolBtn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="취소선">
        <Strikethrough size={13} />
      </ToolBtn>

      {/* Color picker */}
      <div ref={colorPickerRef} style={{ position: 'relative' }}>
        <button
          type="button"
          title="글자 색"
          onMouseDown={(e) => { e.preventDefault(); setShowColors((v) => !v) }}
          className="w-[30px] h-[30px] rounded-[5px] flex flex-col items-center justify-center gap-[2px] transition-colors"
          style={{
            background: showColors ? '#EBF3FF' : 'transparent',
            border: showColors ? '1px solid #B3D4FC' : '1px solid transparent',
          }}
        >
          <span style={{ fontWeight: 800, fontSize: '12px', color: currentColor ?? '#555', lineHeight: 1 }}>A</span>
          <div style={{ width: 14, height: 2.5, borderRadius: 1, background: currentColor ?? '#555' }} />
        </button>
        {showColors && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 50,
            background: 'white', border: '1px solid #EAEAEA', borderRadius: 8,
            padding: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', width: 148,
          }}>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetColor().run(); setShowColors(false) }}
              style={{
                width: '100%', fontSize: '10px', padding: '4px 6px', marginBottom: 6,
                background: '#F3F4F6', border: '1px solid #EAEAEA', borderRadius: 4,
                cursor: 'pointer', color: '#555', fontFamily: 'inherit',
              }}
            >
              기본색 (초기화)
            </button>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  title={color}
                  onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setColor(color).run(); setShowColors(false) }}
                  style={{
                    width: 26, height: 26, borderRadius: 4, background: color,
                    border: currentColor === color ? '2px solid #0070F3' : '1.5px solid rgba(0,0,0,0.12)',
                    cursor: 'pointer', padding: 0,
                  }}
                />
              ))}
            </div>
            {/* Custom RGB picker */}
            <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '10px', color: '#888', whiteSpace: 'nowrap' }}>직접 선택</span>
              <input
                type="color"
                value={currentColor ?? '#111111'}
                onChange={(e) => { editor.chain().focus().setColor(e.target.value).run() }}
                style={{ flex: 1, height: 26, borderRadius: 4, border: '1.5px solid rgba(0,0,0,0.12)', cursor: 'pointer', padding: 2 }}
              />
            </div>
          </div>
        )}
      </div>

      <Divider />
      <ToolBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="불릿 목록">
        <List size={14} />
      </ToolBtn>
      <ToolBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="번호 목록">
        <ListOrdered size={14} />
      </ToolBtn>
      <Divider />
      <ToolBtn active={editor.isActive('link')} onClick={addLink} title="링크 삽입">
        <Link size={13} />
      </ToolBtn>
      {editor.isActive('link') && (
        <ToolBtn active={false} onClick={() => editor.chain().focus().unsetLink().run()} title="링크 제거">
          <Unlink size={13} />
        </ToolBtn>
      )}
      <Divider />
      <ToolBtn active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="구분선 삽입">
        <Minus size={14} />
      </ToolBtn>
      <Divider />
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); addVideo() }}
        className="flex items-center gap-1 px-2.5 py-1 rounded-[5px] text-[11px] font-semibold transition-colors font-[inherit]"
        style={{ background: '#FFF7ED', color: '#D97706', border: '1px solid #FDE68A' }}
        title="영상 삽입"
      >
        <Video size={11} /> 영상
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().insertContent({ type: 'lawbox', attrs: { ref: '' }, content: [{ type: 'text', text: '법률 내용을 입력하세요' }] }).run() }}
        className="flex items-center gap-1 px-2.5 py-1 rounded-[5px] text-[11px] font-semibold transition-colors font-[inherit]"
        style={{ background: '#EBF3FF', color: '#0070F3', border: '1px solid #B3D4FC' }}
        title="법률 박스 삽입"
      >
        <Scale size={11} /> 법률 박스
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().insertContent({ type: 'tipbox', content: [{ type: 'text', text: '팁 내용을 입력하세요' }] }).run() }}
        className="flex items-center gap-1 px-2.5 py-1 rounded-[5px] text-[11px] font-semibold transition-colors font-[inherit]"
        style={{ background: '#EFFFEF', color: '#059669', border: '1px solid #A7F3D0' }}
        title="팁 박스 삽입"
      >
        <Lightbulb size={11} /> 팁 박스
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); addSummaryList() }}
        className="flex items-center gap-1 px-2.5 py-1 rounded-[5px] text-[11px] font-semibold transition-colors font-[inherit]"
        style={{ background: '#F0F7FF', color: '#0070F3', border: '1px solid #B3D4FC' }}
        title="요약 목록 삽입 (H2·H3 자동 추출)"
      >
        <ListChecks size={11} /> 요약 목록
      </button>
      {extraRight}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────

interface TiptapEditorProps {
  initialContent: string
  onChange: (html: string) => void
  postId: number
}

export default function TiptapEditor({ initialContent, onChange, postId }: TiptapEditorProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<Editor>(null)

  // Compress + upload an image file to Supabase storage; returns the public URL.
  const uploadImage = async (file: File): Promise<string | null> => {
    const compressed = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    })
    const ext = (file.name.split('.').pop() || 'png').toLowerCase()
    const objectKey = `posts/${postId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage
      .from('post-images')
      .upload(objectKey, compressed, { contentType: compressed.type, upsert: false })
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from('post-images').getPublicUrl(objectKey)
    return publicUrl
  }

  // Upload an image file then insert it — at `pos` for drops, else at the cursor.
  const insertImageFromFile = async (file: File, pos?: number) => {
    const ed = editorRef.current
    if (!ed) return
    setUploading(true)
    try {
      const url = await uploadImage(file)
      if (!url) return
      const chain = ed.chain().focus()
      if (typeof pos === 'number') chain.insertContentAt(pos, { type: 'image', attrs: { src: url } }).run()
      else                         chain.setImage({ src: url }).run()
    } catch (err) {
      console.error('Image upload failed:', err)
      alert('이미지 업로드에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setUploading(false)
    }
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
      }),
      HeadingWithId.configure({ levels: [2, 3] }),
      Placeholder.configure({ placeholder: '본문을 작성하세요...' }),
      LinkExt.configure({ openOnClick: false, HTMLAttributes: { class: 'tiptap-link' } }),
      DraggableImage.configure({ inline: false, allowBase64: false }),
      TextStyleExt,
      ColorExt,
      LawBoxNode,
      TipBoxNode,
      VideoEmbedNode,
      SummaryListNode,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: 'tiptap-prose outline-none' },
      // Paste an image straight from the OS clipboard (e.g. a screenshot) → upload + insert.
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items
        if (!items) return false
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile()
            if (file) { insertImageFromFile(file); return true }
          }
        }
        return false // text/HTML (incl. a cut image's <img>) → default handling
      },
      // Drop image files from the OS → upload at drop position. Dragging an
      // existing image node carries no files, so we defer to ProseMirror's move.
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files
        if (!files || files.length === 0) return false
        const images = Array.from(files).filter((f) => f.type.startsWith('image/'))
        if (images.length === 0) return false
        event.preventDefault()
        const coords = view.posAtCoords({ left: event.clientX, top: event.clientY })
        images.forEach((f) => insertImageFromFile(f, coords?.pos))
        return true
      },
    },
  })

  useEffect(() => { editorRef.current = editor }, [editor])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    await insertImageFromFile(file)
  }

  const imageBtn = (
    <>
      <Divider />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleImageUpload}
      />
      <button
        type="button"
        title="이미지 업로드"
        disabled={uploading}
        onMouseDown={(e) => { e.preventDefault(); fileInputRef.current?.click() }}
        className="flex items-center gap-1 px-2.5 py-1 rounded-[5px] text-[11px] font-semibold transition-colors font-[inherit]"
        style={{
          background: '#F0FFF4',
          color: uploading ? '#aaa' : '#059669',
          border: '1px solid #A7F3D0',
          cursor: uploading ? 'not-allowed' : 'pointer',
        }}
      >
        {uploading ? <Loader2 size={11} className="animate-spin" /> : <ImageIcon size={11} />}
        {uploading ? '업로드 중...' : '이미지'}
      </button>
    </>
  )

  return (
    // overflow-hidden 제거: sticky 동작을 막는 원인이었음. 대신 Toolbar에 rounded-t, 콘텐츠에 rounded-b 적용
    <div className="border border-border rounded-[8px]">
      <Toolbar editor={editor} extraRight={imageBtn} />
      <div className="px-5 py-5 min-h-[480px] rounded-b-[8px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
