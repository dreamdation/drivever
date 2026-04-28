// BlogPages.jsx — HomePage, AboutPage, PostListPage, Footer, SearchOverlay

// ── Responsive hook ───────────────────────────────────────────────────────
const useWindowWidth = () => {
  const { useState, useEffect } = React;
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return w;
};

// ── Footer ────────────────────────────────────────────────────────────────
const Footer = ({ onNavigate }) => {
  const w = useWindowWidth();
  const isMobile = w < 768;

  return (
    <footer style={{ borderTop:'1px solid #EAEAEA', padding: isMobile ? '36px 20px 28px' : '48px 24px 32px', marginTop:'64px', background:'#fff' }}>
      <div style={{ maxWidth:'1080px', margin:'0 auto', display:'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '28px' : '48px', justifyContent:'space-between' }}>
        <div style={{ maxWidth:'320px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'10px' }}>
            <img src="assets/favicon-drivever-512.png" width="18" height="18" alt="Drivever" style={{objectFit:'contain', opacity:0.5}} />
            <span style={{ fontSize:'0.9375rem', fontWeight:700, color:'#aaa', letterSpacing:'-0.02em' }}>Drivever</span>
          </div>
          <p style={{ fontSize:'0.8125rem', color:'#888', lineHeight:1.6, marginBottom:'12px' }}>실제 오너의 경험 + 정확한 법률 해석 — 믿을 수 있는 자동차 정보</p>
          <p style={{ fontSize:'11px', color:'#ccc' }}>© 2025 Drivever. 본 블로그의 정보는 참고용이며 법적 효력이 없습니다.</p>
        </div>
        {!isMobile && (
          <div style={{ display:'flex', gap:'48px' }}>
            {[
              { head:'콘텐츠', items:[['traffic','교통법규'],['garage','Premium Garage'],['safety','안전운전']] },
              { head:'블로그',  items:[['about','블로그 소개'],['home','최신 글'],['home','광고 문의']] },
            ].map(col => (
              <div key={col.head} style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                <div style={{ fontSize:'11px', fontWeight:700, color:'#888', letterSpacing:'0.06em', marginBottom:'4px' }}>{col.head}</div>
                {col.items.map(([id, label]) => (
                  <button key={label} onClick={() => onNavigate(id)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'0.8125rem', color:'#555', padding:0, textAlign:'left', fontFamily:'inherit' }}>
                    {label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </footer>
  );
};

// ── SearchOverlay ─────────────────────────────────────────────────────────
const SearchOverlay = ({ posts, onClose, onNavigate }) => {
  const { useState } = React;
  const [query, setQuery] = useState('');
  const results = query.length > 1
    ? posts.filter(p => p.title.includes(query) || p.description.includes(query) || p.category.includes(query))
    : [];

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', zIndex:200, display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:'80px' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'#fff', borderRadius:'12px', padding:'20px', width:'min(560px, 90vw)', boxShadow:'0 20px 48px rgba(0,0,0,0.14)', maxHeight:'70vh', overflowY:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', borderBottom:'1px solid #EAEAEA', paddingBottom:'14px', marginBottom:'14px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input autoFocus value={query} onChange={e=>setQuery(e.target.value)}
            placeholder="검색어를 입력하세요..."
            style={{ flex:1, border:'none', outline:'none', fontSize:'1rem', fontFamily:'inherit', color:'#111' }} />
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#aaa', fontSize:'1.125rem', lineHeight:1, padding:'0 2px' }}>✕</button>
        </div>
        {query.length === 0 && (
          <div style={{ fontSize:'0.8125rem', color:'#bbb', padding:'8px 0' }}>인기 검색어: 음주운전, 엔진오일, 스쿨존, Audi Q7</div>
        )}
        {results.map(p => (
          <button key={p.id} style={{ display:'block', width:'100%', padding:'10px 4px', borderBottom:'1px solid #f3f3f3', cursor:'pointer', background:'#fff', border:'none', textAlign:'left', fontFamily:'inherit', transition:'background 0.1s' }}
            onClick={() => { onNavigate('article', p); onClose(); }}
            onMouseEnter={e=>e.currentTarget.style.background='#FAFAFA'}
            onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
            <div style={{ fontSize:'0.9375rem', fontWeight:600, color:'#111', marginBottom:'3px' }}>{p.title}</div>
            <div style={{ fontSize:'11px', color:'#aaa' }}>{p.category} · {p.date}</div>
          </button>
        ))}
        {query.length > 1 && results.length === 0 && (
          <div style={{ fontSize:'0.875rem', color:'#aaa', padding:'16px 0', textAlign:'center' }}>검색 결과가 없습니다.</div>
        )}
      </div>
    </div>
  );
};

// ── HomePage ──────────────────────────────────────────────────────────────
const HomePage = ({ posts, heroSlides, onNavigate }) => {
  const { useState } = React;
  const w = useWindowWidth();
  const isMobile = w < 768;
  const isTablet = w < 1024;

  const [cat, setCat] = useState('전체');
  const CATS = ['전체', '교통법규', 'Premium Garage', '안전운전', '차량관리'];

  const published = posts.filter(p => p.published !== false);
  const filtered = cat === '전체' ? published : published.filter(p => p.category === cat);
  const gridCols = isMobile ? '1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(3,1fr)';

  return (
    <div>
      <HeroCarousel slides={heroSlides} onReadMore={slide => {
        const post = posts.find(p => p.id === slide.postId);
        if (post) onNavigate('article', post);
      }} />

      {/* Ad below hero */}
      <div style={{ maxWidth:'1080px', margin:'0 auto', padding:'0 24px' }}>
        <AdSlot size="leaderboard" />
      </div>

      {/* Category tabs */}
      <div style={{ borderBottom:'1px solid #EAEAEA', background:'#FAFAFA', overflowX:'auto' }}>
        <div style={{ maxWidth:'1080px', margin:'0 auto', padding:'0 16px', display:'flex', gap:'2px', height:'44px', alignItems:'center', whiteSpace:'nowrap' }}>
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{
              padding:'5px 14px', fontSize:'12px', fontWeight:600, borderRadius:'4px',
              cursor:'pointer', border:'none', fontFamily:'inherit', letterSpacing:'0.01em',
              background: cat===c ? '#EBF3FF' : 'transparent', color: cat===c ? '#0070F3' : '#555',
              transition:'background 0.15s, color 0.15s', flexShrink:0,
            }}>{c}</button>
          ))}
        </div>
      </div>

      {/* Post grid */}
      <div style={{ maxWidth:'1080px', margin:'0 auto', padding: isMobile ? '24px 16px' : '32px 24px' }}>
        <div style={{ display:'grid', gridTemplateColumns:gridCols, gap:'16px', marginBottom:'24px' }}>
          {filtered.slice(0,isMobile?2:isTablet?4:3).map(p => (
            <PostCard key={p.id} post={p} onClick={post => onNavigate('article', post)} />
          ))}
        </div>

        {filtered.length > (isMobile?2:isTablet?4:3) && (
          <>
            <AdSlot size="leaderboard" label="광고 영역 — 728×90 (목록 중간)" />
            <div style={{ display:'grid', gridTemplateColumns:gridCols, gap:'16px', marginBottom:'24px' }}>
              {filtered.slice(isMobile?2:isTablet?4:3, isMobile?4:isTablet?8:6).map(p => (
                <PostCard key={p.id} post={p} onClick={post => onNavigate('article', post)} />
              ))}
            </div>
          </>
        )}

        {filtered.length > (isMobile?4:isTablet?8:6) && (
          <div style={{ display:'grid', gridTemplateColumns:gridCols, gap:'16px', marginBottom:'24px' }}>
            {filtered.slice(isMobile?4:isTablet?8:6, isMobile?6:isTablet?12:9).map(p => (
              <PostCard key={p.id} post={p} onClick={post => onNavigate('article', post)} />
            ))}
          </div>
        )}

        {/* Pagination */}
        <div style={{ display:'flex', justifyContent:'center', gap:'4px', marginTop:'8px' }}>
          {[1,2,3,4,5].map(n => (
            <button key={n} style={{
              width:'34px', height:'34px', borderRadius:'6px',
              border: n===1 ? 'none' : '1px solid #EAEAEA',
              background: n===1 ? '#0070F3' : '#fff',
              color: n===1 ? '#fff' : '#555',
              fontSize:'0.875rem', cursor:'pointer', fontFamily:'inherit', fontWeight: n===1 ? 700 : 400,
            }}>{n}</button>
          ))}
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

// ── AboutPage ─────────────────────────────────────────────────────────────
const AboutPage = ({ onNavigate }) => {
  const w = useWindowWidth();
  const isMobile = w < 768;

  return (
    <div>
      <div style={{ background:'#0a1628', padding: isMobile ? '48px 20px' : '72px 24px', textAlign:'center' }}>
        <div style={{ maxWidth:'680px', margin:'0 auto' }}>
          <img src="assets/favicon-drivever-512.png" width="48" height="48" alt="Drivever"
            style={{ objectFit:'contain', marginBottom:'20px', filter:'brightness(0) invert(1)', opacity:0.9 }} />
          <h1 style={{ fontSize: isMobile ? '1.875rem' : '2.5rem', fontWeight:700, color:'#fff', letterSpacing:'-0.03em', lineHeight:1.2, marginBottom:'16px' }}>
            Drive smarter,<br />drive forever.
          </h1>
          <p style={{ fontSize: isMobile ? '0.9375rem' : '1.0625rem', color:'rgba(255,255,255,0.7)', lineHeight:1.7 }}>
            Drivever는 실제 오너의 경험과 정확한 법률 해석을 제공하는 프리미엄 자동차·교통 정보 블로그입니다.
          </p>
        </div>
      </div>

      <div style={{ maxWidth:'720px', margin:'0 auto', padding: isMobile ? '36px 20px' : '56px 24px' }}>
        <AdSlot size="leaderboard" />

        <section style={{ marginBottom:'48px' }}>
          <h2 style={apSt.h2}>블로그의 미션</h2>
          <p style={apSt.body}>
            구글 E-E-A-T(경험·전문성·권위성·신뢰성) 기준을 충족하는 콘텐츠를 만들기 위해, Drivever의 모든 글은 두 가지 기준을 지킵니다. 첫째, 실제 오너의 경험을 영수증과 계기판 데이터로 뒷받침합니다. 둘째, 교통법규 내용은 반드시 법 조항을 직접 인용하고 해석을 명확히 합니다.
          </p>
        </section>

        <section style={{ marginBottom:'48px' }}>
          <h2 style={apSt.h2}>다루는 콘텐츠</h2>
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'14px', marginTop:'18px' }}>
            {[
              { cat:'Premium Garage', color:'#7C3AED', bg:'#F3EEFF', desc:'2023년식 Audi Q7 55 TFSI 오너의 실제 유지·관리 경험담.' },
              { cat:'Safe Drive Guide', color:'#0070F3', bg:'#EBF3FF', desc:'도로 위 실전 상황과 과태료 방어 팁.' },
              { cat:'교통법규 해석',    color:'#059669', bg:'#ECFDF5', desc:'도로교통법 조항을 정확히 인용하되, 쉽게 풀어쓰는 가이드.' },
              { cat:'차량관리',         color:'#D97706', bg:'#FFFBEB', desc:'타이어, 엔진오일 등 소모품 교체 시기와 비용 절약 팁.' },
            ].map(({ cat, color, bg, desc }) => (
              <div key={cat} style={{ border:'1px solid #EAEAEA', borderRadius:'8px', padding:'18px' }}>
                <span style={{ display:'inline-block', padding:'2px 8px', background:bg, color, borderRadius:'4px', fontSize:'11px', fontWeight:700, marginBottom:'10px' }}>{cat}</span>
                <p style={{ fontSize:'0.875rem', color:'#555', lineHeight:1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom:'48px' }}>
          <h2 style={apSt.h2}>필자 소개</h2>
          <div style={{ border:'1px solid #EAEAEA', borderRadius:'8px', padding:'22px', display:'flex', gap:'18px', alignItems:'flex-start', marginTop:'16px' }}>
            <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:'#EBF3FF', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0070F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            </div>
            <div>
              <div style={{ fontWeight:700, color:'#111', marginBottom:'6px' }}>Drivever 운영자</div>
              <p style={{ fontSize:'0.875rem', color:'#555', lineHeight:1.7 }}>
                2023년식 Audi Q7 55 TFSI 오너. 수입차 유지보수와 교통법규에 깊은 관심을 갖고 있습니다. 모든 정보는 직접 경험한 데이터와 공식 법령을 기반으로 작성합니다.
              </p>
            </div>
          </div>
        </section>

        <AdSlot size="leaderboard" label="광고 영역 — 소개 페이지 하단" />
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

const apSt = {
  h2: { fontSize:'1.25rem', fontWeight:700, color:'#111', letterSpacing:'-0.02em', marginBottom:'14px', paddingBottom:'12px', borderBottom:'1px solid #EAEAEA' },
  body: { fontSize:'1.0625rem', color:'#333', lineHeight:1.75, letterSpacing:'-0.01em' },
};

// ── PostListPage ──────────────────────────────────────────────────────────
const PostListPage = ({ posts, category, onNavigate }) => {
  const { useState } = React;
  const w = useWindowWidth();
  const isMobile = w < 768;
  const isTablet = w < 1024;

  const CATS = ['전체', '교통법규', 'Premium Garage', '안전운전', '차량관리'];
  const [activeCat, setActiveCat] = useState(category || '전체');
  const [page, setPage] = useState(1);
  const PER_PAGE = isMobile ? 6 : isTablet ? 8 : 9;

  const published = posts.filter(p => p.published !== false);
  const filtered = activeCat === '전체' ? published : published.filter(p => p.category === activeCat);
  const total = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const gridCols = isMobile ? '1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(3,1fr)';

  return (
    <div>
      <div style={{ borderBottom:'1px solid #EAEAEA', padding: isMobile ? '28px 16px 0' : '40px 24px 0' }}>
        <div style={{ maxWidth:'1080px', margin:'0 auto' }}>
          <h1 style={{ fontSize: isMobile ? '1.375rem' : '1.75rem', fontWeight:700, color:'#111', letterSpacing:'-0.03em', marginBottom:'18px' }}>블로그</h1>
          <div style={{ display:'flex', gap:'2px', overflowX:'auto' }}>
            {CATS.map(c => (
              <button key={c} onClick={() => { setActiveCat(c); setPage(1); }} style={{
                padding:'7px 16px', fontSize:'0.875rem', fontWeight:600, cursor:'pointer', border:'none', fontFamily:'inherit',
                borderBottom: c===activeCat ? '2px solid #0070F3' : '2px solid transparent',
                background:'transparent', color: c===activeCat ? '#0070F3' : '#555', whiteSpace:'nowrap',
              }}>{c}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:'1080px', margin:'0 auto', padding: isMobile ? '20px 16px' : '32px 24px' }}>
        <AdSlot size="leaderboard" />

        <div style={{ display:'grid', gridTemplateColumns:gridCols, gap:'16px', marginBottom:'24px' }}>
          {paged.slice(0, Math.ceil(PER_PAGE/2)).map(p => (
            <PostCard key={p.id} post={p} onClick={post => onNavigate('article', post)} />
          ))}
        </div>

        {paged.length > Math.ceil(PER_PAGE/2) && (
          <>
            <AdSlot size="leaderboard" label="광고 영역 — 목록 중간 배너" />
            <div style={{ display:'grid', gridTemplateColumns:gridCols, gap:'16px', marginBottom:'24px' }}>
              {paged.slice(Math.ceil(PER_PAGE/2)).map(p => (
                <PostCard key={p.id} post={p} onClick={post => onNavigate('article', post)} />
              ))}
            </div>
          </>
        )}

        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'60px 0', color:'#aaa' }}>
            <div style={{ fontSize:'2rem', marginBottom:'12px' }}>—</div>
            <div>해당 카테고리의 발행된 글이 없습니다.</div>
          </div>
        )}

        {total > 1 && (
          <div style={{ display:'flex', justifyContent:'center', gap:'4px', marginTop:'12px' }}>
            {Array.from({length:total},(_,i)=>i+1).map(n => (
              <button key={n} onClick={() => setPage(n)} style={{
                width:'34px', height:'34px', borderRadius:'6px',
                border: n===page ? 'none' : '1px solid #EAEAEA',
                background: n===page ? '#0070F3' : '#fff', color: n===page ? '#fff' : '#555',
                fontSize:'0.875rem', cursor:'pointer', fontFamily:'inherit',
              }}>{n}</button>
            ))}
          </div>
        )}
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

Object.assign(window, { Footer, SearchOverlay, HomePage, AboutPage, PostListPage });
