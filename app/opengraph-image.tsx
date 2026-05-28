import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Drivever — 실전 자동차·교통 정보 블로그'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          background: '#0a1628',
          padding: '80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            color: '#5BA2FF',
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: '0.04em',
            marginBottom: 28,
          }}
        >
          DRIVEVER
        </div>
        <div
          style={{
            color: '#ffffff',
            fontSize: 68,
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
          }}
        >
          실전 자동차·교통 정보 블로그
        </div>
        <div
          style={{
            color: 'rgba(255,255,255,0.65)',
            fontSize: 30,
            marginTop: 28,
            lineHeight: 1.4,
          }}
        >
          실제 오너의 경험 + 정확한 법률 해석
        </div>
      </div>
    ),
    { ...size }
  )
}
