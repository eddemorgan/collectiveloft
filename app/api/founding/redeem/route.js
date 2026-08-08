import { verifyCaller, serviceClient } from '../../../../lib/mailer'

// Grants founding status to a signed-in user whose email is on the allowlist.
//
// Security: founding_member and comped_until are privileged fields, so this is
// server-only and never trusts the client. It verifies the caller's session,
// looks up THEIR verified email in founding_invites, and only grants if the
// email is listed. A leaked link cannot mint founding accounts, because the
// email must already be in the allowlist that only the service role can write.
//
// Idempotent: safe to call more than once. If the caller already redeemed their
// own invite, it still reports founding:true without changing anything.
const COMP_DAYS = 90

// Launch window. Anyone who joins while the founding class is still filling
// gets their first month free, no card. They arrived early and the platform
// is still finding its feet; the comp is the thank-you for that.
// Set LAUNCH_COMP_THROUGH to null to close the window.
const LAUNCH_COMP_THROUGH = '2026-09-01T23:59:59Z'
const LAUNCH_COMP_DAYS = 30

export async function POST(request) {
  try {
    const caller = await verifyCaller(request)
    if (!caller) return Response.json({ error: 'Not signed in' }, { status: 401 })
    const { user } = caller
    const email = (user.email || '').trim().toLowerCase()
    if (!email) return Response.json({ founding: false })

    const db = serviceClient()

    const { data: invite } = await db
      .from('founding_invites')
      .select('email, redeemed_by, redeemed_at')
      .eq('email', email)
      .maybeSingle()

    // Not on the list: a normal member. Not founding, but if they arrived
    // during the launch window their first month is on us. Never overwrites an
    // existing comp, so this cannot shorten someone's access or stack.
    if (!invite) {
      const windowOpen = LAUNCH_COMP_THROUGH && Date.now() < Date.parse(LAUNCH_COMP_THROUGH)
      if (!windowOpen) return Response.json({ founding: false })

      const { data: profile } = await db
        .from('profiles')
        .select('comped_until')
        .eq('id', user.id)
        .maybeSingle()

      const alreadyComped = profile?.comped_until && new Date(profile.comped_until) > new Date()
      if (alreadyComped) return Response.json({ founding: false, launch_comp: true })

      const compedUntil = new Date(Date.now() + LAUNCH_COMP_DAYS * 24 * 60 * 60 * 1000).toISOString()
      const { error: compErr } = await db
        .from('profiles')
        .update({ comped_until: compedUntil })
        .eq('id', user.id)
      if (compErr) {
        console.error('launch comp: profile update failed', compErr)
        return Response.json({ founding: false })
      }

      return Response.json({ founding: false, launch_comp: true, comped_until: compedUntil })
    }

    // Already redeemed by someone else (email is unique, so this is defensive).
    if (invite.redeemed_by && invite.redeemed_by !== user.id) {
      return Response.json({ founding: false })
    }

    // Already redeemed by this same user: they are founding, nothing to change.
    if (invite.redeemed_by === user.id) {
      return Response.json({ founding: true, already: true })
    }

    const compedUntil = new Date(Date.now() + COMP_DAYS * 24 * 60 * 60 * 1000).toISOString()

    const { error: profErr } = await db
      .from('profiles')
      .update({ founding_member: true, comped_until: compedUntil })
      .eq('id', user.id)
    if (profErr) {
      console.error('founding redeem: profile update failed', profErr)
      return Response.json({ error: 'Could not grant founding status' }, { status: 500 })
    }

    await db
      .from('founding_invites')
      .update({ redeemed_at: new Date().toISOString(), redeemed_by: user.id })
      .eq('email', email)

    return Response.json({ founding: true, comped_until: compedUntil })
  } catch (err) {
    console.error('Founding redeem route error:', err)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
