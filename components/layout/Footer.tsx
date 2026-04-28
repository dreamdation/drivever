import Link from 'next/link'
import Image from 'next/image'

const COLS = [
  {
    head: '콘텐츠',
    items: [
      { href: '/blog?cat=교통법규', label: '교통법규' },
      { href: '/blog?cat=Premium Garage', label: 'Premium Garage' },
      { href: '/blog?cat=안전운전', label: '안전운전' },
    ],
  },
  {
    head: '블로그',
    items: [
      { href: '/about', label: '블로그 소개' },
      { href: '/', label: '최신 글' },
      { href: '/about', label: '광고 문의' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-border mt-16 bg-white">
      <div className="max-w-[1080px] mx-auto px-6 py-12 flex flex-col md:flex-row gap-7 md:gap-12 justify-between">
        {/* Brand */}
        <div className="max-w-xs">
          <div className="flex items-center gap-2 mb-2.5">
            <Image
              src="/favicon-drivever-512.png"
              width={18} height={18}
              alt="Drivever"
              className="object-contain opacity-50"
            />
            <span
              className="text-[0.9375rem] font-bold text-fg-3"
              style={{ letterSpacing: '-0.02em' }}
            >
              Drivever
            </span>
          </div>
          <p className="text-sm text-[#888] leading-relaxed mb-3">
            실제 오너의 경험 + 정확한 법률 해석 — 믿을 수 있는 자동차 정보
          </p>
          <p className="text-xs text-[#ccc]">
            © 2025 Drivever. 본 블로그의 정보는 참고용이며 법적 효력이 없습니다.
          </p>
        </div>

        {/* Nav columns */}
        <div className="hidden md:flex gap-12">
          {COLS.map((col) => (
            <div key={col.head} className="flex flex-col gap-2">
              <div
                className="text-[11px] font-bold text-[#888]"
                style={{ letterSpacing: '0.06em' }}
              >
                {col.head}
              </div>
              {col.items.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-sm text-fg-2 hover:text-accent transition-colors duration-150"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </footer>
  )
}
