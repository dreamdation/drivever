// HeroCarousel.jsx — Rolling hero banner with image + text overlay
const HeroCarousel = ({ slides, onReadMore }) => {
  const { useState, useEffect, useRef } = React;
  const [current, setCurrent] = useState(0);
  const [animDir, setAnimDir] = useState(1); // 1=next, -1=prev
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef(null);
  const isMobile = window.innerWidth < 768;

  const goTo = (idx) => {
    if (transitioning || idx === current) return;
    setAnimDir(idx > current ? 1 : -1);
    setTransitioning(true);
    setTimeout(() => { setCurrent(idx); setTransitioning(false); }, 500);
  };

  const goNext = () => goTo((current + 1) % slides.length);
  const goPrev = () => goTo((current - 1 + slides.length) % slides.length);

  const resetTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(goNext, 5500);
  };

  useEffect(() => { resetTimer(); return () => clearInterval(timerRef.current); }, [current, slides.length]);

  const slide = slides[current] || slides[0];
  if (!slide) return null;

  const getBg = (s) => s.image
    ? `url(${s.image}) center/cover no-repeat`
    : s.bg || 'linear-gradient(135deg, #0a1628 0%, #162d4a 100%)';

  return (
    <div style={{ position:'relative', height: isMobile ? '380px' : '520px', overflow:'hidden', background:'#0a1628' }}>

      {/* Slide backgrounds — all rendered, opacity transition */}
      {slides.map((s, i) => (
        <div key={s.id} style={{
          position:'absolute', inset:0,
          background: getBg(s),
          opacity: i === current ? 1 : 0,
          transition: 'opacity 0.7s ease',
          zIndex: i === current ? 1 : 0,
        }} />
      ))}

      {/* Overlays */}
      <div style={{ position:'absolute', inset:0, zIndex:2, background:'radial-gradient(ellipse at 65% 40%, transparent 25%, rgba(0,0,0,0.5) 100%)' }} />
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'65%', zIndex:2, background:'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)' }} />
      {/* Subtle top fade */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'120px', zIndex:2, background:'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 100%)' }} />

      {/* Content */}
      <div style={{ position:'absolute', inset:0, zIndex:3, display:'flex', alignItems:'flex-end', opacity: transitioning ? 0 : 1, transition:'opacity 0.3s ease', transform: `translateY(${transitioning ? '8px' : '0'})`, transition:'opacity 0.3s ease, transform 0.3s ease' }}>
        <div style={{ maxWidth:'1080px', margin:'0 auto', width:'100%', padding: isMobile ? '0 20px 52px' : '0 64px 72px' }}>

          {/* Slide counter */}
          <div style={{ fontSize:'11px', letterSpacing:'0.08em', fontWeight:600, marginBottom:'12px', display:'flex', alignItems:'center', gap:'2px' }}>
            <span style={{ color:'#fff' }}>{String(current+1).padStart(2,'0')}</span>
            <span style={{ color:'rgba(255,255,255,0.35)', margin:'0 5px' }}>/</span>
            <span style={{ color:'rgba(255,255,255,0.35)' }}>{String(slides.length).padStart(2,'0')}</span>
          </div>

          {/* Category chip */}
          <div style={{ marginBottom:'12px' }}>
            <span style={{ display:'inline-block', padding:'3px 10px', background:'rgba(0,112,243,0.9)', backdropFilter:'blur(4px)', color:'#fff', borderRadius:'4px', fontSize:'11px', fontWeight:700, letterSpacing:'0.06em' }}>
              {slide.category}
            </span>
          </div>

          {/* Title */}
          <h2 style={{ fontSize: isMobile ? '1.5rem' : '2.375rem', fontWeight:700, color:'#fff', lineHeight:1.2, letterSpacing:'-0.03em', marginBottom:'10px', maxWidth: isMobile ? '100%' : '620px', textWrap:'pretty', textShadow:'0 2px 16px rgba(0,0,0,0.4)' }}>
            {slide.title}
          </h2>

          {/* Description */}
          {!isMobile && (
            <p style={{ fontSize:'1rem', color:'rgba(255,255,255,0.78)', lineHeight:1.6, maxWidth:'460px', marginBottom:'20px' }}>
              {slide.description}
            </p>
          )}

          {/* CTA */}
          <button style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'9px 18px', background:'#0070F3', color:'#fff', border:'none', borderRadius:'6px', fontSize:'0.875rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'background 0.15s', marginTop: isMobile ? '10px' : '0' }}
            onClick={() => onReadMore && onReadMore(slide)}
            onMouseEnter={e => e.currentTarget.style.background='#005fd6'}
            onMouseLeave={e => e.currentTarget.style.background='#0070F3'}>
            자세히 읽기
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      {/* Arrows */}
      {!isMobile && (
        <>
          <button onClick={() => { goPrev(); resetTimer(); }} style={{ position:'absolute', left:'20px', top:'50%', transform:'translateY(-50%)', zIndex:4, width:'42px', height:'42px', borderRadius:'50%', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', backdropFilter:'blur(4px)', transition:'background 0.15s' }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.25)'}
            onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.12)'}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button onClick={() => { goNext(); resetTimer(); }} style={{ position:'absolute', right:'20px', top:'50%', transform:'translateY(-50%)', zIndex:4, width:'42px', height:'42px', borderRadius:'50%', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', backdropFilter:'blur(4px)', transition:'background 0.15s' }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.25)'}
            onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.12)'}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </>
      )}

      {/* Dots */}
      <div style={{ position:'absolute', bottom:'18px', left:0, right:0, zIndex:4, display:'flex', justifyContent:'center', gap:'6px', alignItems:'center' }}>
        {slides.map((_, i) => (
          <button key={i} onClick={() => { goTo(i); resetTimer(); }} style={{ height:'6px', width: i===current ? '24px' : '6px', borderRadius:'3px', border:'none', cursor:'pointer', padding:0, background: i===current ? '#fff' : 'rgba(255,255,255,0.36)', transition:'all 0.35s ease' }} />
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'2px', zIndex:4, background:'rgba(255,255,255,0.1)' }}>
        <div key={current} style={{ height:'100%', background:'rgba(255,255,255,0.5)', animation:'hero-progress 5.5s linear forwards' }} />
      </div>
      <style>{`@keyframes hero-progress { from { width:0% } to { width:100% } }`}</style>
    </div>
  );
};

Object.assign(window, { HeroCarousel });
