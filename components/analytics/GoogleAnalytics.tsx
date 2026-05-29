'use client'

import Script from 'next/script'
import { Suspense, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { GA_ID } from '@/lib/analytics'

// App Router client-side navigations don't reload the page, so the automatic
// page_view never fires. We disable it (send_page_view:false) and emit one
// here on every path/query change — including the initial mount.
function PageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag
    if (typeof gtag !== 'function') return
    const qs = searchParams?.toString()
    const path = qs ? `${pathname}?${qs}` : pathname
    gtag('event', 'page_view', {
      page_path: path,
      page_location: window.location.href,
      page_title: document.title,
    })
  }, [pathname, searchParams])

  return null
}

export default function GoogleAnalytics() {
  // Don't load GA on localhost/dev so the property isn't polluted with dev
  // traffic. gtag is still bootstrapped by the Consent Mode script in layout,
  // so trackEvent() calls elsewhere simply no-op in dev.
  if (!GA_ID || process.env.NODE_ENV !== 'production') return null

  return (
    <>
      <Script
        id="ga-loader"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-config" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());
gtag('config','${GA_ID}',{send_page_view:false});`}
      </Script>
      {/* useSearchParams requires a Suspense boundary in the App Router. */}
      <Suspense fallback={null}>
        <PageView />
      </Suspense>
    </>
  )
}
