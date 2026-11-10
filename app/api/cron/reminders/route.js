import { serviceClient, sendMail, appUrl } from '../../../../lib/mailer'
import { remindersFor, dueStage, profilePath, longDate } from '../../../../lib/reminders'
import { foundingEndingEmailHtml, studentEndingEmailHtml, trialEndingEmailHtml } from '../../../../lib/emails'

// Daily advance notices: founding/comp endings, student years, Paddle trials.
// Vercel Cron calls this once a day (vercel.json) with the CRON_SECRET as a
// bearer token; anyone else gets a 401.
//
// It mails nobody unless REMINDERS_LIVE is 'true'. Without it, or with ?dry=1,
// it reports who would be emailed and with what, and writes nothing. That is
// how a schedule change gets checked before it reaches a real inbox.
export const dynamic = 'force-dynamic'

export async function GET(request) {
  const auth = request.headers.get('authorization') || ''
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const live = process.env.REMINDERS_LIVE === 'true' && !new URL(request.url).searchParams.has('dry')
  const supabase = serviceClient()
  const base = appUrl()

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, firstname, lastname, founding_member, subscription_status, comped_until, student_until, trial_ends_at')
    .is('deleted_at', null)
    .or('comped_until.not.is.null,student_until.not.is.null,trial_ends_at.not.is.null')
  if (error) {
    console.error('Reminder job: profile read failed', error)
    return Response.json({ error: 'Database read failed' }, { status: 500 })
  }

  const results = []
  for (const p of profiles || []) {
    for (const { kind, endsAt } of remindersFor(p)) {
      const { data: sentRows } = await supabase
        .from('member_reminders')
        .select('stage_days')
        .eq('user_id', p.id).eq('kind', kind).eq('ends_at', endsAt)
      const stage = dueStage(kind, endsAt, new Set((sentRows || []).map(r => r.stage_days)))
      if (stage === null) continue

      const date = longDate(endsAt)
      const firstname = p.firstname || ''
      const profileUrl = base + profilePath(p)
      const mail =
        kind === 'founding' ? {
          subject: stage <= 1
            ? `Your ${p.founding_member ? 'founding' : 'complimentary'} membership ends tomorrow`
            : `Your ${p.founding_member ? 'founding' : 'complimentary'} membership ends ${date}`,
          html: foundingEndingEmailHtml({ firstname, date, stage, founding: p.founding_member, appUrl: base }),
        } : kind === 'student' ? {
          subject: stage <= 1 ? 'Your student membership ends tomorrow' : `Your student membership ends ${date}`,
          html: studentEndingEmailHtml({ firstname, date, stage, profileUrl, appUrl: base }),
        } : {
          subject: `Your free trial ends ${date}`,
          html: trialEndingEmailHtml({ firstname, date, profileUrl, appUrl: base }),
        }

      const entry = { member: [p.firstname, p.lastname].filter(Boolean).join(' '), kind, stage, ends: date, subject: mail.subject }
      if (!live) { results.push({ ...entry, sent: false, dryRun: true }); continue }

      // The auth record holds the current address; the profile copy can lag an email change.
      const { data: authUser } = await supabase.auth.admin.getUserById(p.id)
      const to = authUser?.user?.email
      if (!to) { results.push({ ...entry, sent: false, error: 'no address' }); continue }

      const { error: mailErr } = await sendMail({ to, subject: mail.subject, html: mail.html, userId: p.id })
      if (mailErr) { results.push({ ...entry, sent: false, error: 'send failed' }); continue }

      const { error: logErr } = await supabase
        .from('member_reminders')
        .upsert({ user_id: p.id, kind, ends_at: endsAt, stage_days: stage },
          { onConflict: 'user_id,kind,ends_at,stage_days', ignoreDuplicates: true })
      if (logErr) console.error('Reminder job: sent but not recorded', p.id, kind, stage, logErr)
      results.push({ ...entry, sent: true })
    }
  }

  // The owner hears about every notice that actually went out.
  const sent = results.filter(r => r.sent)
  if (live && sent.length) {
    try {
      await sendMail({
        to: 'edde@collectiveloft.com',
        subject: `Membership reminders sent: ${sent.length}`,
        html: `<p>Today's advance notices:</p><ul>${sent.map(r =>
          `<li><strong>${r.member}</strong>: ${r.kind}, ${r.stage}-day notice (ends ${r.ends})</li>`).join('')}</ul>`,
      })
    } catch (e) { console.error('Reminder job: owner summary failed', e) }
  }

  return Response.json({ live, checked: (profiles || []).length, results })
}
