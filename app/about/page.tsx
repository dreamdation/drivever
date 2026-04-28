import type { Metadata } from 'next'
import Image from 'next/image'
import AdSlot from '@/components/blog/AdSlot'
import Footer from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: '블로그 소개',
  description: 'Drivever는 실제 오너의 경험과 정확한 법률 해석을 제공하는 프리미엄 자동차·교통 정보 블로그입니다.',
  alternates: { canonical: 'https://drivever.com/about' },
}

const CONTENT_CATEGORIES = [
  { cat: 'Premium Garage', color: '#7C3AED', bg: '#F3EEFF', desc: '2023년식 Audi Q7 55 TFSI 오너의 실제 유지·관리 경험담.' },
  { cat: 'Safe Drive Guide', color: '#0070F3', bg: '#EBF3FF', desc: '도로 위 실전 상황과 과태료 방어 팁.' },
  { cat: '교통법규 해석', color: '#059669', bg: '#ECFDF5', desc: '도로교통법 조항을 정확히 인용하되, 쉽게 풀어쓰는 가이드.' },
  { cat: '차량관리', color: '#D97706', bg: '#FFFBEB', desc: '타이어, 엔진오일 등 소모품 교체 시기와 비용 절약 팁.' },
]

export default function AboutPage() {
  return (
    <div>
      {/* Hero banner */}
      <div className="py-12 md:py-[72px] px-6 text-center" style={{ background: '#0a1628' }}>
        <div className="max-w-[680px] mx-auto">
          <Image
            src="/favicon-drivever-512.png"
            width={48} height={48}
            alt="Drivever"
            className="object-contain mx-auto mb-5"
            style={{ filter: 'brightness(0) invert(1)', opacity: 0.9 }}
          />
          <h1
            className="font-bold text-white mb-4 text-pretty"
            style={{ fontSize: 'clamp(1.875rem, 4vw, 2.5rem)', letterSpacing: '-0.03em', lineHeight: 1.2 }}
          >
            Drive smarter,<br />drive forever.
          </h1>
          <p className="text-[0.9375rem] md:text-base leading-[1.7]" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Drivever는 실제 오너의 경험과 정확한 법률 해석을 제공하는 프리미엄 자동차·교통 정보 블로그입니다.
          </p>
        </div>
      </div>

      <div className="max-w-[720px] mx-auto px-6 py-14 md:py-[56px]">
        <AdSlot size="leaderboard" />

        {/* Mission */}
        <section className="mb-12">
          <h2 className="text-lg font-bold text-fg mb-3.5 pb-3 border-b border-border" style={{ letterSpacing: '-0.02em' }}>
            블로그의 미션
          </h2>
          <p className="text-base text-[#333] leading-[1.75]" style={{ letterSpacing: '-0.01em' }}>
            구글 E-E-A-T(경험·전문성·권위성·신뢰성) 기준을 충족하는 콘텐츠를 만들기 위해, Drivever의 모든 글은 두 가지 기준을 지킵니다.
            첫째, 실제 오너의 경험을 영수증과 계기판 데이터로 뒷받침합니다.
            둘째, 교통법규 내용은 반드시 법 조항을 직접 인용하고 해석을 명확히 합니다.
          </p>
        </section>

        {/* Content categories */}
        <section className="mb-12">
          <h2 className="text-lg font-bold text-fg mb-3.5 pb-3 border-b border-border" style={{ letterSpacing: '-0.02em' }}>
            다루는 콘텐츠
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-4">
            {CONTENT_CATEGORIES.map(({ cat, color, bg, desc }) => (
              <div key={cat} className="border border-border rounded-[8px] p-[18px]">
                <span
                  className="inline-block px-2 py-[2px] rounded-sm text-[11px] font-bold mb-2.5"
                  style={{ background: bg, color }}
                >
                  {cat}
                </span>
                <p className="text-sm text-fg-2 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Author */}
        <section className="mb-12">
          <h2 className="text-lg font-bold text-fg mb-3.5 pb-3 border-b border-border" style={{ letterSpacing: '-0.02em' }}>
            필자 소개
          </h2>
          <div className="border border-border rounded-[8px] p-[22px] flex gap-[18px] items-start mt-4">
            <div className="w-12 h-12 rounded-full bg-accent-light shrink-0 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0070F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-fg mb-1.5">Drivever 운영자</div>
              <p className="text-sm text-fg-2 leading-[1.7]">
                2023년식 Audi Q7 55 TFSI 오너. 수입차 유지보수와 교통법규에 깊은 관심을 갖고 있습니다.
                모든 정보는 직접 경험한 데이터와 공식 법령을 기반으로 작성합니다.
              </p>
            </div>
          </div>
        </section>

        <AdSlot size="leaderboard" label="광고 영역 — 소개 페이지 하단" />
      </div>

      <Footer />
    </div>
  )
}
