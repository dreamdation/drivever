import DOMPurify from 'isomorphic-dompurify'

// Article bodies are authored by the admin via Tiptap, but we still sanitize
// the stored HTML before injecting it with dangerouslySetInnerHTML. This is
// defense-in-depth: if the admin account is ever compromised, stored XSS can't
// be served to every visitor.

let hooked = false
function ensureHook() {
  if (hooked) return
  hooked = true
  // Only allow video embeds from YouTube/Vimeo; drop any other iframe.
  DOMPurify.addHook('uponSanitizeElement', (node, data) => {
    if (data.tagName !== 'iframe') return
    const el = node as Element
    const src = el.getAttribute('src') ?? ''
    const allowed =
      src.startsWith('https://www.youtube.com/embed/') ||
      src.startsWith('https://www.youtube-nocookie.com/embed/') ||
      src.startsWith('https://player.vimeo.com/video/')
    if (!allowed) el.remove()
  })
}

export function sanitizeHtml(dirty: string): string {
  ensureHook()
  return DOMPurify.sanitize(dirty, {
    // Tiptap emits iframes for video embeds; allow the tag + its layout attrs.
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'target', 'rel'],
    // data-* attributes (used by lawbox/tipbox/summary-list/video nodes) are
    // allowed by default. Block javascript: and other unsafe URI schemes.
    FORBID_ATTR: ['onerror', 'onload', 'onclick'],
  })
}
