// ArticlePage.jsx — Full article view with TOC, comments, mobile layout

// ── Comments ──────────────────────────────────────────────────────────────
const CommentsSection = ({ postId }) => {
  const { useState } = React;
  const storageKey = `dv_comments_${postId}`;
  const [comments, setComments] = useState(() => {
    try { const s = localStorage.getItem(storageKey); return s ? JSON.parse(s) : []; }
    catch { return []; }
  });
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const avatarColor = (n) => {
    const colors = ['#0070F3','#7C3AED','#059669','#D97706','#DB2777'];
    let h = 0; for (let i=0; i<n.length; i++) h = n.charCodeAt(i) + ((h<<5)-h);
    return colors[Math.abs(h) % colors.length];
  };

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    const newC = { id: Date.now(), name: name.trim(), text: text.trim(), date: new Date().toLocaleDateString('ko-KR') };
    const updated = [...comments, newC];
    setComments(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setName(''); setText(''); setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div style={{ marginTop:'48px' }}>
      <div style={{ height:'1px', background:'#EAEAEA', marginBottom:'28px' }} />
      <h3 style={{ fontSize:'1.125rem', fontWeight:700, color:'#111', marginBottom:'20px' }}>
        댓글
        <span style={{ fontSize:'0.9rem', fontWeight:400, color:'#aaa', marginLeft:'8px' }}>{comments.length}개</span>
      </h3>

      {/* Comment list */}
      {comments.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:'20px', marginBottom:'28px' }}>
          {comments.map(c => (
            <div key={c.id} style={{ display:'flex', gap:'12px', alignItems:'flex-start' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:avatarColor(c.name), display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'#fff', fontWeight:700, fontSize:'0.875rem' }}>
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'5px' }}>
                  <span style={{ fontWeight:600, fontSize:'0.875rem', color:'#111' }}>{c.name}</span>
                  <span style={{ fontSize:'11px', color:'#bbb' }}>{c.date}</span>
                </div>
                <p style={{ fontSize:'0.9375rem', color:'#444', lineHeight:1.65 }}>{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment form */}
      <form onSubmit={submit} style={{ background:'#FAFAFA', border:'1px solid #EAEAEA', borderRadius:'8px', padding:'20px' }}>
        <div style={{ marginBottom:'12px' }}>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="이름"
            style={{ width:'100%', padding:'9px 12px', border:'1px solid #EAEAEA', borderRadius:'6px', fontSize:'0.875rem', outline:'none', fontFamily:'inherit', boxSizing:'border-box', background:'#fff' }} />
        </div>
        <div style={{ marginBottom:'12px' }}>
          <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="댓글을 입력하세요..." rows={3}
            style={{ width:'100%', padding:'9px 12px', border:'1px solid #EAEAEA', borderRadius:'6px', fontSize:'0.875rem', outline:'none', fontFamily:'inherit', resize:'vertical', boxSizing:'border-box', background:'#fff' }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          {submitted && <span style={{ fontSize:'12px', color:'#059669', fontWeight:600 }}>✓ 댓글이 등록되었습니다</span>}
          {!submitted && <span />}
          <button type="submit" style={{ padding:'8px 18px', background:'#0070F3', color:'#fff', border:'none', borderRadius:'6px', fontSize:'0.875rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'background 0.15s' }}
            onMouseEnter={e=>e.currentTarget.style.background='#005fd6'}
            onMouseLeave={e=>e.currentTarget.style.background='#0070F3'}>
            댓글 등록
          </button>
        </div>
      </form>
    </div>
  );
};

// ── TOC ───────────────────────────────────────────────────────────────────
const TableOfContents = ({ content, activeId }) => {
  const tocItems = (content || [])
    .map((block, i) => ({ ...block, idx: i }))
    .filter(b => b.type === 'h2' || b.type === 'h3');

  if (tocItems.length === 0) return null;

  const scrollTo = (idx) => {
    const el = document.getElementById(`toc-${idx}`);
    if (el) {
      const top = el.getBoundingClientRect().top + window.pageYOffset - 76;
      window.scrollTo({ top, behavior:'smooth' });
    }
  };

  return (
    <div style={{ background:'#FAFAFA', border:'1px solid #EAEAEA', borderRadius:'8px', padding:'16px 18px', marginBottom:'16px' }}>
      <div style={{ fontSize:'11px', fontWeight:700, color:'#888', letterSpacing:'0.06em', marginBottom:'12px' }}>목차</div>
      <nav style={{ display:'flex', flexDirection:'column', gap:'2px' }}>
        {tocItems.map((item) => {
          const isActive = activeId === `toc-${item.idx}`;
          const isH3 = item.type === 'h3';
          return (
            <button key={item.idx} onClick={() => scrollTo(item.idx)} style={{
              display:'block', width:'100%', textAlign:'left', background:'none', border:'none',
              cursor:'pointer', padding:`5px 8px 5px ${isH3 ? '18px' : '8px'}`,
              fontSize: isH3 ? '12px' : '0.8125rem',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#0070F3' : '#555',
              borderLeft: isActive ? '2px solid #0070F3' : '2px solid transparent',
              borderRadius:'0 4px 4px 0',
              fontFamily:'inherit', lineHeight:1.4,
              background: isActive ? '#EBF3FF' : 'transparent',
              transition:'color 0.15s, background 0.15s',
            }}>
              {item.text}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

// ── ArticlePage ───────────────────────────────────────────────────────────
const ArticlePage = ({ post, posts, onNavigate }) => {
  const { useState, useEffect, useRef } = React;
  const [activeId, setActiveId] = useState(null);
  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth < 1024;

  const related = posts
    .filter(p => p.id !== post.id && p.published !== false)
    .slice(0, 4);

  // Intersection Observer for active TOC
  useEffect(() => {
    const headings = document.querySelectorAll('[data-toc-id]');
    if (!headings.length) return;
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => { if (e.isIntersecting) setActiveId(e.target.id); });
      },
      { rootMargin: '-72px 0px -60% 0px' }
    );
    headings.forEach(h => obs.observe(h));
    return () => obs.disconnect();
  }, [post.id]);

  const catStyle = (color) => {
    if (color === 'green')  return { background:'#ECFDF5', color:'#059669' };
    if (color === 'purple') return { background:'#F3EEFF', color:'#7C3AED' };
    return { background:'#EBF3FF', color:'#0070F3' };
  };

  // Block renderer — ad inserted before each h2 (except first)
  const h2Count = useRef(0);
  h2Count.current = 0;
  const renderBlock = (block, i) => {
    switch (block.type) {
      case 'h2':
        h2Count.current++;
        return (
          <div key={i}>
            {h2Count.current > 1 && <AdSlot size="leaderboard" label="광고 영역 — 본문 섹션 사이" />}
            <h2 id={`toc-${i}`} data-toc-id="true" style={arSt.h2}>{block.text}</h2>
          </div>
        );
      case 'h3':
        return <h3 key={i} id={`toc-${i}`} data-toc-id="true" style={arSt.h3}>{block.text}</h3>;
      case 'lawbox':
        return <LawBox key={i} lawRef={block.ref}>{block.text}</LawBox>;
      case 'tipbox':
        return <TipBox key={i}>{block.text}</TipBox>;
      case 'paragraph':
      default:
        return <p key={i} style={arSt.body}>{block.text}</p>;
    }
  };

  const hasToc = (post.content || []).some(b => b.type === 'h2' || b.type === 'h3');

  return (
    <div style={arSt.page}>
      <div style={{ maxWidth:'1080px', margin:'0 auto', padding: isMobile ? '20px 16px' : '32px 24px' }}>

        {/* Breadcrumb */}
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'24px' }}>
          <button style={arSt.backBtn} onClick={() => onNavigate('home')}
            onMouseEnter={e=>e.currentTarget.style.color='#0070F3'}
            onMouseLeave={e=>e.currentTarget.style.color='#555'}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            목록으로
          </button>
          <span style={{color:'#ddd'}}>·</span>
          <span style={{fontSize:'0.8125rem', color:'#0070F3', fontWeight:500}}>{post.category}</span>
        </div>

        {/* Hero image (if available) */}
        {post.thumbnail && (
          <div style={{ borderRadius:'10px', overflow:'hidden', aspectRatio:'21/9', marginBottom:'28px', background:'#F0F2F5' }}>
            <img src={post.thumbnail} alt={post.title}
              style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
              onError={e => e.target.parentElement.style.display='none'} />
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns: (isMobile || isTablet) ? '1fr' : '1fr 300px', gap: isMobile ? '0' : '56px', alignItems:'flex-start' }}>

          {/* ── Main ── */}
          <main>
            <span style={{ ...arSt.catBadge, ...catStyle(post.categoryColor) }}>{post.category}</span>
            <h1 style={{ ...arSt.h1, fontSize: isMobile ? '1.5rem' : '2rem' }}>{post.title}</h1>
            <div style={arSt.meta}>
              <span>{post.date}</span>
              <span style={{color:'#ddd'}}>·</span>
              <span>읽는 시간 {post.readTime}분</span>
            </div>

            {/* Mobile TOC */}
            {(isMobile || isTablet) && hasToc && (
              <div style={{ marginBottom:'20px' }}>
                <TableOfContents content={post.content} activeId={activeId} />
              </div>
            )}

            <div style={arSt.divider} />
            <p style={arSt.lead}>{post.description}</p>

            {/* Top ad */}
            <AdSlot size="leaderboard" label="광고 영역 — 본문 상단" />

            {/* Content blocks */}
            {(post.content || []).map((block, i) => renderBlock(block, i))}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <>
                <div style={arSt.divider} />
                <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', alignItems:'center' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginTop:'1px'}}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                  {post.tags.map(tag => (
                    <span key={tag} style={{ padding:'4px 10px', border:'1px solid #EAEAEA', borderRadius:'9999px', fontSize:'12px', color:'#555' }}>{tag}</span>
                  ))}
                </div>
              </>
            )}

            {/* Bottom ad */}
            <AdSlot size="leaderboard" label="광고 영역 — 본문 하단" />

            {/* Comments */}
            <CommentsSection postId={post.id} />
          </main>

          {/* ── Sidebar (desktop/tablet) ── */}
          {!isMobile && !isTablet && (
            <aside style={{ position:'sticky', top:'72px' }}>
              {hasToc && <TableOfContents content={post.content} activeId={activeId} />}
              <AdSlot size="rectangle" label="광고 영역 — 300×250" />
              <div style={{ background:'#FAFAFA', border:'1px solid #EAEAEA', borderRadius:'8px', padding:'18px', marginTop:'16px' }}>
                <div style={{ fontSize:'11px', fontWeight:700, color:'#888', letterSpacing:'0.05em', marginBottom:'12px' }}>관련 글</div>
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {related.map(p => (
                    <button key={p.id} style={arSt.relBtn}
                      onClick={() => onNavigate('article', p)}
                      onMouseEnter={e=>e.currentTarget.style.borderColor='#0070F3'}
                      onMouseLeave={e=>e.currentTarget.style.borderColor='#EAEAEA'}>
                      <div style={{ fontSize:'0.8125rem', fontWeight:600, color:'#111', lineHeight:1.4, marginBottom:'3px' }}>{p.title}</div>
                      <div style={{ fontSize:'11px', color:'#aaa' }}>{p.category} · {p.date}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{marginTop:'16px'}}><AdSlot size="rectangle" label="광고 영역 — 사이드바 하단" /></div>
            </aside>
          )}
        </div>

        {/* Mobile related posts */}
        {(isMobile || isTablet) && related.length > 0 && (
          <div style={{ marginTop:'36px' }}>
            <div style={{ fontSize:'12px', fontWeight:700, color:'#888', letterSpacing:'0.05em', marginBottom:'12px' }}>관련 글</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {related.slice(0,3).map(p => (
                <PostCard key={p.id} post={p} compact onClick={p => onNavigate('article', p)} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

const arSt = {
  page: { background:'#fff', minHeight:'100vh' },
  backBtn: { display:'flex', alignItems:'center', gap:'4px', background:'none', border:'none', cursor:'pointer', color:'#555', fontSize:'0.875rem', fontFamily:'inherit', padding:'0', transition:'color 0.15s' },
  catBadge: { display:'inline-flex', padding:'2px 8px', borderRadius:'4px', fontSize:'11px', fontWeight:600, letterSpacing:'0.02em', marginBottom:'12px' },
  h1: { fontSize:'2rem', fontWeight:700, color:'#111', lineHeight:1.3, letterSpacing:'-0.025em', marginBottom:'12px', textWrap:'pretty' },
  meta: { display:'flex', gap:'8px', fontSize:'13px', color:'#aaa', marginBottom:'20px', alignItems:'center' },
  divider: { height:'1px', background:'#EAEAEA', margin:'24px 0' },
  lead: { fontSize:'1.0625rem', color:'#333', lineHeight:1.75, letterSpacing:'-0.01em', fontWeight:500 },
  h2: { fontSize:'1.375rem', fontWeight:700, color:'#111', letterSpacing:'-0.02em', margin:'8px 0 0', scrollMarginTop:'80px' },
  h3: { fontSize:'1.125rem', fontWeight:700, color:'#111', letterSpacing:'-0.01em', margin:'24px 0 8px', scrollMarginTop:'80px' },
  body: { fontSize:'1.0625rem', color:'#333', lineHeight:1.75, letterSpacing:'-0.01em', margin:'14px 0 0' },
  relBtn: { display:'block', width:'100%', background:'#fff', border:'1px solid #EAEAEA', borderRadius:'6px', padding:'10px 12px', cursor:'pointer', textAlign:'left', fontFamily:'inherit', transition:'border-color 0.15s' },
};

Object.assign(window, { ArticlePage });
