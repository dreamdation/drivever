#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * One-time migration: reorganize the `post-images` bucket from a flat
 * structure to:
 *   posts/{post-id}/{file}       — body images (TiptapEditor uploads)
 *   thumbnails/{post-id}/{file}  — post thumbnails
 *   hero/{file}                  — hero slide backgrounds
 *   legacy/{file}                — unreferenced leftovers
 *
 * For each root-level file we:
 *   1. Find usage in `posts.thumbnail` and `posts.body_html`.
 *   2. Decide a new path based on usage.
 *   3. Move the object (storage.move = S3 copy + delete + DB rename).
 *   4. Rewrite the matching URL substring in the DB rows.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (RLS-bypassing). Reads NEXT_PUBLIC_
 * vars from .env.local automatically.
 *
 * Usage:
 *   node scripts/migrations/2026-05-20_storage_folder_restructure.mjs --dry-run
 *   node scripts/migrations/2026-05-20_storage_folder_restructure.mjs --execute
 *
 * Optional flags:
 *   --orphan=legacy   (default) move unreferenced files to legacy/
 *   --orphan=hero     route unreferenced files to hero/ instead
 *   --orphan=skip     leave unreferenced files at root
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

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

if (!SUPA_URL || !SUPA_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  console.error('Add SUPABASE_SERVICE_ROLE_KEY to .env.local (Supabase dashboard → Settings → API).')
  process.exit(1)
}

// ── flags ───────────────────────────────────────────────────────
const args = new Set(process.argv.slice(2))
const DRY  = !args.has('--execute')
const orphanFlag = [...args].find((a) => a.startsWith('--orphan='))?.split('=')[1] ?? 'legacy'
if (!['legacy', 'hero', 'skip'].includes(orphanFlag)) {
  console.error(`Invalid --orphan value: ${orphanFlag}`)
  process.exit(1)
}

const sb = createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: false } })

// ── helpers ─────────────────────────────────────────────────────
const publicUrl = (path) => `${SUPA_URL}/storage/v1/object/public/${BUCKET}/${path}`

async function listRootFiles() {
  const { data, error } = await sb.storage.from(BUCKET).list('', { limit: 1000 })
  if (error) throw error
  // Folders show up as entries with no `id`; files have a metadata.size.
  return (data ?? []).filter((e) => e.id && e.metadata)
}

async function findUsage(fileName) {
  // Match against the full Supabase public URL — name-only matching would
  // false-positive on posts that reference a same-named file on another host
  // (e.g. an old WordPress import at drivever.kr/wp-content/uploads/...).
  const pattern = `%${publicUrl(fileName)}%`
  const [{ data: tRows }, { data: bRows }] = await Promise.all([
    sb.from('posts').select('id, thumbnail').ilike('thumbnail', pattern),
    sb.from('posts').select('id, body_html').ilike('body_html', pattern),
  ])
  return {
    thumbnailOf: tRows?.map((r) => r.id) ?? [],
    bodyOf:      bRows?.map((r) => r.id) ?? [],
  }
}

function decideTarget(fileName, usage) {
  // Thumbnail usage wins (more specific).
  if (usage.thumbnailOf.length) return `thumbnails/${usage.thumbnailOf[0]}/${fileName}`
  if (usage.bodyOf.length)      return `posts/${usage.bodyOf[0]}/${fileName}`
  if (orphanFlag === 'hero')    return `hero/${fileName}`
  if (orphanFlag === 'skip')    return null
  return `legacy/${fileName}`
}

async function rewriteUrls(oldPath, newPath) {
  // Update any posts row whose thumbnail or body_html contains the old URL.
  const oldUrl = publicUrl(oldPath)
  const newUrl = publicUrl(newPath)

  const { data: thumbRows } = await sb.from('posts').select('id, thumbnail').ilike('thumbnail', `%${oldPath}%`)
  for (const r of thumbRows ?? []) {
    const next = (r.thumbnail ?? '').split(oldUrl).join(newUrl)
    if (next !== r.thumbnail) await sb.from('posts').update({ thumbnail: next }).eq('id', r.id)
  }

  const { data: bodyRows } = await sb.from('posts').select('id, body_html').ilike('body_html', `%${oldPath}%`)
  for (const r of bodyRows ?? []) {
    const next = (r.body_html ?? '').split(oldUrl).join(newUrl)
    if (next !== r.body_html) await sb.from('posts').update({ body_html: next }).eq('id', r.id)
  }
}

// ── main ────────────────────────────────────────────────────────
const files = await listRootFiles()
if (!files.length) {
  console.log('No root-level files found. Nothing to migrate.')
  process.exit(0)
}

console.log(`${DRY ? '[DRY-RUN] ' : ''}Inspecting ${files.length} root file(s) in bucket "${BUCKET}"...\n`)

const plan = []
for (const f of files) {
  const usage  = await findUsage(f.name)
  const target = decideTarget(f.name, usage)
  plan.push({ from: f.name, to: target, usage })
}

for (const p of plan) {
  const refs = [
    p.usage.thumbnailOf.length ? `thumbnail of #${p.usage.thumbnailOf.join(',#')}` : null,
    p.usage.bodyOf.length      ? `body of #${p.usage.bodyOf.join(',#')}`           : null,
  ].filter(Boolean).join(', ') || 'orphan'
  const action = p.to ? `→ ${p.to}` : '(skip)'
  console.log(`  ${p.from}  [${refs}]  ${action}`)
}

if (DRY) {
  console.log('\nDry-run complete. Re-run with --execute to apply.')
  process.exit(0)
}

console.log('\nApplying migration...\n')
for (const p of plan) {
  if (!p.to || p.to === p.from) continue
  const { error: mvErr } = await sb.storage.from(BUCKET).move(p.from, p.to)
  if (mvErr) {
    console.error(`  ✗ ${p.from}: ${mvErr.message}`)
    continue
  }
  await rewriteUrls(p.from, p.to)
  console.log(`  ✓ ${p.from} → ${p.to}`)
}
console.log('\nDone.')
