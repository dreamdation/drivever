import type { Metadata } from 'next'
import Link from 'next/link'
import Footer from '@/components/layout/Footer'
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description:
    'Drivever 블로그의 개인정보처리방침 — 수집 항목, 이용 목적, 쿠키 및 Google AdSense 광고, 보유 기간, 이용자의 권리를 안내합니다.',
  alternates: { canonical: `${SITE_URL}/privacy` },
}

const CONTACT_EMAIL = 'dreamdation@gmail.com'
const EFFECTIVE_DATE = '2026년 5월 28일'

export default function PrivacyPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[760px] mx-auto px-6 py-10 md:py-14">
        <h1
          className="font-bold text-fg mb-2"
          style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.03em' }}
        >
          개인정보처리방침
        </h1>
        <p className="text-sm text-fg-3 mb-8">시행일: {EFFECTIVE_DATE}</p>

        <div className="flex flex-col gap-9 text-[0.9375rem] text-[#333] leading-[1.8]">
          <p>
            Drivever(이하 &ldquo;블로그&rdquo;)는 이용자의 개인정보를 중요하게 생각하며,
            「개인정보 보호법」 및 관련 법령을 준수합니다. 본 방침은 블로그가 어떤 정보를 수집하고,
            어떻게 이용·보관·파기하는지를 설명합니다.
          </p>

          <Section title="1. 수집하는 개인정보 항목">
            <ul className="list-disc pl-5 flex flex-col gap-1.5">
              <li><b>댓글 작성 시:</b> 닉네임, 비밀번호(4자리, 단방향 SHA-256 해시로만 저장), 댓글 내용, 작성 일시</li>
              <li><b>광고·제휴 문의 시:</b> 회사/브랜드명(선택), 담당자명, 이메일, 연락처(선택), 문의 내용</li>
              <li><b>자동 수집 정보:</b> 쿠키, 접속 IP, 브라우저/기기 정보, 방문 일시, 서비스 이용 기록</li>
            </ul>
          </Section>

          <Section title="2. 개인정보의 이용 목적">
            <ul className="list-disc pl-5 flex flex-col gap-1.5">
              <li>댓글 게시 및 작성자 본인 확인</li>
              <li>광고·제휴 문의에 대한 응대 및 회신</li>
              <li>서비스 이용 통계 분석 및 콘텐츠 개선</li>
              <li>맞춤형 광고 제공(아래 5항 참조) 및 부정 이용 방지</li>
            </ul>
          </Section>

          <Section title="3. 보유 및 이용 기간">
            <p>
              수집된 개인정보는 이용 목적이 달성되면 지체 없이 파기합니다. 다만 관련 법령에서
              보존을 요구하는 경우 해당 기간 동안 보관합니다.
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-1.5 mt-2">
              <li>댓글: 작성자가 삭제를 요청하거나 게시물이 삭제될 때까지</li>
              <li>광고·제휴 문의: 문의 처리 완료 후 1년</li>
              <li>접속 로그: 「통신비밀보호법」에 따라 3개월</li>
            </ul>
          </Section>

          <Section title="4. 개인정보의 제3자 제공">
            <p>
              블로그는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만 아래 5항의
              광고 서비스 제공을 위해 필요한 범위에서 광고 사업자에게 쿠키 기반 정보가 전달될 수
              있으며, 법령에 따른 요청이 있는 경우 관련 법령에 따라 제공할 수 있습니다.
            </p>
          </Section>

          <Section title="5. 쿠키 및 Google AdSense 광고">
            <p>
              블로그는 이용자 경험 개선과 맞춤형 광고 제공을 위해 쿠키(cookie)를 사용합니다.
              본 블로그는 Google AdSense를 통해 광고를 게재하며, Google을 비롯한 제3자 광고
              사업자는 쿠키(DART 쿠키 등)를 사용하여 이용자의 방문 기록을 기반으로 한 광고를
              제공할 수 있습니다.
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-1.5 mt-2">
              <li>
                이용자는{' '}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline"
                >
                  Google 광고 설정
                </a>
                에서 맞춤형 광고를 비활성화할 수 있습니다.
              </li>
              <li>
                제3자 광고 사업자의 쿠키 사용은{' '}
                <a
                  href="https://policies.google.com/technologies/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline"
                >
                  Google 광고 정책
                </a>
                {' '}및{' '}
                <a
                  href="http://www.aboutads.info/choices/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline"
                >
                  aboutads.info
                </a>
                에서 관리할 수 있습니다.
              </li>
              <li>이용자는 브라우저 설정을 통해 쿠키 저장을 거부하거나 삭제할 수 있습니다. 단, 일부 서비스 이용에 제한이 있을 수 있습니다.</li>
            </ul>
          </Section>

          <Section title="6. 이용자의 권리">
            <p>
              이용자는 언제든지 자신의 개인정보에 대한 열람·정정·삭제·처리정지를 요청할 수 있습니다.
              요청은 아래 연락처를 통해 접수되며, 블로그는 관련 법령에 따라 지체 없이 처리합니다.
            </p>
          </Section>

          <Section title="7. 개인정보의 안전성 확보 조치">
            <p>
              블로그는 개인정보를 안전하게 관리하기 위해 비밀번호의 단방향 암호화 저장,
              접근 권한 최소화, 전송 구간 암호화(HTTPS) 등의 조치를 취하고 있습니다.
            </p>
          </Section>

          <Section title="8. 문의처">
            <p>
              개인정보 관련 문의·요청은 아래 이메일로 연락해 주시기 바랍니다.
            </p>
            <p className="mt-2">
              이메일:{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent underline">
                {CONTACT_EMAIL}
              </a>
            </p>
          </Section>

          <Section title="9. 방침의 변경">
            <p>
              본 개인정보처리방침은 법령·정책 또는 서비스 변경에 따라 수정될 수 있으며,
              변경 시 본 페이지를 통해 공지합니다.
            </p>
          </Section>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link href="/terms" className="text-fg-2 hover:text-accent transition-colors">이용약관</Link>
          <Link href="/contact" className="text-fg-2 hover:text-accent transition-colors">연락처</Link>
          <Link href="/about" className="text-fg-2 hover:text-accent transition-colors">블로그 소개</Link>
        </div>
      </div>
      <Footer />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base md:text-lg font-bold text-fg mb-2.5" style={{ letterSpacing: '-0.02em' }}>
        {title}
      </h2>
      {children}
    </section>
  )
}
