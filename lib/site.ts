// Canonical site origin. Override per-environment with NEXT_PUBLIC_SITE_URL
// (e.g. a Vercel preview URL) so canonical/OG/sitemap links stay correct.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://drivever.kr'
).replace(/\/$/, '')
