interface AdSlotProps {
  size?: 'leaderboard' | 'rectangle' | 'large' | 'sidebar'
  label?: string
}

// Ad slot positions (sizes kept for future AdSense activation):
// leaderboard  — 728×90  (히어로 하단, 본문 상단/섹션 사이/하단)
// rectangle    — 300×250 (사이드바 상단/하단)
// large        — 970×90  (라지 리더보드)
// sidebar      — 160×600 (와이드 스카이스크레이퍼)
export default function AdSlot(_props: AdSlotProps) {
  // 광고 활성화 시 여기에 AdSense 스크립트 삽입
  return null
}
