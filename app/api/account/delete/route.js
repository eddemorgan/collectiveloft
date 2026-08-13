import { createClient } from '@supabase/supabase-js'
import { verifyCaller, serviceClient, sendMail, appUrl } from '../../../../lib/mailer'
import { accountClosedEmailHtml } from '../../../../lib/emails'
import { paddleFetch } from '../../../../lib/paddle'

// Closes the caller's own account.
//
// Anonymize, do not erase. Collaboration records, terms, messages, ratings and
// the shared files inside a Loft Studio are the other party's history too:
// deleting them would tear holes in someone else's reputation. So the person
// is scrubbed out and the work stands, attributed to a former member.
//
// Security: the account closed is always the caller's own, taken from their
// verified session. No id is read from the request body.

// Personal media. Shared studio files are deliberately absent from this list.
const PERSONAL_BUCKETS = [
  'avatars',
  'covers',
  'portfolio-images',
  'portfolio-video',
  'portfolio-audio',
  'portfolio-docs',
]

export async function POST(request) {
  try {
    const caller = await verifyCaller(request)
    if (!caller) return Response.json({ error: 'Not signed in' }, { status: 401 })
    const userId = caller.user.id
    const callerEmail = (caller.user.email || '').trim().toLowerCase()

    const { email, password, reason } = await request.json().catch(() => ({}))

    if (!reason || !String(reason).trim()) {
      return Response.json({ error: 'Please tell us why you are leaving.' }, { status: 400 })
    }

    // The address typed must be the caller's own, so a mistyped or someone
    // else's account cannot be closed by accident.
    if ((email || '').trim().toLowerCase() !== callerEmail) {
      return Response.json({ error: 'That email does not match this account.' }, { status: 400 })
    }

    // Re-authenticate server side. A live session is not enough on its own for
    // something irreversible: this stops an unattended laptop from being used
    // to close someone's account.
    const authCheck = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    const { data: reauth, error: reauthErr } = await authCheck.auth.signInWithPassword({
      email: callerEmail,
      password: password || '',
    })
    if (reauthErr || reauth?.user?.id !== userId) {
      return Response.json({ error: 'That password is not correct.' }, { status: 401 })
    }

    const db = serviceClient()

    const { data: profile } = await db
      .from('profiles')
      .select('paddle_subscription_id, deleted_at, firstname')
      .eq('id', userId)
      .maybeSingle()

    if (profile?.deleted_at) {
      return Response.json({ ok: true, already: true })
    }

    // Stop the billing relationship first. If this fails the account still
    // closes, because a member who asked to leave should not be held open by
    // a payment provider hiccup; the subscription is logged for follow-up.
    if (profile?.paddle_subscription_id) {
      try {
        await paddleFetch(`/subscriptions/${profile.paddle_subscription_id}/cancel`, {
          method: 'POST',
          body: { effective_from: 'immediately' },
        })
      } catch (e) {
        console.error('account delete: paddle cancel failed', profile.paddle_subscription_id, e.message)
      }
    }

    // Remove personal media. Studio files stay: they belong to the collaboration.
    for (const bucket of PERSONAL_BUCKETS) {
      try {
        const { data: files } = await db.storage.from(bucket).list(userId, { limit: 1000 })
        if (files && files.length) {
          await db.storage.from(bucket).remove(files.map(f => `${userId}/${f.name}`))
        }
      } catch (e) {
        console.error(`account delete: could not clear ${bucket}`, e.message)
      }
    }

    // Confirmation goes out before the address is scrubbed, since afterwards
    // there is nowhere left to send it. Awaited, because an un-awaited send
    // dies when the function freezes on response.
    try {
      await sendMail({
        to: callerEmail,
        subject: 'Your Collective Loft account is closed',
        html: accountClosedEmailHtml({ firstname: profile?.firstname || '', appUrl: appUrl() }),
      })
    } catch (e) {
      console.error('account delete: confirmation email failed', e)
    }

    // Personal content goes. Anything that is only theirs and would otherwise
    // linger under a former member's name: portfolio pieces, briefs still
    // soliciting collaborators, their applications, their notifications.
    // Collaborations, terms, ratings, studios and studio messages are
    // deliberately untouched, because they are the other party's record too.
    for (const [table, column] of [
      ['portfolio_items', 'profile_id'],
      ['applications', 'applicant_id'],
      ['briefs', 'poster_id'],
      ['notifications', 'user_id'],
    ]) {
      const { error: delErr } = await db.from(table).delete().eq(column, userId)
      if (delErr) console.error(`account delete: could not clear ${table}`, delErr.message)
    }

    // Scrub the person. Name becomes the label the rest of the app renders,
    // so existing collaboration views show "Former Member" with no changes.
    const { error: scrubErr } = await db
      .from('profiles')
      .update({
        deleted_at: new Date().toISOString(),
        closure_reason: String(reason).slice(0, 500),
        firstname: 'Former',
        lastname: 'Member',
        email: null,
        headline: null,
        bio: null,
        rightnow: null,
        country: null,
        state: null,
        city: null,
        latitude: null,
        longitude: null,
        disciplines: null,
        skills: null,
        seeking: null,
        seeking_disciplines: null,
        seeking_skills: null,
        skill_ratings: null,
        compensation: null,
        location_preference: null,
        availability: null,
        website: null,
        instagram: null,
        soundcloud: null,
        other_link: null,
        portfolio_link: null,
        portfolio_types: null,
        avatar_url: null,
        cover_url: null,
        stripe_customer_id: null,
        stripe_connect_id: null,
        connect_onboarded: false,
        paddle_customer_id: null,
        paddle_subscription_id: null,
        subscription_status: 'deleted',
        comped_until: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (scrubErr) {
      console.error('account delete: scrub failed', scrubErr)
      return Response.json({ error: 'Could not close the account' }, { status: 500 })
    }

    // Disable the login rather than deleting the auth user. Deleting it
    // cascades to the profile row, and studios, ratings, collab_terms and
    // messages all point at that row: for anyone who has collaborated the
    // delete fails outright, and for anyone who has not it destroys the row
    // that was supposed to survive as the former member. So the identity is
    // stripped from auth and the account is banned instead.
    const closedAddress = `closed-${userId}@deleted.collectiveloft.com`
    const { error: authErr } = await db.auth.admin.updateUserById(userId, {
      email: closedAddress,
      password: crypto.randomUUID() + crypto.randomUUID(),
      ban_duration: '876000h', // a century; Supabase has no permanent ban
      user_metadata: {},
    })
    if (authErr) {
      console.error('account delete: could not disable login', authErr)
      return Response.json({ error: 'Could not fully close the account' }, { status: 500 })
    }

    return Response.json({ ok: true })
  } catch (err) {
    console.error('Account delete route error:', err)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
