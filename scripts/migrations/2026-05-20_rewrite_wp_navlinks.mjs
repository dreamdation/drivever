#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Rewrites in-body anchor hrefs that still point at the legacy WordPress site
 * (https://drivever.kr/{slug}/) to internal Next.js paths (/blog/{slug}).
 *
 * Only rewrites when the target slug actually exists as a published post in
 * Supabase. Unknown slugs are left untouched and logged so the user can
 * decide manually.
 *
 * Usage:
 *   node scripts/migrations/2026-05-20_rewrite_wp_navlinks.mjs --dry-run
 *   node scripts/migrations/2026-05-20_rewrite_wp_navlinks.mjs --execute
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..')
const envText = (() => {
  try { return readFileSync(join(ROOT, '.env.local'), 'utf8') }
  catch { return '' }
})()
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.+?)\s*$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
}

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPA_URL || !SUPA_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const DRY = !process.argv.includes('--execute')
const sb = createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: false } })

// ── load posts ──────────────────────────────────────────────────
const { data: posts, error } = await sb.from('posts').select('id, slug, body_html').order('id')
if (error) { console.error(error); process.exit(1) }

const slugSet = new Set(posts.map((p) => p.slug))

// ── pattern: href="<protocol>://drivever.kr/<path>" ─────────────
// Matches both http and https, captures the inside of the URL after the host.
const HREF_RE = /href="(https?:\/\/drivever\.kr\/([^"]*))"/g

function decode(s) {
  try { return decodeURIComponent(s) } catch { return s }
}

function planRewrites(html) {
  /** @type {{from:string, to:string|null, slug:string}[]} */
  const hits = []
  for (const m of html.matchAll(HREF_RE)) {
    const fullUrl = m[1]
    const pathRaw = m[2]
    // Strip trailing slash, ignore anything after "?" or "#"
    const cleanPath = decode(pathRaw).replace(/[?#].*$/, '').replace(/\/$/, '')
    if (!cleanPath) continue
    // We only want top-level post slugs (no nested paths)
    if (cleanPath.includes('/')) {
      hits.push({ from: fullUrl, to: null, slug: cleanPath })
      continue
    }
    if (slugSet.has(cleanPath)) {
      hits.push({ from: fullUrl, to: `/blog/${cleanPath}`, slug: cleanPath })
    } else {
      hits.push({ from: fullUrl, to: null, slug: cleanPath })
    }
  }
  return hits
}

function applyRewrites(html, hits) {
  let out = html
  for (const h of hits) {
    if (!h.to) continue
    out = out.split(`href="${h.from}"`).join(`href="${h.to}"`)
  }
  return out
}

// ── build plan ──────────────────────────────────────────────────
let totalRewrites = 0
let totalSkipped = 0
const perPost = []
for (const p of posts) {
  if (!p.body_html || !p.body_html.includes('drivever.kr')) continue
  const hits = planRewrites(p.body_html)
  if (!hits.length) continue
  const rewrites = hits.filter((h) => h.to)
  const skips    = hits.filter((h) => !h.to)
  perPost.push({ id: p.id, slug: p.slug, body: p.body_html, hits, rewrites, skips })
  totalRewrites += rewrites.length
  totalSkipped  += skips.length
}

console.log(`${DRY ? '[DRY-RUN] ' : ''}Plan: ${totalRewrites} rewrites, ${totalSkipped} skip(s) (no matching slug) across ${perPost.length} post(s).\n`)

for (const p of perPost) {
  console.log(`  post #${p.id} (${p.slug}):`)
  for (const h of p.hits) {
    if (h.to) console.log(`    ✓ ${h.from}  →  ${h.to}`)
    else      console.log(`    – ${h.from}  (no matching slug "${h.slug}")`)
  }
}

if (DRY) {
  console.log('\nRe-run with --execute to apply.')
  process.exit(0)
}

// ── execute ─────────────────────────────────────────────────────
console.log('\nApplying...\n')
let updated = 0, failed = 0
for (const p of perPost) {
  if (!p.rewrites.length) continue
  const nextBody = applyRewrites(p.body, p.hits)
  if (nextBody === p.body) continue
  const { error: upErr } = await sb.from('posts').update({ body_html: nextBody }).eq('id', p.id)
  if (upErr) { failed++; console.error(`  ✗ #${p.id}: ${upErr.message}`) }
  else      { updated++; console.log(`  ✓ #${p.id}: ${p.rewrites.length} link(s) rewritten`) }
}
console.log(`\nDone. ${updated} post(s) updated, ${failed} failed.`)
