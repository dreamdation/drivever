import type { Metadata } from 'next'
import Link from 'next/link'
import Footer from '@/components/layout/Footer'
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  title: '이용약관',
  description:
    'Drivever 블로그 이용약관 — 콘텐츠 이용, 저작권, 면책, 댓글 운영 정책을 안내합니다.',
  alternates: { canonical: `${SITE_URL}/terms` },
}

const EFFECTIVE_DATE = '2026년 5월 28일'

export default function TermsPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[760px] mx-auto px-6 py-10 md:py-14">
        <h1
          className="font-bold text-fg mb-2"
          style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.03em' }}
        >
          이용약관
        </h1>
        <p className="text-sm text-fg-3 mb-8">시행일: {EFFECTIVE_DATE}</p>

        <div className="flex flex-col gap-9 text-[0.9375rem] text-[#333] leading-[1.8]">
          <Section title="제1조 (목적)">
            <p>
              본 약관은 Drivever(이하 &ldquo;블로그&rdquo;)가 제공하는 자동차·교통 정보 콘텐츠 및
              관련 서비스의 이용 조건과 절차, 이용자와 블로그의 권리·의무 및 책임 사항을
              규정함을 목적으로 합니다.
            </p>
          </Section>

          <Section title="제2조 (콘텐츠의 성격 및 면책)">
            <ul className="list-disc pl-5 flex flex-col gap-1.5">
              <li>
                블로그의 모든 콘텐츠(교통법규 해석, 차량 유지보수 정보, 비용·연비 데이터 등)는
                작성 시점의 정보와 운영자의 개인적 경험을 바탕으로 한 <b>참고용 정보</b>이며,
                법적 자문이나 공식 견해가 아닙니다.
              </li>
              <li>
                교통법규·과태료 등은 시행 시점과 개정 여부에 따라 달라질 수 있으므로, 실제 적용
                시에는 반드시 관계 법령 원문과 관할 기관의 공식 안내를 확인하시기 바랍니다.
              </li>
              <li>
                이용자가 본 블로그의 정보를 신뢰하여 행한 의사결정 및 그 결과에 대해 블로그는
                법적 책임을 지지 않습니다.
              </li>
            </ul>
          </Section>

          <Section title="제3조 (저작권)">
            <ul className="list-disc pl-5 flex flex-col gap-1.5">
              <li>
                블로그에 게시된 글·이미지·데이터 등 모든 콘텐츠의 저작권은 별도 표기가 없는 한
                Drivever에 귀속됩니다.
              </li>
              <li>
                이용자는 출처를 명확히 표기하고 비상업적 목적에 한해 일부를 인용할 수 있으며,
                무단 복제·배포·2차 가공·상업적 이용은 금지됩니다.
              </li>
            </ul>
          </Section>

          <Section title="제4조 (댓글 및 이용자 게시물)">
            <ul className="list-disc pl-5 flex flex-col gap-1.5">
              <li>이용자가 작성한 댓글의 책임은 작성자 본인에게 있습니다.</li>
              <li>
                다음에 해당하는 게시물은 사전 통지 없이 삭제될 수 있습니다: 욕설·비방·명예훼손,
                광고·스팸, 음란·불법 정보, 운영자/관리자 사칭, 타인의 권리 침해.
              </li>
              <li>이용자는 댓글 작성 시 설정한 비밀번호로 본인 게시물의 관리(삭제)를 요청할 수 있습니다.</li>
            </ul>
          </Section>

          <Section title="제5조 (광고의 게재)">
            <p>
              블로그는 Google AdSense 등 제3자 광고를 게재할 수 있습니다. 광고의 내용 및
              광고주의 상품·서비스에 대한 책임은 해당 광고주에게 있으며, 블로그는 이를 보증하지
              않습니다. 광고 관련 개인정보 처리는{' '}
              <Link href="/privacy" className="text-accent underline">개인정보처리방침</Link>
              을 따릅니다.
            </p>
          </Section>

          <Section title="제6조 (서비스의 변경 및 중단)">
            <p>
              블로그는 운영상·기술상의 필요에 따라 콘텐츠 및 서비스의 전부 또는 일부를 변경하거나
              중단할 수 있으며, 이로 인해 발생한 이용자의 불이익에 대해 별도의 책임을 지지 않습니다.
            </p>
          </Section>

          <Section title="제7조 (약관의 변경)">
            <p>
              본 약관은 관련 법령 및 운영 정책에 따라 변경될 수 있으며, 변경 시 본 페이지를 통해
              공지합니다. 변경된 약관은 공지된 시점부터 효력이 발생합니다.
            </p>
          </Section>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link href="/privacy" className="text-fg-2 hover:text-accent transition-colors">개인정보처리방침</Link>
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
