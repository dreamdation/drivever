// Google Analytics 4 configuration + a safe event helper.
//
// The Measurement ID can be overridden per-environment with NEXT_PUBLIC_GA_ID
// (mirrors how SITE_URL works); the production property ID is the default.
// GA is loaded only in production (see components/analytics/GoogleAnalytics)
// and respects the Consent Mode v2 defaults set in app/layout.tsx — no cookies
// until the visitor accepts via the cookie banner.
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? 'G-JPC6WMEVVF'

type GtagFn = (...args: unknown[]) => void

// Fire a GA4 event. No-ops safely when gtag isn't loaded (dev, or before the
// loader runs), so callers never need to guard.
export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return
  const gtag = (window as unknown as { gtag?: GtagFn }).gtag
  if (typeof gtag !== 'function') return
  gtag('event', name, params)
}
