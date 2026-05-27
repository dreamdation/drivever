#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * One-time migration: ingest images currently hosted on drivever.kr/wp-content
 * into the Supabase `post-images` bucket, then rewrite the DB to point at
 * the new locations.
 *
 *   posts.thumbnail (WP URL)  → upload to thumbnails/{post-id}/{basename}
 *   posts.body_html  <img>    → upload to posts/{post-id}/{basename}
 *
 * Idempotent: re-uploading the same target path uses `upsert: true`, and
 * URL rewrites are no-ops if the WP URL is already gone from the row.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (RLS-bypassing).
 *
 * Usage:
 *   node scripts/migrations/2026-05-20_ingest_wp_images.mjs --dry-run
 *   node scripts/migrations/2026-05-20_ingest_wp_images.mjs --execute
 *
 * Flags:
 *   --limit=N        process only the first N posts (debugging)
 *   --post=ID        process only one post (debugging)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, posix } from 'node:path'

// ── env loader (.env.local) ─────────────────────────────────────
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
const BUCKET   = 'post-images'
const WP_HOST  = 'drivever.kr'

if (!SUPA_URL || !SUPA_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

// ── flags ───────────────────────────────────────────────────────
const args = process.argv.slice(2)
const DRY  = !args.includes('--execute')
const LIMIT = Number(args.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? 0) || null
const ONLY  = Number(args.find((a) => a.startsWith('--post='))?.split('=')[1]  ?? 0) || null

const sb = createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: false } })

// ── helpers ─────────────────────────────────────────────────────
const publicUrl = (path) => `${SUPA_URL}/storage/v1/object/public/${BUCKET}/${path}`

// Extract every drivever.kr/wp-content/uploads/... URL inside an HTML blob.
const WP_RE = new RegExp(`https?://${WP_HOST.replace('.', '\\.')}/wp-content/uploads/[^"'\\s)<>]+`, 'g')

function extractWpUrls(html) {
  if (!html) return []
  const set = new Set()
  for (const m of html.matchAll(WP_RE)) set.add(m[0])
  return [...set]
}

function basenameOf(url) {
  try {
    const u = new URL(url)
    const last = u.pathname.split('/').pop() ?? ''
    return decodeURIComponent(last)
  } catch {
    return ''
  }
}

async function headOk(url) {
  try {
    const r = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    return r.ok
  } catch {
    return false
  }
}

async function downloadAndUpload(srcUrl, destPath) {
  const res = await fetch(srcUrl, { redirect: 'follow' })
  if (!res.ok) throw new Error(`fetch ${srcUrl} → HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const contentType = res.headers.get('content-type') || 'application/octet-stream'
  const { error } = await sb.storage.from(BUCKET).upload(destPath, buf, {
    contentType,
    upsert: true,
  })
  if (error) throw new Error(`upload ${destPath} → ${error.message}`)
}

// ── load posts ──────────────────────────────────────────────────
let query = sb.from('posts').select('id, slug, thumbnail, body_html').order('id')
if (ONLY) query = query.eq('id', ONLY)
const { data: posts, error: loadErr } = await query
if (loadErr) { console.error(loadErr); process.exit(1) }

const slice = LIMIT ? posts.slice(0, LIMIT) : posts

// ── build plan ──────────────────────────────────────────────────
/** @type {{postId:number, kind:'thumbnail'|'body', srcUrl:string, destPath:string}[]} */
const plan = []
for (const p of slice) {
  if (p.thumbnail && p.thumbnail.includes(WP_HOST)) {
    const name = basenameOf(p.thumbnail)
    if (name) plan.push({ postId: p.id, kind: 'thumbnail', srcUrl: p.thumbnail, destPath: `thumbnails/${p.id}/${name}` })
  }
  for (const url of extractWpUrls(p.body_html)) {
    const name = basenameOf(url)
    if (name) plan.push({ postId: p.id, kind: 'body', srcUrl: url, destPath: `posts/${p.id}/${name}` })
  }
}

if (!plan.length) {
  console.log('No WP URLs found in posts. Nothing to ingest.')
  process.exit(0)
}

// ── summary ─────────────────────────────────────────────────────
const byPost = new Map()
for (const it of plan) {
  if (!byPost.has(it.postId)) byPost.set(it.postId, { thumb: 0, body: 0 })
  byPost.get(it.postId)[it.kind === 'thumbnail' ? 'thumb' : 'body']++
}

console.log(`${DRY ? '[DRY-RUN] ' : ''}Plan: ${plan.length} file(s) across ${byPost.size} post(s)`)
for (const [pid, c] of byPost) {
  console.log(`  post #${pid}: ${c.thumb} thumbnail + ${c.body} body`)
}

if (DRY) {
  console.log('\nProbing source URLs (HEAD) — checking that drivever.kr files are reachable...')
  const uniqueSrcs = [...new Set(plan.map((p) => p.srcUrl))]
  let ok = 0, bad = 0
  for (const u of uniqueSrcs) {
    const good = await headOk(u)
    if (good) ok++
    else { bad++; console.log(`  ✗ unreachable: ${u}`) }
  }
  console.log(`\nReachable: ${ok}/${uniqueSrcs.length}.  Bad: ${bad}.`)
  console.log('Re-run with --execute to apply.')
  process.exit(0)
}

// ── execute ─────────────────────────────────────────────────────
console.log('\nIngesting...\n')

// Group by post so we batch DB updates.
/** @type {Map<number, {thumbnail: string|null, body_html: string|null, edited: boolean}>} */
const dbState = new Map()
for (const p of slice) {
  dbState.set(p.id, { thumbnail: p.thumbnail, body_html: p.body_html, edited: false })
}

let success = 0, failed = 0
for (const it of plan) {
  try {
    await downloadAndUpload(it.srcUrl, it.destPath)
    const newUrl = publicUrl(it.destPath)
    const row = dbState.get(it.postId)
    if (it.kind === 'thumbnail' && row.thumbnail) {
      const next = row.thumbnail.split(it.srcUrl).join(newUrl)
      if (next !== row.thumbnail) { row.thumbnail = next; row.edited = true }
    } else if (it.kind === 'body' && row.body_html) {
      const next = row.body_html.split(it.srcUrl).join(newUrl)
      if (next !== row.body_html) { row.body_html = next; row.edited = true }
    }
    success++
    console.log(`  ✓ #${it.postId} ${it.kind}: ${basenameOf(it.srcUrl)} → ${it.destPath}`)
  } catch (e) {
    failed++
    console.error(`  ✗ #${it.postId} ${it.kind}: ${e.message}`)
  }
}

console.log('\nWriting DB updates...')
let updated = 0
for (const [pid, row] of dbState) {
  if (!row.edited) continue
  const { error } = await sb.from('posts').update({
    thumbnail: row.thumbnail,
    body_html: row.body_html,
  }).eq('id', pid)
  if (error) console.error(`  ✗ db update #${pid}: ${error.message}`)
  else { updated++; console.log(`  ✓ db update #${pid}`) }
}

console.log(`\nDone. Files: ${success} uploaded, ${failed} failed. Posts updated: ${updated}.`)
