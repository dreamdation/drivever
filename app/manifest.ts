import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Drivever — 실전 자동차·교통 정보 블로그',
    short_name: 'Drivever',
    description: '실제 오너의 경험을 담은 자동차·교통 정보 블로그.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0a1628',
    lang: 'ko',
    icons: [
      { src: '/favicon-drivever-512.png', sizes: '192x192', type: 'image/png' },
      { src: '/favicon-drivever-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  }
}
