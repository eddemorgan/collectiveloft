import { createHash, randomInt } from 'node:crypto'
import { verifyCaller, sendMail, appUrl } from '../../../../lib/mailer'
import { eduDomain, CODE_TTL_MINUTES } from '../../../../lib/students'
import { studentVerifyEmailHtml } from '../../../../lib/emails'

// Sends a six-digit verification code to the caller's own .edu address.
//
// Security model, same shape as founding redeem: the caller never chooses the
// recipient. The code goes to the verified email on the caller's session and
// nowhere else, so the route proves inbox ownership rather than trusting a
// typed address. Codes are stored hashed; the plaintext exists only inside the
// email. Follows the same server-only rule as comped_until: the client asks,
// the server decides.
//
// Rate limited to 3 sends per hour per user, because a code sender with no
// brake is a free email cannon pointed at any inbox the caller controls.
const MAX_SENDS_PER_HOUR = 3

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

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await db
      .from('student_verifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', hourAgo)
    if ((count || 0) >= MAX_SENDS_PER_HOUR) {
      return Response.json(
        { error: 'Too many codes requested. Try again in an hour.' },
        { status: 429 }
      )
    }

    const code = String(randomInt(0, 1000000)).padStart(6, '0')
    const codeHash = createHash('sha256').update(code).digest('hex')
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString()

    const { error: insertErr } = await db.from('student_verifications').insert({
      user_id: user.id,
      email: user.email,
      code_hash: codeHash,
      expires_at: expiresAt,
    })
    if (insertErr) {
      console.error('student request: insert failed', insertErr)
      return Response.json({ error: 'Could not create a code' }, { status: 500 })
    }

    const { error: mailErr } = await sendMail({
      to: user.email,
      subject: `${code} is your Collective Loft student code`,
      html: studentVerifyEmailHtml({ code, appUrl: appUrl() }),
    })
    if (mailErr) {
      console.error('student request: send failed', mailErr)
      return Response.json({ error: 'Could not send the code' }, { status: 500 })
    }

    return Response.json({ sent: true, ttl_minutes: CODE_TTL_MINUTES })
  } catch (err) {
    console.error('Student request route error:', err)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
