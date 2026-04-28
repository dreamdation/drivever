// LawBox.jsx — Law callout + TipBox + AdSlot
const LawBox = ({ lawRef, children }) => (
  <div style={lbSt.box}>
    {lawRef && <div style={lbSt.label}>{lawRef}</div>}
    <div style={lbSt.text}>{children}</div>
  </div>
);

const TipBox = ({ children }) => (
  <div style={tbSt.box}>
    <div style={tbSt.icon}>i</div>
    <div style={tbSt.text}>{children}</div>
  </div>
);

const AdSlot = ({ size = 'leaderboard', label }) => {
  const dims = {
    leaderboard: { width: '100%', height: '90px', lbl: '광고 영역 — 728×90 (리더보드)' },
    rectangle:   { width: '300px', height: '250px', lbl: '광고 영역 — 300×250 (미디엄 사각형)' },
    large:       { width: '100%', height: '120px', lbl: '광고 영역 — 970×90 (라지 리더보드)' },
    sidebar:     { width: '100%', height: '600px', lbl: '광고 영역 — 160×600 (와이드 스카이스크레이퍼)' },
  };
  const d = dims[size] || dims.leaderboard;
  return (
    <div style={{
      width: d.width, height: d.height,
      border: '1.5px dashed #D8D8D8', borderRadius: '4px',
      background: '#FAFAFA',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '4px', margin: '24px auto',
    }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
      <span style={{ fontSize: '11px', fontWeight: 700, color: '#ccc', letterSpacing: '0.07em' }}>ADSENSE</span>
      <span style={{ fontSize: '10px', color: '#D0D0D0' }}>{label || d.lbl}</span>
    </div>
  );
};

const lbSt = {
  box: {
    borderLeft: '4px solid #0070F3', background: '#FAFAFA',
    padding: '14px 18px', borderRadius: '0', margin: '20px 0',
  },
  label: { fontSize: '11px', fontWeight: 700, color: '#0070F3', letterSpacing: '0.06em', marginBottom: '6px' },
  text: { fontSize: '0.9375rem', color: '#333', lineHeight: 1.65 },
};

const tbSt = {
  box: {
    background: '#EBF3FF', borderRadius: '8px', padding: '14px 18px',
    display: 'flex', gap: '12px', alignItems: 'flex-start', margin: '20px 0',
  },
  icon: {
    fontSize: '13px', fontWeight: 700, color: '#0070F3',
    background: '#fff', borderRadius: '50%', width: '22px', height: '22px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: '1px', fontFamily: 'serif',
  },
  text: { fontSize: '0.9rem', color: '#1a4fa3', lineHeight: 1.6 },
};

Object.assign(window, { LawBox, TipBox, AdSlot });
