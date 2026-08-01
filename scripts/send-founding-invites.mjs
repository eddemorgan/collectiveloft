#!/usr/bin/env node
/*
 * Founding welcome sender. LAUNCH DAY ONLY.
 *
 * Sends the founding welcome email (with each member's signup link) to every
 * unredeemed founding member on the allowlist. This is the one email that must
 * not go out before August 1.
 *
 * SAFE BY DEFAULT. Running it with no flags does a DRY RUN: it prints who would
 * receive it and writes one rendered sample to founding-sample.html. It sends
 * NOTHING. To actually send you must pass --send AND have real keys in the
 * environment. It refuses to send with placeholder keys.
 *
 * Usage:
 *   node scripts/send-founding-invites.mjs              # dry run, sends nothing
 *   node scripts/send-founding-invites.mjs --send       # ACTUALLY SENDS (Aug 1)
 *
 * Required env for a real send:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY
 *   NEXT_PUBLIC_APP_URL (defaults to https://collectiveloft.com)
 */
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { writeFileSync } from 'node:fs'
import { foundingWelcomeEmailHtml } from '../lib/emails.js'

const SEND = process.argv.includes('--send')
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://collectiveloft.com'
const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY
const RESEND_KEY = process.env.RESEND_API_KEY

function looksPlaceholder(k) {
  return !k || k.length < 40 || /placeholder|build_/i.test(k)
}

async function main() {
  if (!SUPA_URL || looksPlaceholder(SERVICE)) {
    console.error('\nMissing or placeholder Supabase service key. Set real keys before running.\n')
    process.exit(1)
  }
  const db = createClient(SUPA_URL, SERVICE)

  const { data: invites, error } = await db
    .from('founding_invites')
    .select('email, firstname, redeemed_at')
    .is('redeemed_at', null)          // skip anyone who already claimed
    .order('email')
  if (error) { console.error('Could not read founding_invites:', error.message); process.exit(1) }

  console.log(`\nFounding welcome sender`)
  console.log(`  mode:        ${SEND ? 'SEND (real emails will go out)' : 'DRY RUN (nothing sends)'}`)
  console.log(`  app url:     ${APP_URL}`)
  console.log(`  recipients:  ${invites.length} unredeemed founding members\n`)
  invites.forEach((i, n) => console.log(`   ${String(n + 1).padStart(2)}. ${i.email}  (${i.firstname || 'no name'})`))

  // Always write one rendered sample so you can eyeball it before sending.
  const sample = foundingWelcomeEmailHtml({
    firstname: invites[0]?.firstname || 'there',
    email: invites[0]?.email || 'you@example.com',
    appUrl: APP_URL,
  })
  writeFileSync(new URL('./founding-sample.html', import.meta.url), sample)
  console.log(`\n  wrote a rendered sample to scripts/founding-sample.html`)

  if (!SEND) {
    console.log(`\n  DRY RUN complete. No email was sent.`)
    console.log(`  To actually send on launch day: node scripts/send-founding-invites.mjs --send\n`)
    return
  }

  if (looksPlaceholder(RESEND_KEY)) {
    console.error('\n  --send was passed but RESEND_API_KEY is missing or a placeholder. Aborting. No email sent.\n')
    process.exit(1)
  }

  const resend = new Resend(RESEND_KEY)
  let sent = 0, failed = 0
  for (const inv of invites) {
    const html = foundingWelcomeEmailHtml({ firstname: inv.firstname || '', email: inv.email, appUrl: APP_URL })
    const { error: err } = await resend.emails.send({
      from: 'Collective Loft <noreply@collectiveloft.com>',
      to: inv.email,
      subject: 'Your founding spot is ready. The loft is open.',
      html,
    })
    if (err) { failed++; console.error(`   FAILED ${inv.email}: ${err.message || err}`) }
    else { sent++; console.log(`   sent   ${inv.email}`) }
    await new Promise(r => setTimeout(r, 600))   // gentle pace for Resend
  }
  console.log(`\n  Done. ${sent} sent, ${failed} failed.\n`)
}

main().catch(e => { console.error(e); process.exit(1) })
