import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail, Megaphone, MessageCircle } from 'lucide-react'
import Footer from '@/components/layout/Footer'
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  title: '연락처',
  description:
    'Drivever 블로그 연락처 — 콘텐츠 제보, 정정 요청, 광고·제휴 문의 등 운영자에게 연락하는 방법을 안내합니다.',
  alternates: { canonical: `${SITE_URL}/contact` },
}

const CONTACT_EMAIL = 'dreamdation@gmail.com'

export default function ContactPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[720px] mx-auto px-6 py-10 md:py-14">
        <h1
          className="font-bold text-fg mb-2"
          style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.03em' }}
        >
          연락처
        </h1>
        <p className="text-sm md:text-base text-fg-2 leading-relaxed mb-8">
          Drivever 블로그에 대한 문의, 콘텐츠 제보·정정 요청, 개인정보 관련 요청은 아래 이메일로
          연락해 주세요. 확인 후 순차적으로 회신드립니다.
        </p>

        {/* Email card */}
        <div className="border border-border rounded-[10px] p-6 flex items-start gap-4 mb-4">
          <div className="w-11 h-11 rounded-full bg-accent-light shrink-0 flex items-center justify-center">
            <Mail size={20} className="text-accent" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-fg mb-1">이메일 문의</div>
            <p className="text-sm text-fg-2 leading-relaxed mb-2">
              가장 빠른 연락 수단입니다. 일반 문의·제보·정정 요청 모두 받습니다.
            </p>
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-sm font-semibold text-accent underline break-all">
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>

        {/* Advertise card */}
        <div className="border border-border rounded-[10px] p-6 flex items-start gap-4 mb-4">
          <div className="w-11 h-11 rounded-full bg-accent-light shrink-0 flex items-center justify-center">
            <Megaphone size={20} className="text-accent" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-fg mb-1">광고·제휴 문의</div>
            <p className="text-sm text-fg-2 leading-relaxed mb-2">
              배너 광고, 콘텐츠 제휴, 브랜드 캠페인 등은 전용 문의 양식을 이용해 주세요.
            </p>
            <Link href="/advertise" className="text-sm font-semibold text-accent underline">
              광고 문의 양식으로 이동 →
            </Link>
          </div>
        </div>

        {/* Response note */}
        <div className="border border-border rounded-[10px] p-6 flex items-start gap-4">
          <div className="w-11 h-11 rounded-full bg-accent-light shrink-0 flex items-center justify-center">
            <MessageCircle size={20} className="text-accent" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-fg mb-1">댓글로 문의</div>
            <p className="text-sm text-fg-2 leading-relaxed">
              특정 글에 대한 질문은 해당 글 하단의 댓글로 남겨 주시면 운영자가 확인 후 답변드립니다.
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link href="/privacy" className="text-fg-2 hover:text-accent transition-colors">개인정보처리방침</Link>
          <Link href="/terms" className="text-fg-2 hover:text-accent transition-colors">이용약관</Link>
          <Link href="/about" className="text-fg-2 hover:text-accent transition-colors">블로그 소개</Link>
        </div>
      </div>
      <Footer />
    </div>
  )
}
