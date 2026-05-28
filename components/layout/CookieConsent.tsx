'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Cookie } from 'lucide-react'

const CONSENT_KEY = 'dv_cookie_consent' // 'granted' | 'denied'

type Consent = 'granted' | 'denied'

// Pushes a Google Consent Mode v2 update for the ad/analytics signals.
function applyConsent(value: Consent) {
  const g = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag
  if (typeof g !== 'function') return
  g('consent', 'update', {
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
    analytics_storage: value,
  })
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  // After mount (avoids SSR/hydration mismatch): show the banner only when the
  // visitor hasn't chosen yet. Returning visitors re-apply their stored choice.
  useEffect(() => {
    let stored: string | null = null
    try { stored = localStorage.getItem(CONSENT_KEY) } catch { /* ignore */ }
    if (stored === 'granted') applyConsent('granted')
    else if (stored === 'denied') applyConsent('denied')
    else setVisible(true)
  }, [])

  const choose = (value: Consent) => {
    try { localStorage.setItem(CONSENT_KEY, value) } catch { /* ignore */ }
    applyConsent(value)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="쿠키 동의"
      className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div
        className="mx-auto max-w-[760px] bg-white border border-border rounded-[12px] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-full bg-accent-light shrink-0 flex items-center justify-center">
            <Cookie size={18} className="text-accent" />
          </div>
          <p className="text-[13px] sm:text-sm text-fg-2 leading-relaxed">
            Drivever는 서비스 개선과 맞춤형 광고(Google AdSense) 제공을 위해 쿠키를 사용합니다.
            ‘모두 허용’을 누르면 광고·분석 쿠키 사용에 동의하게 됩니다. 자세한 내용은{' '}
            <Link href="/privacy" className="text-accent underline">개인정보처리방침</Link>
            을 확인하세요.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => choose('denied')}
            className="px-4 py-2 border border-border rounded-[6px] bg-white text-sm text-fg-2 hover:bg-surface transition-colors font-[inherit] whitespace-nowrap"
          >
            필수만 허용
          </button>
          <button
            type="button"
            onClick={() => choose('granted')}
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-[6px] transition-colors font-[inherit] whitespace-nowrap"
          >
            모두 허용
          </button>
        </div>
      </div>
    </div>
  )
}
