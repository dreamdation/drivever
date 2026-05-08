'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { HeroSlide, Post } from '@/lib/types'

interface HeroCarouselProps {
  slides: HeroSlide[]
  posts: Post[]
}

export default function HeroCarousel({ slides, posts }: HeroCarouselProps) {
  const router = useRouter()
  const [current, setCurrent] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = (idx: number) => {
    if (transitioning || idx === current) return
    setTransitioning(true)
    setTimeout(() => { setCurrent(idx); setTransitioning(false) }, 500)
  }

  const goNext = () => goTo((current + 1) % slides.length)
  const goPrev = () => goTo((current - 1 + slides.length) % slides.length)

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(goNext, 5500)
  }

  useEffect(() => {
    resetTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, slides.length])

  if (!slides.length) return null
  const slide = slides[current]

  const getBg = (s: HeroSlide) =>
    s.image
      ? `url(${s.image}) center/cover no-repeat`
      : s.bg || 'linear-gradient(135deg, #0a1628 0%, #162d4a 100%)'

  const handleReadMore = () => {
    const post = posts.find((p) => p.id === slide.postId)
    if (post) router.push(`/blog/${post.slug}`)
  }

  return (
    <div
      className="relative overflow-hidden"
      style={{ height: 'clamp(380px, 40vw, 520px)', background: '#0a1628' }}
    >
      {/* Slide backgrounds */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ background: getBg(s), opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
        />
      ))}

      {/* Gradient overlays */}
      <div className="absolute inset-0 z-[2]" style={{ background: 'radial-gradient(ellipse at 65% 40%, transparent 25%, rgba(0,0,0,0.5) 100%)' }} />
      <div className="absolute bottom-0 left-0 right-0 h-[65%] z-[2]" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)' }} />
      <div className="absolute top-0 left-0 right-0 h-[120px] z-[2]" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 100%)' }} />

      {/* Content */}
      <div
        className="absolute inset-0 z-[3] flex items-end"
        style={{
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? 'translateY(8px)' : 'translateY(0)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
        }}
      >
        <div className="w-full max-w-[1080px] mx-auto px-5 md:px-16 pb-[52px] md:pb-[72px]">
          {/* Counter */}
          <div className="flex items-center gap-1 mb-3" style={{ fontSize: '11px', letterSpacing: '0.08em', fontWeight: 600 }}>
            <span className="text-white">{String(current + 1).padStart(2, '0')}</span>
            <span style={{ color: 'rgba(255,255,255,0.35)', margin: '0 5px' }}>/</span>
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>{String(slides.length).padStart(2, '0')}</span>
          </div>

          {/* Category chip */}
          <div className="mb-3">
            <span
              className="inline-block px-2.5 py-[3px] text-white text-[11px] font-bold rounded-sm"
              style={{ background: 'rgba(0,112,243,0.9)', letterSpacing: '0.06em', backdropFilter: 'blur(4px)' }}
            >
              {slide.category}
            </span>
          </div>

          {/* Title */}
          <h2
            className="text-white font-bold leading-tight mb-2.5 max-w-[620px] text-pretty"
            style={{
              fontSize: 'clamp(1.5rem, 3.5vw, 2.375rem)',
              letterSpacing: '-0.03em',
              textShadow: '0 2px 16px rgba(0,0,0,0.4)',
            }}
          >
            {slide.title}
          </h2>

          {/* Description */}
          <p
            className="hidden md:block text-base max-w-[460px] mb-5"
            style={{ color: 'rgba(255,255,255,0.78)', lineHeight: 1.6 }}
          >
            {slide.description}
          </p>

          {/* CTA */}
          <button
            onClick={handleReadMore}
            className="inline-flex items-center gap-1.5 px-[18px] py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-[6px] transition-colors duration-150 mt-2.5 md:mt-0"
          >
            자세히 읽기
            <ChevronRight size={13} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Arrows (desktop) */}
      <button
        onClick={() => { goPrev(); resetTimer() }}
        className="hidden md:flex absolute left-5 top-1/2 -translate-y-1/2 z-[4] w-[42px] h-[42px] rounded-full items-center justify-center text-white transition-colors duration-150"
        style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.25)')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)')}
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={() => { goNext(); resetTimer() }}
        className="hidden md:flex absolute right-5 top-1/2 -translate-y-1/2 z-[4] w-[42px] h-[42px] rounded-full items-center justify-center text-white transition-colors duration-150"
        style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.25)')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)')}
      >
        <ChevronRight size={18} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-[18px] left-0 right-0 z-[4] flex justify-center gap-1.5 items-center">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => { goTo(i); resetTimer() }}
            className="h-[6px] rounded-full border-none cursor-pointer p-0 transition-all duration-[350ms]"
            style={{
              width: i === current ? '24px' : '6px',
              background: i === current ? '#fff' : 'rgba(255,255,255,0.36)',
            }}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] z-[4]" style={{ background: 'rgba(255,255,255,0.1)' }}>
        <div
          key={current}
          className="h-full animate-hero-progress"
          style={{ background: 'rgba(255,255,255,0.5)' }}
        />
      </div>
    </div>
  )
}
