'use client'

import { useState, useEffect } from 'react'
import { Facebook, Link2, Share2, MessageCircle, Check } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY

type KakaoSDK = {
  isInitialized: () => boolean
  init: (key: string) => void
  Share: { sendDefault: (settings: Record<string, unknown>) => void }
}
const getKakao = () => (window as unknown as { Kakao?: KakaoSDK }).Kakao

// Load the Kakao JS SDK once (shared across all ShareBar instances).
let kakaoLoad: Promise<void> | null = null
function loadKakaoSdk(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if (getKakao()) return Promise.resolve()
  if (kakaoLoad) return kakaoLoad
  kakaoLoad = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js'
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => {
      kakaoLoad = null // allow retry on next attempt
      reject(new Error('Kakao SDK load failed'))
    }
    document.head.appendChild(s)
  })
  return kakaoLoad
}

interface ShareBarProps {
  title: string
  description?: string
  imageUrl?: string
  className?: string
}

export default function ShareBar({ title, description, imageUrl, className }: ShareBarProps) {
  const [canNativeShare, setCanNativeShare] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [])

  const currentUrl = () => window.location.href
  const openPopup = (url: string) =>
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=640')

  const logShare = (method: string) =>
    trackEvent('share', { method, content_type: 'article', item_id: window.location.pathname })

  const shareX = () => {
    logShare('x')
    openPopup(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(currentUrl())}`)
  }

  const shareFacebook = () => {
    logShare('facebook')
    openPopup(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl())}`)
  }

  const shareNaver = () => {
    logShare('naver')
    openPopup(`https://share.naver.com/web/shareView?url=${encodeURIComponent(currentUrl())}&title=${encodeURIComponent(title)}`)
  }

  const shareKakao = async () => {
    if (!KAKAO_KEY) return
    try {
      await loadKakaoSdk()
      const Kakao = getKakao()
      if (!Kakao) return
      if (!Kakao.isInitialized()) Kakao.init(KAKAO_KEY)
      logShare('kakao')
      const link = { mobileWebUrl: currentUrl(), webUrl: currentUrl() }
      Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title,
          description: description ?? '',
          imageUrl: imageUrl || `${window.location.origin}/favicon-drivever-512.png`,
          link,
        },
        buttons: [{ title: '글 보러가기', link }],
      })
    } catch (e) {
      console.error('Kakao share failed:', e)
      alert('카카오톡 공유를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl())
      logShare('link')
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      alert('링크 복사에 실패했습니다.')
    }
  }

  const nativeShare = async () => {
    try {
      await navigator.share({ title, text: description, url: currentUrl() })
      logShare('native')
    } catch { /* user cancelled */ }
  }

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className ?? ''}`}>
      <span className="text-xs font-semibold text-fg-3 mr-0.5" style={{ letterSpacing: '0.02em' }}>공유</span>

      {KAKAO_KEY && (
        <CircleBtn label="카카오톡 공유" bg="#FEE500" color="#3C1E1E" onClick={shareKakao}>
          <MessageCircle size={16} fill="#3C1E1E" stroke="#3C1E1E" />
        </CircleBtn>
      )}

      <CircleBtn label="X(트위터) 공유" bg="#000000" color="#fff" onClick={shareX}>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </CircleBtn>

      <CircleBtn label="페이스북 공유" bg="#1877F2" color="#fff" onClick={shareFacebook}>
        <Facebook size={16} fill="#fff" stroke="#fff" />
      </CircleBtn>

      <CircleBtn label="네이버 블로그 공유" bg="#03C75A" color="#fff" onClick={shareNaver}>
        <span className="text-[15px] font-extrabold leading-none">N</span>
      </CircleBtn>

      <CircleBtn label="링크 복사" bg="#F3F4F6" color={copied ? '#059669' : '#555'} border="#E5E7EB" onClick={copyLink}>
        {copied ? <Check size={15} /> : <Link2 size={15} />}
      </CircleBtn>

      {canNativeShare && (
        <CircleBtn label="기기 공유" bg="#F3F4F6" color="#555" border="#E5E7EB" onClick={nativeShare}>
          <Share2 size={15} />
        </CircleBtn>
      )}

      {copied && <span className="text-xs font-semibold text-success">링크가 복사되었습니다</span>}
    </div>
  )
}

function CircleBtn({
  label, bg, color, border, onClick, children,
}: {
  label: string
  bg: string
  color: string
  border?: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="w-9 h-9 rounded-full flex items-center justify-center transition-transform duration-150 hover:scale-110 cursor-pointer"
      style={{ background: bg, color, border: `1px solid ${border ?? 'transparent'}` }}
    >
      {children}
    </button>
  )
}
