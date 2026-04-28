import type { Metadata } from 'next'
import './globals.css'
import SiteShell from '@/components/layout/SiteShell'

export const metadata: Metadata = {
  metadataBase: new URL('https://drivever.com'),
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
    url: 'https://drivever.com',
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
  alternates: { canonical: 'https://drivever.com' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* Pretendard Variable font — loaded via CSS @import in globals.css */}
        <link rel="icon" href="/favicon-drivever-512.png" type="image/png" />
      </head>
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  )
}
