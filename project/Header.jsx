// Header.jsx — Drivever Blog Navigation
const Header = ({ currentPage, onNavigate, onSearch, isLoggedIn, onAdminClick, onLoginClick }) => {
  const { useState } = React;
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { id: 'home', label: '홈' },
    { id: 'about', label: '블로그 소개' },
    { id: 'traffic', label: '교통법규' },
    { id: 'garage', label: 'Premium Garage' },
    { id: 'safety', label: '안전운전' },
  ];

  const s = headerSt;

  return (
    <header style={s.header}>
      <div style={s.inner}>
        <button style={s.logo} onClick={() => onNavigate('home')}>
          <img src="assets/favicon-drivever-512.png" width="26" height="26" alt="Drivever" style={{objectFit:'contain'}} />
          <span style={s.logoText}>Drivever</span>
        </button>

        <nav style={s.nav}>
          {links.map(l => (
            <button key={l.id}
              style={{...s.navLink, ...(currentPage===l.id ? s.navLinkActive : {})}}
              onClick={() => onNavigate(l.id)}
              onMouseEnter={e => { if(currentPage!==l.id) e.currentTarget.style.color='#0070F3'; }}
              onMouseLeave={e => { if(currentPage!==l.id) e.currentTarget.style.color='#555'; }}>
              {l.label}
            </button>
          ))}
        </nav>

        <div style={s.actions}>
          <button style={s.iconBtn} onClick={onSearch} title="검색"
            onMouseEnter={e => e.currentTarget.style.background='#FAFAFA'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>

          {isLoggedIn ? (
            <button style={s.adminBtn} onClick={onAdminClick}
              onMouseEnter={e => e.currentTarget.style.background='#005fd6'}
              onMouseLeave={e => e.currentTarget.style.background='#0070F3'}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
              관리자
            </button>
          ) : (
            <button style={s.loginBtn} onClick={onLoginClick}
              onMouseEnter={e => e.currentTarget.style.background='#FAFAFA'}
              onMouseLeave={e => e.currentTarget.style.background='#fff'}>
              로그인
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

const headerSt = {
  header: {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'rgba(255,255,255,0.96)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    borderBottom: '1px solid #EAEAEA',
    height: '56px', display: 'flex', alignItems: 'center',
  },
  inner: {
    maxWidth: '1080px', margin: '0 auto', padding: '0 24px',
    display: 'flex', alignItems: 'center', width: '100%', gap: '0',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'none', border: 'none', cursor: 'pointer',
    marginRight: '32px', padding: '0', flexShrink: 0,
  },
  logoText: {
    fontWeight: 700, fontSize: '1.0625rem', color: '#111',
    letterSpacing: '-0.02em', fontFamily: 'inherit',
  },
  nav: { display: 'flex', gap: '2px', flex: 1 },
  navLink: {
    padding: '6px 12px', fontSize: '0.875rem', color: '#555',
    borderRadius: '6px', cursor: 'pointer', background: 'transparent',
    border: 'none', fontWeight: 500, fontFamily: 'inherit',
    transition: 'background 0.15s, color 0.15s',
  },
  navLinkActive: { color: '#0070F3', background: '#EBF3FF' },
  actions: { marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' },
  iconBtn: {
    width: '34px', height: '34px', borderRadius: '6px',
    background: 'transparent', border: '1px solid #EAEAEA',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: '#555', transition: 'background 0.15s',
  },
  loginBtn: {
    padding: '6px 14px', fontSize: '0.8125rem', fontWeight: 600,
    borderRadius: '6px', border: '1px solid #EAEAEA',
    background: '#fff', color: '#555', cursor: 'pointer',
    fontFamily: 'inherit', transition: 'background 0.15s',
  },
  adminBtn: {
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: '6px 13px', fontSize: '0.8125rem', fontWeight: 600,
    borderRadius: '6px', border: 'none', background: '#0070F3',
    color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
    transition: 'background 0.15s',
  },
};

Object.assign(window, { Header });
