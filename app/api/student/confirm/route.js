import { createHash } from 'node:crypto'
import { verifyCaller } from '../../../../lib/mailer'
import { eduDomain, STUDENT_MEMBERSHIP_DAYS, CODE_MAX_ATTEMPTS } from '../../../../lib/students'

// Turns a correct code into a year of student membership.
//
// Checks the newest unused code for the caller: unexpired, under the attempt
// cap, hash matches. On success the code is burned (used_at) and the profile
// gets student_until a year out. On failure the attempt counter climbs so five
// wrong guesses kill the code. Grants are server-only, exactly like
// comped_until: the protect_privileged_profiles trigger blocks the client
// path, this route with the service role is the only door.
//
// Idempotent in effect: confirming again with a fresh code simply moves
// student_until forward, which is precisely what annual re-verification is.

export async function POST(request) {
  try {
    const caller = await verifyCaller(request)
    if (!caller) return Response.json({ error: 'Not signed in' }, { status: 401 })
    const { user, supabase: db } = caller

    const domain = eduDomain(user.email)
    if (!domain) {
      return Response.json(
        { error: 'Student membership needs a .edu sign-in email.' },
        { status: 400 }
      )
    }

    let body = {}
    try { body = await request.json() } catch { /* handled below */ }
    const code = String(body.code || '').trim()
    if (!/^\d{6}$/.test(code)) {
      return Response.json({ error: 'Enter the six-digit code from your email.' }, { status: 400 })
    }

    const { data: v } = await db
      .from('student_verifications')
      .select('id, code_hash, expires_at, attempts, used_at')
      .eq('user_id', user.id)
      .is('used_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!v || new Date(v.expires_at) < new Date() || v.attempts >= CODE_MAX_ATTEMPTS) {
      return Response.json(
        { error: 'That code has expired. Request a new one.' },
        { status: 400 }
      )
    }

    const codeHash = createHash('sha256').update(code).digest('hex')
    if (codeHash !== v.code_hash) {
      await db
        .from('student_verifications')
        .update({ attempts: v.attempts + 1 })
        .eq('id', v.id)
      const left = CODE_MAX_ATTEMPTS - v.attempts - 1
      return Response.json(
        { error: left > 0 ? 'Wrong code. Check the email and try again.' : 'That code has expired. Request a new one.' },
        { status: 400 }
      )
    }

    const studentUntil = new Date(
      Date.now() + STUDENT_MEMBERSHIP_DAYS * 24 * 60 * 60 * 1000
    ).toISOString()
    const now = new Date().toISOString()

    const { error: profErr } = await db
      .from('profiles')
      .update({
        student_until: studentUntil,
        student_domain: domain,
        student_verified_at: now,
      })
      .eq('id', user.id)
    if (profErr) {
      console.error('student confirm: profile update failed', profErr)
      return Response.json({ error: 'Could not grant student membership' }, { status: 500 })
    }

    await db.from('student_verifications').update({ used_at: now }).eq('id', v.id)

    return Response.json({ student: true, student_until: studentUntil })
  } catch (err) {
    console.error('Student confirm route error:', err)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
