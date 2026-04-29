'use client'

import { useState, useRef } from 'react'
import { useEditor, EditorContent, NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer, NodeViewProps } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import LinkExt from '@tiptap/extension-link'
import ImageExt from '@tiptap/extension-image'
import { Node, mergeAttributes } from '@tiptap/core'
import imageCompression from 'browser-image-compression'
import { supabase } from '@/lib/supabase'
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, Link, Scale, Lightbulb, Unlink, ImageIcon, Loader2 } from 'lucide-react'

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

// ── Custom node: TipBox ────────────────────────────────────��────

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
  if (!editor) return null

  const addLink = () => {
    const prev = editor.getAttributes('link').href as string ?? ''
    const url = window.prompt('링크 URL', prev)
    if (url === null) return
    if (url === '') { editor.chain().focus().unsetLink().run(); return }
    editor.chain().focus().setLink({ href: url }).run()
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-border bg-[#FAFAFA] sticky top-0 z-10">
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
      LawBoxNode,
      TipBoxNode,
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
    <div className="border border-border rounded-[8px] overflow-hidden">
      <Toolbar editor={editor} extraRight={imageBtn} />
      <div className="px-5 py-5 min-h-[480px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
