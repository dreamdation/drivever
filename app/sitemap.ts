import type { MetadataRoute } from 'next'
import { supabase, rowToPost, PostRow } from '@/lib/supabase'
import { SITE_URL } from '@/lib/site'

// Revalidate hourly so newly published posts appear without a redeploy.
export const revalidate = 3600

// Converts a post's "YYYY.MM.DD" date to a Date (falls back to now on parse fail).
function parseDate(d: string): Date {
  const iso = d.replace(/\./g, '-')
  const parsed = new Date(iso)
  return isNaN(parsed.getTime()) ? new Date() : parsed
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`,          changeFrequency: 'daily',   priority: 1.0, lastModified: new Date() },
    { url: `${SITE_URL}/blog`,      changeFrequency: 'daily',   priority: 0.9, lastModified: new Date() },
    { url: `${SITE_URL}/about`,     changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/advertise`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/contact`,   changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${SITE_URL}/privacy`,   changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${SITE_URL}/terms`,     changeFrequency: 'yearly',  priority: 0.2 },
  ]

  // Published, non-trashed posts from Supabase.
  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .is('deleted_at', null)

  const postRoutes: MetadataRoute.Sitemap = (data ?? [])
    .map((r) => rowToPost(r as PostRow))
    .filter((p) => p.slug && p.slug.trim() !== '')
    .map((p) => ({
      url: `${SITE_URL}/blog/${encodeURIComponent(p.slug)}`,
      lastModified: parseDate(p.date),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

  return [...staticRoutes, ...postRoutes]
}
