import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/blog/1', destination: '/blog/2025년-달라진-교통법규-총정리-음주운전-스쿨존-우회전', permanent: true },
      { source: '/blog/2', destination: '/blog/audi-q7-55-tfsi-6개월-실연비-리포트-가솔린-대형-suv의-현실', permanent: true },
      { source: '/blog/3', destination: '/blog/고속도로-야간-운전-안전수칙-사고의-70-는-예방-가능하다', permanent: true },
      { source: '/blog/4', destination: '/blog/자전거-전동킥보드-도로-공유-법규-완벽-정리', permanent: true },
      { source: '/blog/5', destination: '/blog/q7-csp-esp-보증-패키지-완벽-가이드-실제-청구-사례-포함', permanent: true },
      { source: '/blog/6', destination: '/blog/타이어-교체-시기와-비용-절약법-브랜드별-마모-데이터', permanent: true },
      { source: '/blog/7', destination: '/blog/장마철-빗길-운전-완전-가이드-수막현상과-제동거리-계산법', permanent: true },
      { source: '/blog/8', destination: '/blog/주차-위반-과태료-총정리-구역별-금액과-이의신청-방법', permanent: true },
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.jsdelivr.net' },
      { protocol: 'https', hostname: '**' },
    ],
  },
}

export default nextConfig
