// AdminPages.jsx — Login, AdminLayout, Dashboard, Editor, HeroManager
const { useState, useEffect, useRef } = React;

// ── LoginPage ─────────────────────────────────────────────────────────────
const LoginPage = ({ onLogin, onCancel }) => {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (id === 'admin' && pw === 'drivever2024') {
        onLogin();
      } else {
        setErr('아이디 또는 비밀번호가 올바르지 않습니다.');
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div style={lgSt.wrap}>
      <div style={lgSt.box}>
        <div style={lgSt.logo}>
          <img src="assets/favicon-drivever-512.png" width="36" height="36" alt="Drivever" style={{objectFit:'contain'}} />
          <span style={lgSt.logoText}>Drivever</span>
        </div>
        <h1 style={lgSt.h1}>관리자 로그인</h1>
        <p style={lgSt.sub}>블로그 관리 페이지에 접근하려면 로그인이 필요합니다.</p>
        <form onSubmit={handle} style={{display:'flex', flexDirection:'column', gap:'14px'}}>
          <div>
            <label style={lgSt.label}>아이디</label>
            <input value={id} onChange={e=>{setId(e.target.value);setErr('');}}
              placeholder="admin" style={lgSt.input} autoFocus />
          </div>
          <div>
            <label style={lgSt.label}>비밀번호</label>
            <input type="password" value={pw} onChange={e=>{setPw(e.target.value);setErr('');}}
              placeholder="••••••••••" style={lgSt.input} />
          </div>
          {err && <div style={lgSt.err}>{err}</div>}
          <button type="submit" style={{...lgSt.btn, opacity: loading?0.7:1}} disabled={loading}>
            {loading ? '확인 중...' : '로그인'}
          </button>
        </form>
        <div style={{marginTop:'14px', textAlign:'center'}}>
          <button onClick={onCancel} style={lgSt.cancelBtn}>← 블로그로 돌아가기</button>
        </div>
        <div style={lgSt.hint}>
          <span style={{fontWeight:600}}>테스트 계정</span> — ID: admin / PW: drivever2024
        </div>
      </div>
    </div>
  );
};

const lgSt = {
  wrap: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#FAFAFA' },
  box: { background:'#fff', border:'1px solid #EAEAEA', borderRadius:'12px', padding:'40px', width:'400px', boxShadow:'0 4px 24px rgba(0,0,0,0.06)' },
  logo: { display:'flex', alignItems:'center', gap:'8px', marginBottom:'24px', justifyContent:'center' },
  logoText: { fontSize:'1.125rem', fontWeight:700, color:'#111', letterSpacing:'-0.02em' },
  h1: { fontSize:'1.375rem', fontWeight:700, color:'#111', marginBottom:'6px', textAlign:'center' },
  sub: { fontSize:'0.8125rem', color:'#888', textAlign:'center', marginBottom:'24px', lineHeight:1.5 },
  label: { display:'block', fontSize:'12px', fontWeight:600, color:'#555', marginBottom:'6px' },
  input: { width:'100%', padding:'9px 12px', border:'1px solid #EAEAEA', borderRadius:'6px', fontSize:'0.9375rem', fontFamily:'inherit', outline:'none', boxSizing:'border-box', transition:'border-color 0.15s' },
  err: { background:'#FFF0F0', border:'1px solid #FFD0D0', borderRadius:'6px', padding:'10px 14px', fontSize:'0.8125rem', color:'#C0392B' },
  btn: { padding:'11px', background:'#0070F3', color:'#fff', border:'none', borderRadius:'6px', fontSize:'0.9375rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'background 0.15s' },
  cancelBtn: { background:'none', border:'none', cursor:'pointer', fontSize:'0.8125rem', color:'#888', fontFamily:'inherit' },
  hint: { marginTop:'20px', padding:'12px', background:'#FAFAFA', borderRadius:'6px', fontSize:'11px', color:'#aaa', textAlign:'center' },
};

// ── Admin Sidebar Nav ─────────────────────────────────────────────────────
const AdminSidebar = ({ view, setView, onLogout, onGoSite }) => {
  const navItems = [
    { id:'dashboard', icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>, label:'포스트 관리' },
    { id:'editor-new', icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>, label:'새 글 작성' },
    { id:'hero', icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>, label:'히어로 관리' },
  ];

  return (
    <div style={adSt.sidebar}>
      <div style={adSt.sideTop}>
        <div style={adSt.sideLogo}>
          <img src="assets/favicon-drivever-512.png" width="22" height="22" alt="D" style={{objectFit:'contain'}} />
          <div>
            <div style={{fontSize:'0.875rem', fontWeight:700, color:'#111'}}>Drivever</div>
            <div style={{fontSize:'10px', color:'#888'}}>관리자 패널</div>
          </div>
        </div>
        <div style={adSt.sideNav}>
          {navItems.map(item => (
            <button key={item.id}
              onClick={() => setView(item.id === 'editor-new' ? { page:'editor', post:null } : item.id)}
              style={{...adSt.sideNavBtn, ...(
                (item.id === 'dashboard' && view === 'dashboard') ||
                (item.id === 'editor-new' && view === 'editor') ||
                (item.id === 'hero' && view === 'hero')
                  ? adSt.sideNavActive : {}
              )}}>
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div style={adSt.sideBottom}>
        <button style={adSt.sideActionBtn} onClick={onGoSite}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          사이트 보기
        </button>
        <button style={{...adSt.sideActionBtn, color:'#C0392B'}} onClick={onLogout}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          로그아웃
        </button>
      </div>
    </div>
  );
};

const adSt = {
  sidebar: { width:'220px', flexShrink:0, borderRight:'1px solid #EAEAEA', background:'#FAFAFA', display:'flex', flexDirection:'column', justifyContent:'space-between', minHeight:'calc(100vh - 56px)' },
  sideTop: { padding:'20px 0' },
  sideLogo: { display:'flex', alignItems:'center', gap:'10px', padding:'0 20px 20px', borderBottom:'1px solid #EAEAEA', marginBottom:'12px' },
  sideNav: { display:'flex', flexDirection:'column', gap:'2px', padding:'0 10px' },
  sideNavBtn: { display:'flex', alignItems:'center', gap:'9px', padding:'8px 12px', borderRadius:'6px', background:'transparent', border:'none', cursor:'pointer', color:'#555', fontSize:'0.875rem', fontWeight:500, fontFamily:'inherit', transition:'background 0.15s, color 0.15s', textAlign:'left' },
  sideNavActive: { background:'#EBF3FF', color:'#0070F3' },
  sideBottom: { padding:'16px 10px', borderTop:'1px solid #EAEAEA', display:'flex', flexDirection:'column', gap:'2px' },
  sideActionBtn: { display:'flex', alignItems:'center', gap:'8px', padding:'8px 12px', borderRadius:'6px', background:'transparent', border:'none', cursor:'pointer', color:'#888', fontSize:'0.8125rem', fontFamily:'inherit', transition:'background 0.15s' },
};

// ── AdminLayout ───────────────────────────────────────────────────────────
const AdminLayout = ({ posts, setPosts, heroSlides, setHeroSlides, onLogout, onGoSite }) => {
  const [view, setView] = useState('dashboard');
  const [editPost, setEditPost] = useState(null);

  const handleSetView = (v) => {
    if (typeof v === 'object' && v.page === 'editor') { setView('editor'); setEditPost(v.post); }
    else setView(v);
  };

  return (
    <div style={{display:'flex', minHeight:'calc(100vh - 56px)'}}>
      <AdminSidebar view={view} setView={handleSetView} onLogout={onLogout} onGoSite={onGoSite} />
      <div style={{flex:1, overflow:'auto', background:'#fff'}}>
        {view === 'dashboard' && (
          <AdminDashboard posts={posts} setPosts={setPosts}
            onEdit={p => { setEditPost(p); setView('editor'); }}
            onNew={() => { setEditPost(null); setView('editor'); }} />
        )}
        {view === 'editor' && (
          <AdminEditor posts={posts} setPosts={setPosts} editPost={editPost}
            onBack={() => setView('dashboard')} />
        )}
        {view === 'hero' && (
          <AdminHeroManager posts={posts} heroSlides={heroSlides} setHeroSlides={setHeroSlides} />
        )}
      </div>
    </div>
  );
};

// ── AdminDashboard ────────────────────────────────────────────────────────
const AdminDashboard = ({ posts, setPosts, onEdit, onNew }) => {
  const [filter, setFilter] = useState('전체');
  const [search, setSearch] = useState('');

  const filtered = posts.filter(p => {
    const matchCat = filter === '전체' || (filter === '발행' && p.published !== false) || (filter === '임시저장' && p.published === false);
    const matchQ = !search || p.title.includes(search) || p.category.includes(search);
    return matchCat && matchQ;
  });

  const togglePublish = (id) => {
    const updated = posts.map(p => p.id === id ? {...p, published: !p.published} : p);
    setPosts(updated);
    localStorage.setItem('drivever_posts', JSON.stringify(updated));
  };

  const deletePost = (id) => {
    if (!confirm('이 포스트를 삭제하시겠습니까?')) return;
    const updated = posts.filter(p => p.id !== id);
    setPosts(updated);
    localStorage.setItem('drivever_posts', JSON.stringify(updated));
  };

  const catColor = { '교통법규':'#0070F3', 'Premium Garage':'#7C3AED', '안전운전':'#059669', '차량관리':'#D97706' };

  return (
    <div style={{padding:'32px 36px', maxWidth:'960px'}}>
      {/* Header */}
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'28px'}}>
        <div>
          <h1 style={{fontSize:'1.375rem', fontWeight:700, color:'#111', marginBottom:'4px'}}>포스트 관리</h1>
          <p style={{fontSize:'0.8125rem', color:'#888'}}>총 {posts.length}개 포스트 · 발행 {posts.filter(p=>p.published!==false).length}개</p>
        </div>
        <button style={dbSt.newBtn} onClick={onNew}
          onMouseEnter={e=>e.currentTarget.style.background='#005fd6'}
          onMouseLeave={e=>e.currentTarget.style.background='#0070F3'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          새 글 작성
        </button>
      </div>

      {/* Filter bar */}
      <div style={{display:'flex', gap:'12px', alignItems:'center', marginBottom:'20px'}}>
        <div style={{display:'flex', gap:'4px'}}>
          {['전체','발행','임시저장'].map(f => (
            <button key={f} onClick={()=>setFilter(f)} style={{
              padding:'5px 14px', fontSize:'12px', fontWeight:600, borderRadius:'4px',
              border:'none', cursor:'pointer', fontFamily:'inherit',
              background: filter===f ? '#EBF3FF' : '#F3F4F6',
              color: filter===f ? '#0070F3' : '#555',
            }}>{f}</button>
          ))}
        </div>
        <div style={dbSt.searchWrap}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="제목·카테고리 검색..." style={dbSt.searchInput} />
        </div>
      </div>

      {/* Table */}
      <div style={{border:'1px solid #EAEAEA', borderRadius:'8px', overflow:'hidden'}}>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr style={{background:'#FAFAFA', borderBottom:'1px solid #EAEAEA'}}>
              {['제목','카테고리','작성일','읽는 시간','상태','관리'].map(h => (
                <th key={h} style={dbSt.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={p.id} style={{borderBottom: i<filtered.length-1 ? '1px solid #EAEAEA' : 'none', transition:'background 0.1s'}}
                onMouseEnter={e=>e.currentTarget.style.background='#FAFAFA'}
                onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                <td style={{...dbSt.td, fontWeight:600, color:'#111', maxWidth:'280px'}}>
                  <div style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{p.title}</div>
                </td>
                <td style={dbSt.td}>
                  <span style={{padding:'2px 8px', borderRadius:'4px', fontSize:'11px', fontWeight:600, background: catColor[p.category] ? catColor[p.category]+'18' : '#F3F4F6', color: catColor[p.category] || '#555'}}>
                    {p.category}
                  </span>
                </td>
                <td style={{...dbSt.td, color:'#888', fontSize:'12px'}}>{p.date}</td>
                <td style={{...dbSt.td, color:'#888', fontSize:'12px'}}>{p.readTime}분</td>
                <td style={dbSt.td}>
                  <button onClick={()=>togglePublish(p.id)} style={{
                    padding:'3px 10px', borderRadius:'9999px', border:'none', cursor:'pointer',
                    fontSize:'11px', fontWeight:700, fontFamily:'inherit',
                    background: p.published!==false ? '#ECFDF5' : '#F3F4F6',
                    color: p.published!==false ? '#059669' : '#888',
                    transition:'all 0.15s',
                  }}>
                    {p.published !== false ? '발행중' : '임시저장'}
                  </button>
                </td>
                <td style={dbSt.td}>
                  <div style={{display:'flex', gap:'6px'}}>
                    <button style={dbSt.actionBtn} onClick={()=>onEdit(p)}
                      onMouseEnter={e=>e.currentTarget.style.color='#0070F3'}
                      onMouseLeave={e=>e.currentTarget.style.color='#555'}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      수정
                    </button>
                    <button style={{...dbSt.actionBtn, color:'#aaa'}} onClick={()=>deletePost(p.id)}
                      onMouseEnter={e=>e.currentTarget.style.color='#C0392B'}
                      onMouseLeave={e=>e.currentTarget.style.color='#aaa'}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="6" style={{padding:'40px', textAlign:'center', color:'#aaa', fontSize:'0.875rem'}}>검색 결과가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const dbSt = {
  newBtn: { display:'flex', alignItems:'center', gap:'6px', padding:'8px 16px', background:'#0070F3', color:'#fff', border:'none', borderRadius:'6px', fontSize:'0.875rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'background 0.15s' },
  searchWrap: { display:'flex', alignItems:'center', gap:'8px', border:'1px solid #EAEAEA', borderRadius:'6px', padding:'6px 12px', background:'#fff' },
  searchInput: { border:'none', outline:'none', fontSize:'0.8125rem', fontFamily:'inherit', color:'#111', width:'200px' },
  th: { padding:'10px 16px', textAlign:'left', fontSize:'11px', fontWeight:700, color:'#888', letterSpacing:'0.04em' },
  td: { padding:'12px 16px', fontSize:'0.875rem', color:'#333' },
  actionBtn: { display:'inline-flex', alignItems:'center', gap:'4px', padding:'5px 10px', border:'1px solid #EAEAEA', borderRadius:'5px', background:'#fff', cursor:'pointer', fontSize:'12px', color:'#555', fontFamily:'inherit', transition:'color 0.15s, border-color 0.15s' },
};

// ── AdminEditor ───────────────────────────────────────────────────────────
const BLOCK_TYPES = [
  { value:'paragraph', label:'본문 단락' },
  { value:'h2', label:'소제목 H2' },
  { value:'h3', label:'소제목 H3' },
  { value:'lawbox', label:'법률 박스' },
  { value:'tipbox', label:'팁 박스' },
];
const CATEGORIES = ['교통법규', 'Premium Garage', '안전운전', '차량관리'];

const AdminEditor = ({ posts, setPosts, editPost, onBack }) => {
  const isNew = !editPost;
  const [title, setTitle] = useState(editPost?.title || '');
  const [category, setCategory] = useState(editPost?.category || '교통법규');
  const [description, setDescription] = useState(editPost?.description || '');
  const [tags, setTags] = useState((editPost?.tags || []).join(', '));
  const [readTime, setReadTime] = useState(editPost?.readTime || 5);
  const [published, setPublished] = useState(editPost?.published !== false);
  const [thumbnail, setThumbnail] = useState(editPost?.thumbnail || '');
  const [blocks, setBlocks] = useState(
    editPost?.content && editPost.content.length > 0
      ? editPost.content.map((b,i) => ({...b, _id: i}))
      : [{ _id:0, type:'paragraph', text:'', ref:'' }]
  );
  const [saved, setSaved] = useState(false);
  const nextId = useRef(blocks.length);

  const addBlock = (type) => {
    setBlocks(b => [...b, { _id: nextId.current++, type, text:'', ref:'' }]);
  };

  const removeBlock = (id) => {
    setBlocks(b => b.filter(bl => bl._id !== id));
  };

  const updateBlock = (id, field, val) => {
    setBlocks(b => b.map(bl => bl._id === id ? {...bl, [field]: val} : bl));
  };

  const moveBlock = (id, dir) => {
    setBlocks(b => {
      const idx = b.findIndex(bl => bl._id === id);
      const newB = [...b];
      const swap = idx + dir;
      if (swap < 0 || swap >= newB.length) return b;
      [newB[idx], newB[swap]] = [newB[swap], newB[idx]];
      return newB;
    });
  };

  const save = () => {
    const tagArr = tags.split(',').map(t => t.trim()).filter(Boolean);
    const catColorMap = { '교통법규':'blue', 'Premium Garage':'purple', '안전운전':'green', '차량관리':'blue' };
    const content = blocks.map(({_id, ...rest}) => rest);
    const today = new Date().toISOString().slice(0,10).replace(/-/g,'.');

    let updated;
    if (isNew) {
      const newPost = {
        id: Date.now(), title, category, categoryColor: catColorMap[category]||'blue',
        description, tags: tagArr, readTime: Number(readTime), published,
        date: today, content, thumbnail,
      };
      updated = [newPost, ...posts];
    } else {
      updated = posts.map(p => p.id === editPost.id
        ? {...p, title, category, categoryColor: catColorMap[category]||'blue', description, tags: tagArr, readTime: Number(readTime), published, content, thumbnail}
        : p
      );
    }
    setPosts(updated);
    localStorage.setItem('drivever_posts', JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const blockBg = { paragraph:'#fff', h2:'#F8F8FF', h3:'#F8F8FF', lawbox:'#EBF3FF', tipbox:'#EFFFEF' };
  const blockBorder = { paragraph:'#EAEAEA', h2:'#D0D0F0', h3:'#D0D0F0', lawbox:'#0070F3', tipbox:'#059669' };

  return (
    <div>
      {/* Top toolbar */}
      <div style={edSt.toolbar}>
        <button style={edSt.backBtn} onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          목록
        </button>
        <span style={{fontSize:'0.875rem', fontWeight:600, color:'#111'}}>
          {isNew ? '새 글 작성' : '포스트 수정'}
        </span>
        <div style={{display:'flex', gap:'10px', alignItems:'center', marginLeft:'auto'}}>
          {saved && <span style={{fontSize:'12px', color:'#059669', fontWeight:600}}>✓ 저장되었습니다</span>}
          {/* Publish toggle */}
          <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
            <span style={{fontSize:'12px', color:'#555'}}>발행 상태</span>
            <button onClick={()=>setPublished(!published)} style={{
              width:'40px', height:'22px', borderRadius:'11px', border:'none', cursor:'pointer',
              background: published ? '#0070F3' : '#D0D0D0', position:'relative', transition:'background 0.2s',
            }}>
              <div style={{
                position:'absolute', top:'3px', width:'16px', height:'16px', borderRadius:'50%', background:'#fff',
                transition:'left 0.2s', left: published ? '21px' : '3px',
              }} />
            </button>
            <span style={{fontSize:'12px', fontWeight:600, color: published ? '#059669' : '#888'}}>
              {published ? '발행' : '임시저장'}
            </span>
          </div>
          <button style={edSt.saveBtn} onClick={save}
            onMouseEnter={e=>e.currentTarget.style.background='#005fd6'}
            onMouseLeave={e=>e.currentTarget.style.background='#0070F3'}>
            저장
          </button>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 280px', gap:'0', minHeight:'calc(100vh - 105px)'}}>
        {/* Main editor */}
        <div style={{padding:'32px 36px', borderRight:'1px solid #EAEAEA'}}>
          {/* Title */}
          <textarea value={title} onChange={e=>setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            style={edSt.titleInput} rows={2} />

          {/* Description */}
          <textarea value={description} onChange={e=>setDescription(e.target.value)}
            placeholder="요약 설명 (카드 및 메타 디스크립션에 사용됩니다)"
            style={edSt.descInput} rows={2} />

          <div style={{height:'1px', background:'#EAEAEA', margin:'24px 0'}} />

          {/* Content blocks */}
          <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
            {blocks.map((block, i) => (
              <div key={block._id} style={{border:`1px solid ${blockBorder[block.type]||'#EAEAEA'}`, borderRadius:'8px', background: blockBg[block.type]||'#fff', overflow:'hidden'}}>
                <div style={edSt.blockHeader}>
                  <select value={block.type} onChange={e=>updateBlock(block._id,'type',e.target.value)} style={edSt.typeSelect}>
                    {BLOCK_TYPES.map(bt => <option key={bt.value} value={bt.value}>{bt.label}</option>)}
                  </select>
                  <div style={{display:'flex', gap:'4px', marginLeft:'auto'}}>
                    <button style={edSt.blockBtn} onClick={()=>moveBlock(block._id,-1)} disabled={i===0}>↑</button>
                    <button style={edSt.blockBtn} onClick={()=>moveBlock(block._id,1)} disabled={i===blocks.length-1}>↓</button>
                    <button style={{...edSt.blockBtn, color:'#C0392B'}} onClick={()=>removeBlock(block._id)}>×</button>
                  </div>
                </div>
                {block.type === 'lawbox' && (
                  <input value={block.ref} onChange={e=>updateBlock(block._id,'ref',e.target.value)}
                    placeholder="법률 출처 (예: 도로교통법 제44조)"
                    style={edSt.refInput} />
                )}
                <textarea value={block.text} onChange={e=>updateBlock(block._id,'text',e.target.value)}
                  placeholder={
                    block.type==='h2'||block.type==='h3' ? '소제목을 입력하세요' :
                    block.type==='lawbox' ? '법률 내용을 입력하세요' :
                    block.type==='tipbox' ? '팁 내용을 입력하세요' :
                    '본문 내용을 입력하세요'
                  }
                  style={{...edSt.blockTextarea, fontWeight: block.type==='h2'||block.type==='h3' ? 700 : 400, fontSize: block.type==='h2' ? '1.2rem' : '0.9375rem'}}
                  rows={block.type==='h2'||block.type==='h3' ? 1 : 3}
                />
              </div>
            ))}
          </div>

          {/* Add block buttons */}
          <div style={{display:'flex', gap:'6px', flexWrap:'wrap', marginTop:'16px'}}>
            {BLOCK_TYPES.map(bt => (
              <button key={bt.value} onClick={()=>addBlock(bt.value)} style={edSt.addBlockBtn}>
                + {bt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Meta sidebar */}
        <div style={{padding:'24px 20px', background:'#FAFAFA'}}>
          <div style={edSt.metaSection}>
            <label style={edSt.metaLabel}>카테고리</label>
            <select value={category} onChange={e=>setCategory(e.target.value)} style={edSt.metaSelect}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={edSt.metaSection}>
            <label style={edSt.metaLabel}>썸네일 이미지 URL</label>
            <input value={thumbnail} onChange={e=>setThumbnail(e.target.value)}
              placeholder="https://images.unsplash.com/..." style={edSt.metaInput} />
            {thumbnail && (
              <div style={{marginTop:'8px', borderRadius:'6px', overflow:'hidden', aspectRatio:'16/9', background:'#F0F2F5'}}>
                <img src={thumbnail} alt="thumbnail preview" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} onError={e=>e.target.style.opacity='0.2'} />
              </div>
            )}
          </div>
          <div style={edSt.metaSection}>
            <label style={edSt.metaLabel}>읽는 시간 (분)</label>
            <input type="number" value={readTime} onChange={e=>setReadTime(e.target.value)}
              style={edSt.metaInput} min="1" max="60" />
          </div>
          <div style={edSt.metaSection}>
            <label style={edSt.metaLabel}>태그 (쉼표로 구분)</label>
            <input value={tags} onChange={e=>setTags(e.target.value)}
              placeholder="교통법규, 음주운전, 벌점" style={edSt.metaInput} />
          </div>
          {/* Preview card */}
          <div style={{marginTop:'24px'}}>
            <div style={edSt.metaLabel}>미리보기 카드</div>
            <div style={{border:'1px solid #EAEAEA', borderRadius:'8px', padding:'14px', background:'#fff', marginTop:'8px'}}>
              <span style={{display:'inline-block', padding:'2px 7px', background:'#EBF3FF', color:'#0070F3', borderRadius:'4px', fontSize:'10px', fontWeight:700, marginBottom:'7px'}}>{category}</span>
              <div style={{fontSize:'0.8125rem', fontWeight:700, color:'#111', lineHeight:1.4, marginBottom:'6px'}}>{title||'제목 없음'}</div>
              <div style={{fontSize:'11px', color:'#888', lineHeight:1.5}}>{description||'설명이 없습니다.'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const edSt = {
  toolbar: { display:'flex', alignItems:'center', gap:'14px', padding:'12px 24px', borderBottom:'1px solid #EAEAEA', background:'#fff', position:'sticky', top:'0', zIndex:10 },
  backBtn: { display:'flex', alignItems:'center', gap:'4px', background:'none', border:'none', cursor:'pointer', color:'#555', fontSize:'0.875rem', fontFamily:'inherit', padding:'0' },
  saveBtn: { padding:'8px 20px', background:'#0070F3', color:'#fff', border:'none', borderRadius:'6px', fontSize:'0.875rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'background 0.15s' },
  titleInput: { width:'100%', border:'none', outline:'none', fontSize:'1.625rem', fontWeight:700, color:'#111', lineHeight:1.3, fontFamily:'inherit', resize:'none', padding:'0', marginBottom:'12px', letterSpacing:'-0.02em', boxSizing:'border-box', background:'transparent' },
  descInput: { width:'100%', border:'none', outline:'none', fontSize:'1rem', color:'#555', lineHeight:1.6, fontFamily:'inherit', resize:'none', padding:'0', boxSizing:'border-box', background:'transparent' },
  blockHeader: { display:'flex', alignItems:'center', gap:'8px', padding:'8px 10px', borderBottom:'1px solid rgba(0,0,0,0.06)', background:'rgba(0,0,0,0.02)' },
  typeSelect: { fontSize:'11px', fontWeight:600, color:'#555', border:'none', background:'transparent', fontFamily:'inherit', cursor:'pointer', outline:'none' },
  blockBtn: { width:'22px', height:'22px', borderRadius:'4px', border:'1px solid #EAEAEA', background:'#fff', cursor:'pointer', fontSize:'12px', color:'#888', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'inherit' },
  refInput: { width:'100%', padding:'8px 12px', border:'none', borderBottom:'1px solid rgba(0,112,243,0.15)', outline:'none', fontSize:'12px', fontWeight:600, color:'#0070F3', fontFamily:'inherit', background:'transparent', boxSizing:'border-box' },
  blockTextarea: { width:'100%', padding:'10px 12px', border:'none', outline:'none', resize:'vertical', fontFamily:'inherit', color:'#333', lineHeight:1.7, background:'transparent', boxSizing:'border-box', minHeight:'60px' },
  addBlockBtn: { padding:'5px 12px', border:'1px dashed #EAEAEA', borderRadius:'6px', background:'#fff', cursor:'pointer', fontSize:'12px', color:'#555', fontFamily:'inherit', transition:'border-color 0.15s, color 0.15s' },
  metaSection: { marginBottom:'16px' },
  metaLabel: { display:'block', fontSize:'11px', fontWeight:700, color:'#888', letterSpacing:'0.04em', marginBottom:'6px' },
  metaSelect: { width:'100%', padding:'8px 10px', border:'1px solid #EAEAEA', borderRadius:'6px', fontSize:'0.875rem', fontFamily:'inherit', outline:'none', background:'#fff', boxSizing:'border-box' },
  metaInput: { width:'100%', padding:'8px 10px', border:'1px solid #EAEAEA', borderRadius:'6px', fontSize:'0.875rem', fontFamily:'inherit', outline:'none', boxSizing:'border-box' },
};

// ── AdminHeroManager ──────────────────────────────────────────────────────
const GRADIENT_PRESETS = [
  { label:'다크 네이비', value:'linear-gradient(135deg, #0a1628 0%, #162d4a 100%)' },
  { label:'다크 브라운', value:'linear-gradient(135deg, #1a1008 0%, #2d1a08 100%)' },
  { label:'다크 그린', value:'linear-gradient(135deg, #0a1a10 0%, #1a3525 100%)' },
  { label:'다크 퍼플', value:'linear-gradient(135deg, #120a1a 0%, #251540 100%)' },
  { label:'딥 블루', value:'linear-gradient(135deg, #0d1b2a 0%, #0a3a6e 100%)' },
  { label:'딥 레드', value:'linear-gradient(135deg, #1a0808 0%, #3a1010 100%)' },
];

const SlidePreview = ({ slide }) => (
  <div style={{ width:'100%', aspectRatio:'16/7', borderRadius:'8px', overflow:'hidden', position:'relative', background: slide.image ? `url(${slide.image}) center/cover no-repeat` : (slide.bg || '#0a1628'), flexShrink:0 }}>
    <div style={{position:'absolute',inset:0,background:'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)'}} />
    <div style={{position:'absolute',bottom:'10px',left:'12px',right:'12px'}}>
      <span style={{display:'inline-block',padding:'1px 7px',background:'rgba(0,112,243,0.85)',color:'#fff',borderRadius:'3px',fontSize:'9px',fontWeight:700,marginBottom:'5px'}}>{slide.category}</span>
      <div style={{fontSize:'13px',fontWeight:700,color:'#fff',lineHeight:1.3,marginBottom:'3px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{slide.title}</div>
      <div style={{fontSize:'10px',color:'rgba(255,255,255,0.7)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{slide.description}</div>
    </div>
  </div>
);

const AdminHeroManager = ({ posts, heroSlides, setHeroSlides }) => {
  const [editing, setEditing] = useState(null); // null or slide object
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ postId:'', category:'', title:'', description:'', bg: GRADIENT_PRESETS[0].value, image:'' });

  const publishedPosts = posts.filter(p => p.published !== false);

  const openEdit = (slide) => {
    setForm({ postId: slide.postId||'', category: slide.category, title: slide.title, description: slide.description, bg: slide.bg||GRADIENT_PRESETS[0].value, image: slide.image||'' });
    setEditing(slide.id);
    setShowForm(true);
  };

  const openNew = () => {
    setForm({ postId:'', category:'', title:'', description:'', bg: GRADIENT_PRESETS[0].value });
    setEditing(null);
    setShowForm(true);
  };

  const autoFill = (postId) => {
    const post = publishedPosts.find(p => p.id === Number(postId));
    if (post) {
      setForm(f => ({ ...f, postId: Number(postId), category: post.category, title: post.title, description: post.description }));
    }
  };

  const saveSlide = () => {
    let updated;
    if (editing !== null) {
      updated = heroSlides.map(s => s.id === editing ? {...s, ...form} : s);
    } else {
      updated = [...heroSlides, { id: Date.now(), ...form }];
    }
    setHeroSlides(updated);
    localStorage.setItem('drivever_hero', JSON.stringify(updated));
    setShowForm(false);
  };

  const deleteSlide = (id) => {
    if (!confirm('이 슬라이드를 삭제하시겠습니까?')) return;
    const updated = heroSlides.filter(s => s.id !== id);
    setHeroSlides(updated);
    localStorage.setItem('drivever_hero', JSON.stringify(updated));
  };

  const moveSlide = (id, dir) => {
    const idx = heroSlides.findIndex(s => s.id === id);
    const arr = [...heroSlides];
    const swap = idx + dir;
    if (swap < 0 || swap >= arr.length) return;
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
    setHeroSlides(arr);
    localStorage.setItem('drivever_hero', JSON.stringify(arr));
  };

  return (
    <div style={{padding:'32px 36px', maxWidth:'860px'}}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'28px'}}>
        <div>
          <h1 style={{fontSize:'1.375rem', fontWeight:700, color:'#111', marginBottom:'4px'}}>히어로 슬라이드 관리</h1>
          <p style={{fontSize:'0.8125rem', color:'#888'}}>메인 페이지 상단 롤링 배너 슬라이드를 관리합니다. 현재 {heroSlides.length}개 슬라이드.</p>
        </div>
        <button style={dbSt.newBtn} onClick={openNew}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          슬라이드 추가
        </button>
      </div>

      {/* Slide list */}
      <div style={{display:'flex', flexDirection:'column', gap:'16px', marginBottom:'32px'}}>
        {heroSlides.map((slide, i) => (
          <div key={slide.id} style={{border:'1px solid #EAEAEA', borderRadius:'10px', overflow:'hidden', background:'#fff'}}>
            <div style={{display:'grid', gridTemplateColumns:'280px 1fr', gap:'0'}}>
              {/* Preview */}
              <div style={{padding:'16px 0 16px 16px'}}>
                <SlidePreview slide={slide} />
              </div>
              {/* Info + actions */}
              <div style={{padding:'16px 20px', display:'flex', flexDirection:'column', justifyContent:'space-between'}}>
                <div>
                  <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px'}}>
                    <span style={{fontSize:'11px', fontWeight:700, color:'#888', letterSpacing:'0.04em'}}>슬라이드 {i+1}</span>
                    <span style={{padding:'2px 8px', background:'#EBF3FF', color:'#0070F3', borderRadius:'4px', fontSize:'11px', fontWeight:600}}>{slide.category}</span>
                  </div>
                  <div style={{fontSize:'1rem', fontWeight:700, color:'#111', marginBottom:'6px', lineHeight:1.3}}>{slide.title}</div>
                  <div style={{fontSize:'0.8125rem', color:'#555', lineHeight:1.5}}>{slide.description}</div>
                  {slide.postId && (
                    <div style={{marginTop:'8px', fontSize:'11px', color:'#aaa'}}>
                      연결된 포스트: {publishedPosts.find(p=>p.id===slide.postId)?.title || '(삭제된 포스트)'}
                    </div>
                  )}
                </div>
                <div style={{display:'flex', gap:'8px', alignItems:'center', marginTop:'16px'}}>
                  <button style={dbSt.actionBtn} onClick={()=>openEdit(slide)}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    편집
                  </button>
                  <button style={dbSt.actionBtn} onClick={()=>moveSlide(slide.id,-1)} disabled={i===0}>↑ 위로</button>
                  <button style={dbSt.actionBtn} onClick={()=>moveSlide(slide.id,1)} disabled={i===heroSlides.length-1}>↓ 아래로</button>
                  <button style={{...dbSt.actionBtn, color:'#C0392B', borderColor:'#FFD0D0'}} onClick={()=>deleteSlide(slide.id)}>삭제</button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {heroSlides.length === 0 && (
          <div style={{padding:'60px', textAlign:'center', color:'#aaa', border:'1px dashed #EAEAEA', borderRadius:'8px'}}>
            슬라이드가 없습니다. 슬라이드를 추가해주세요.
          </div>
        )}
      </div>

      {/* Edit/Add form modal */}
      {showForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.3)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center'}}
          onClick={e=>e.target===e.currentTarget&&setShowForm(false)}>
          <div style={{background:'#fff',borderRadius:'12px',padding:'28px',width:'560px',maxHeight:'80vh',overflowY:'auto',boxShadow:'0 20px 48px rgba(0,0,0,0.15)'}}>
            <h2 style={{fontSize:'1.125rem',fontWeight:700,color:'#111',marginBottom:'20px'}}>
              {editing ? '슬라이드 편집' : '새 슬라이드 추가'}
            </h2>

            {/* Link post */}
            <div style={edSt.metaSection}>
              <label style={edSt.metaLabel}>연결할 포스트 (선택)</label>
              <select value={form.postId} onChange={e=>{setForm(f=>({...f,postId:e.target.value})); if(e.target.value) autoFill(e.target.value);}} style={edSt.metaSelect}>
                <option value="">— 직접 입력 —</option>
                {publishedPosts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>

            <div style={edSt.metaSection}>
              <label style={edSt.metaLabel}>카테고리 텍스트</label>
              <input value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={edSt.metaInput} placeholder="교통법규" />
            </div>
            <div style={edSt.metaSection}>
              <label style={edSt.metaLabel}>타이틀</label>
              <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} style={edSt.metaInput} placeholder="배너 제목" />
            </div>
            <div style={edSt.metaSection}>
              <label style={edSt.metaLabel}>디스크립션</label>
              <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} style={{...edSt.metaInput, resize:'vertical', minHeight:'60px'}} placeholder="배너 설명" rows={2} />
            </div>

            {/* Image URL */}
            <div style={edSt.metaSection}>
              <label style={edSt.metaLabel}>배경 이미지 URL (선택 — 입력 시 그라디언트 대신 사용)</label>
              <input value={form.image} onChange={e=>setForm(f=>({...f,image:e.target.value}))}
                placeholder="https://images.unsplash.com/..." style={edSt.metaInput} />
              {form.image && (
                <div style={{marginTop:'8px', borderRadius:'6px', overflow:'hidden', aspectRatio:'16/7', background:'#F0F2F5'}}>
                  <img src={form.image} alt="preview" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} onError={e=>e.target.style.opacity='0.2'} />
                </div>
              )}
            </div>

            {/* Gradient preset */}
            <div style={edSt.metaSection}>
              <label style={edSt.metaLabel}>배경 그라디언트</label>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginTop:'8px'}}>
                {GRADIENT_PRESETS.map(g => (
                  <button key={g.value} onClick={()=>setForm(f=>({...f,bg:g.value}))} style={{
                    height:'48px', borderRadius:'6px', border: form.bg===g.value ? '2px solid #0070F3' : '2px solid transparent',
                    background:g.value, cursor:'pointer', position:'relative', overflow:'hidden',
                  }}>
                    <span style={{position:'absolute',bottom:'4px',left:'6px',fontSize:'9px',color:'rgba(255,255,255,0.8)',fontWeight:600}}>{g.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div style={{marginBottom:'20px'}}>
              <label style={edSt.metaLabel}>미리보기</label>
              <SlidePreview slide={{...form}} />
            </div>

            <div style={{display:'flex',gap:'10px',justifyContent:'flex-end'}}>
              <button onClick={()=>setShowForm(false)} style={{padding:'9px 20px',border:'1px solid #EAEAEA',borderRadius:'6px',background:'#fff',cursor:'pointer',fontFamily:'inherit',fontSize:'0.875rem',color:'#555'}}>취소</button>
              <button onClick={saveSlide} style={{...dbSt.newBtn}}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

Object.assign(window, { LoginPage, AdminLayout });
