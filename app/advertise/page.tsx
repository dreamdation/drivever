import type { Metadata } from 'next'
import AdInquiryForm from '@/components/contact/AdInquiryForm'
import Footer from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: '광고 문의',
  description: 'Drivever 블로그 광고 문의 — 배너·콘텐츠 광고 등 제휴 제안을 남겨주세요.',
  alternates: { canonical: 'https://drivever.com/advertise' },
}

export default function AdvertisePage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[760px] mx-auto px-6 py-10 md:py-14">
        <h1
          className="font-bold text-fg mb-2"
          style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.03em' }}
        >
          광고 문의
        </h1>
        <p className="text-sm md:text-base text-fg-2 leading-relaxed mb-7">
          Drivever와 함께 자동차·교통 관심 독자에게 다가가세요. 배너 광고, 콘텐츠 제휴, 브랜드 캠페인 등
          어떤 형태든 편하게 문의해주시면 담당자가 확인 후 회신드립니다.
        </p>
        <AdInquiryForm />
      </div>
      <Footer />
    </div>
  )
}
