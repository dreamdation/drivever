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
import imageCompression from 'browser-image-compression'
import { supabase } from '@/lib/supabase'
import { Bold, Italic, Strikethrough, Heading2, Heading3, List, ListOrdered, Link, Scale, Lightbulb, Unlink, ImageIcon, Loader2, Minus, Video } from 'lucide-react'

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
      {extraRight}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────

interface TiptapEditorProps {
  initialContent: string
  onChange: (html: string) => void
}

export default function TiptapEditor({ initialContent, onChange }: TiptapEditorProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        code: false,
      }),
      Placeholder.configure({ placeholder: '본문을 작성하세요...' }),
      LinkExt.configure({ openOnClick: false, HTMLAttributes: { class: 'tiptap-link' } }),
      ImageExt.configure({ inline: false, allowBase64: false }),
      TextStyleExt,
      ColorExt,
      LawBoxNode,
      TipBoxNode,
      VideoEmbedNode,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: 'tiptap-prose outline-none' },
    },
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return
    e.target.value = ''

    setUploading(true)
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      })

      const ext = file.name.split('.').pop() ?? 'jpg'
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error } = await supabase.storage
        .from('post-images')
        .upload(fileName, compressed, { contentType: compressed.type, upsert: false })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(fileName)

      editor.chain().focus().setImage({ src: publicUrl }).run()
    } catch (err) {
      console.error('Image upload failed:', err)
      alert('이미지 업로드에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setUploading(false)
    }
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
