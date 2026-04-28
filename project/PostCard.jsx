// PostCard.jsx — Drivever Blog Post Card with 16:9 thumbnail
const PostCard = ({ post, onClick, compact }) => {
  const { useState } = React;
  const { category, categoryColor, title, description, date, readTime, isNew, published, thumbnail } = post;
  const [imgError, setImgError] = useState(false);

  const catStyle = (color) => {
    if (color === 'green')  return { background:'#ECFDF5', color:'#059669' };
    if (color === 'purple') return { background:'#F3EEFF', color:'#7C3AED' };
    return { background:'#EBF3FF', color:'#0070F3' };
  };

  if (compact) {
    return (
      <button style={pcSt.compact} onClick={() => onClick && onClick(post)}
        onMouseEnter={e => e.currentTarget.style.borderColor='#0070F3'}
        onMouseLeave={e => e.currentTarget.style.borderColor='#EAEAEA'}>
        <div style={{ flex:1, textAlign:'left' }}>
          <div style={{ display:'flex', gap:'6px', alignItems:'center', marginBottom:'4px' }}>
            <span style={{ ...pcSt.catBadge, ...catStyle(categoryColor) }}>{category}</span>
            {published === false && <span style={pcSt.draftBadge}>임시저장</span>}
          </div>
          <div style={pcSt.compactTitle}>{title}</div>
          <div style={pcSt.compactMeta}>{date} · 읽는 시간 {readTime}분</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    );
  }

  const showThumb = thumbnail && !imgError;

  return (
    <button style={pcSt.card} onClick={() => onClick && onClick(post)}
      onMouseEnter={e => { e.currentTarget.style.borderColor='#0070F3'; e.currentTarget.style.boxShadow='0 4px 16px rgba(0,112,243,0.1)'; e.currentTarget.querySelector('.thumb-img') && (e.currentTarget.querySelector('.thumb-img').style.transform='scale(1.04)'); }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='#EAEAEA'; e.currentTarget.style.boxShadow='none'; e.currentTarget.querySelector('.thumb-img') && (e.currentTarget.querySelector('.thumb-img').style.transform='scale(1)'); }}>

      {/* Thumbnail area */}
      <div style={{ margin:'-1px -1px 0', borderRadius:'8px 8px 0 0', overflow:'hidden', aspectRatio:'16/9', background:'#F0F2F5', flexShrink:0 }}>
        {showThumb ? (
          <img className="thumb-img" src={thumbnail} alt={title}
            style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transition:'transform 0.4s ease' }}
            onError={() => setImgError(true)} />
        ) : (
          <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg, #F0F2F5 0%, #E5E8EF 100%)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C8CDD8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect x="9" y="11" width="14" height="10" rx="2" ry="2"/><circle cx="12" cy="16" r="1"/>
            </svg>
          </div>
        )}
      </div>

      {/* Text content */}
      <div style={{ padding:'16px 18px 18px', display:'flex', flexDirection:'column', flex:1 }}>
        <div style={{ display:'flex', gap:'6px', alignItems:'center', marginBottom:'9px' }}>
          <span style={{ ...pcSt.catBadge, ...catStyle(categoryColor) }}>{category}</span>
          {isNew && <span style={pcSt.newBadge}>NEW</span>}
          {published === false && <span style={pcSt.draftBadge}>임시저장</span>}
        </div>
        <div style={pcSt.title}>{title}</div>
        <div style={pcSt.desc}>{description}</div>
        <div style={pcSt.meta}>
          <span>{date}</span>
          <span>읽는 시간 {readTime}분</span>
        </div>
      </div>
    </button>
  );
};

const pcSt = {
  card: {
    background:'#fff', border:'1px solid #EAEAEA', borderRadius:'8px',
    textAlign:'left', cursor:'pointer', display:'flex', flexDirection:'column',
    transition:'border-color 0.15s, box-shadow 0.15s', fontFamily:'inherit', width:'100%',
    overflow:'hidden', padding:0,
  },
  catBadge: {
    display:'inline-flex', alignItems:'center', padding:'2px 8px',
    borderRadius:'4px', fontSize:'11px', fontWeight:600, letterSpacing:'0.02em',
  },
  newBadge: {
    display:'inline-flex', alignItems:'center', padding:'2px 6px',
    borderRadius:'4px', fontSize:'10px', fontWeight:700,
    background:'#0070F3', color:'#fff', letterSpacing:'0.04em',
  },
  draftBadge: {
    display:'inline-flex', alignItems:'center', padding:'2px 6px',
    borderRadius:'4px', fontSize:'10px', fontWeight:600,
    background:'#F3F4F6', color:'#888', letterSpacing:'0.02em',
  },
  title: { fontSize:'0.9375rem', fontWeight:700, color:'#111', lineHeight:1.4, marginBottom:'7px' },
  desc:  { fontSize:'0.8125rem', color:'#666', lineHeight:1.6, marginBottom:'12px', flex:1 },
  meta:  { fontSize:'11px', color:'#aaa', display:'flex', gap:'10px' },
  compact: {
    background:'#fff', border:'1px solid #EAEAEA', borderRadius:'8px',
    padding:'14px 16px', display:'flex', justifyContent:'space-between',
    alignItems:'center', cursor:'pointer', fontFamily:'inherit', width:'100%',
    transition:'border-color 0.15s',
  },
  compactTitle: { fontSize:'0.9375rem', fontWeight:600, color:'#111', marginBottom:'3px' },
  compactMeta:  { fontSize:'11px', color:'#aaa' },
};

Object.assign(window, { PostCard });
