import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'
import SiteShell from '@/components/layout/SiteShell'
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics'
import { SITE_URL } from '@/lib/site'
import { ADSENSE_CLIENT } from '@/lib/adsense'
import { GA_ID } from '@/lib/analytics'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Drivever — 실전 자동차·교통 정보 블로그',
    template: '%s | Drivever',
  },
  description:
    '실제 오너의 경험과 정확한 법률 해석을 제공하는 프리미엄 자동차·교통 정보 블로그. Audi Q7 유지보수, 교통법규 해석, 안전운전 가이드.',
  keywords: ['자동차', '교통법규', '안전운전', 'Audi Q7', '수입차', '연비', '도로교통법', '과태료'],
  authors: [{ name: 'Drivever 운영자' }],
  creator: 'Drivever',
  publisher: 'Drivever',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: SITE_URL,
    siteName: 'Drivever',
    title: 'Drivever — 실전 자동차·교통 정보 블로그',
    description: '실제 오너의 경험 + 정확한 법률 해석. 믿을 수 있는 자동차 정보.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Drivever — 실전 자동차·교통 정보 블로그',
    description: '실제 오너의 경험 + 정확한 법률 해석. 믿을 수 있는 자동차 정보.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  alternates: { canonical: SITE_URL },
  icons: {
    icon: '/favicon-drivever-512.png',
    apple: '/favicon-drivever-512.png',
  },
  ...(ADSENSE_CLIENT && {
    other: { 'google-adsense-account': ADSENSE_CLIENT },
  }),
}

export const viewport: Viewport = {
  themeColor: '#0a1628',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* Pretendard Variable — load via <link> (not a CSS @import, which
            chains behind globals.css and blocks render). preconnect speeds up
            the CDN handshake. */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body suppressHydrationWarning>
        {/* Google Consent Mode v2 — default everything to denied BEFORE the ads
            or analytics loaders run. The cookie banner flips these to 'granted'
            on consent. Also bootstraps gtag/dataLayer so GA can queue events. */}
        {(ADSENSE_CLIENT || GA_ID) && (
          <Script id="consent-default" strategy="beforeInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});`}
          </Script>
        )}
        <SiteShell>{children}</SiteShell>
        <GoogleAnalytics />
        {ADSENSE_CLIENT && (
          <Script
            id="adsbygoogle-loader"
            async
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
          />
        )}
      </body>
    </html>
  )
}
