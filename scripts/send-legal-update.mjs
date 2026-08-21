#!/usr/bin/env node
/*
 * Legal update notice sender.
 *
 * Emails every open account the legal-update notice, which is how Section 24's
 * promise of advance email notice before material changes gets kept. Run it
 * when the notice period starts, at least 14 days before the new
 * EFFECTIVE_DATE in lib/legal.js.
 *
 * SAFE BY DEFAULT, same contract as send-founding-invites.mjs. No flags means
 * DRY RUN: it prints who would receive the notice and writes one rendered
 * sample to legal-update-sample.html. It sends NOTHING. To actually send, pass
 * --send AND have real keys in the environment. It refuses placeholder keys.
 *
 * Usage:
 *   node scripts/send-legal-update.mjs          # dry run, sends nothing
 *   node scripts/send-legal-update.mjs --send   # ACTUALLY SENDS
 *
 * Required env for a real send:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY
 *   NEXT_PUBLIC_APP_URL (defaults to https://collectiveloft.com)
 */
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { writeFileSync } from 'node:fs'
import { legalUpdateEmailHtml } from '../lib/emails.js'
import { EFFECTIVE_DATE } from '../lib/legal.js'

const SEND = process.argv.includes('--send')
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://collectiveloft.com'
const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY
const RESEND_KEY = process.env.RESEND_API_KEY

function looksPlaceholder(k, minLen = 40) {
  return !k || k.length < minLen || /placeholder|build_/i.test(k)
}

async function main() {
  if (!SUPA_URL || looksPlaceholder(SERVICE)) {
    console.error('\nMissing or placeholder Supabase service key. Set real keys before running.\n')
    process.exit(1)
  }

  const db = createClient(SUPA_URL, SERVICE)
  const { data: members, error } = await db
    .from('profiles')
    .select('id, firstname, email')
    .is('deleted_at', null)
    .not('email', 'is', null)
  if (error) {
    console.error('Could not load members:', error)
    process.exit(1)
  }

  const recipients = members.filter(m => (m.email || '').includes('@'))
  console.log(`\nLegal update notice. Effective date in lib/legal.js: ${EFFECTIVE_DATE}`)
  console.log(`${recipients.length} open accounts would receive it:\n`)
  for (const m of recipients) console.log(`  ${m.email}${m.firstname ? `  (${m.firstname})` : ''}`)

  const sample = legalUpdateEmailHtml({
    firstname: recipients[0]?.firstname || '',
    effectiveDate: EFFECTIVE_DATE,
    appUrl: APP_URL,
  })
  writeFileSync('legal-update-sample.html', sample)
  console.log('\nRendered sample written to legal-update-sample.html')

  if (!SEND) {
    console.log('\nDRY RUN. Nothing sent. Pass --send to actually send.\n')
    return
  }
  if (looksPlaceholder(RESEND_KEY, 20)) {
    console.error('\nRESEND_API_KEY looks like a placeholder. Refusing to send.\n')
    process.exit(1)
  }

  const resend = new Resend(RESEND_KEY)
  let sent = 0, failed = 0
  for (const m of recipients) {
    const { error: mailErr } = await resend.emails.send({
      from: 'Collective Loft <noreply@collectiveloft.com>',
      to: m.email,
      subject: 'We put "never sell your data" in the contract',
      html: legalUpdateEmailHtml({ firstname: m.firstname || '', effectiveDate: EFFECTIVE_DATE, appUrl: APP_URL }),
    })
    if (mailErr) { failed++; console.error(`  FAILED ${m.email}:`, mailErr.message || mailErr) }
    else { sent++; console.log(`  sent ${m.email}`) }
    // Resend rate limit is 2/sec on the base plan. Stay under it.
    await new Promise(r => setTimeout(r, 600))
  }
  console.log(`\nDone. ${sent} sent, ${failed} failed.\n`)
}

main()
