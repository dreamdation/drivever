// Google AdSense configuration.
//
// Approval flow:
//   1. The loader script (injected in app/layout.tsx when ADSENSE_CLIENT is set)
//      is all Google needs to review the site — no ad units required yet.
//   2. After approval, create ad units in the AdSense dashboard and paste each
//      "data-ad-slot" ID into AD_SLOTS below. AdSlot then renders real ads.
//
// Until a slot ID is filled in, the matching <AdSlot> renders nothing in
// production (so there are no unfilled-ad console errors during review).

export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? ''

export type AdSize = 'leaderboard' | 'rectangle' | 'large' | 'sidebar'

// Map each placement size to its AdSense ad-unit slot ID. Leave '' until you
// create the unit in the dashboard.
export const AD_SLOTS: Record<AdSize, string> = {
  leaderboard: '', // 728×90  본문 상단/섹션 사이/하단, 목록 배너
  rectangle:   '', // 300×250 사이드바
  large:       '', // 970×90  라지 리더보드
  sidebar:     '', // 160×600 스카이스크레이퍼
}
