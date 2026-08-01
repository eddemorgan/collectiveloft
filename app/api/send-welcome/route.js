import { verifyCaller, sendMail, appUrl } from '../../../lib/mailer'
import { welcomeEmailHtml } from '../../../lib/emails'

// Sends the welcome email to the signed-in caller only.
// Guarded: requires a valid session token, sends only to the caller's own
// address, and only within 24 hours of account creation.
export async function POST(request) {
  try {
    const caller = await verifyCaller(request)
    if (!caller) return Response.json({ error: 'Not signed in' }, { status: 401 })
    const { user, supabase } = caller

    if (!user.email) return Response.json({ error: 'No address' }, { status: 400 })

    const accountAgeMs = Date.now() - new Date(user.created_at).getTime()
    if (accountAgeMs > 24 * 60 * 60 * 1000) {
      return Response.json({ ok: true, skipped: 'account is not new' })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('firstname, lastname, founding_member')
      .eq('id', user.id)
      .single()

    const { error } = await sendMail({
      to: user.email,
      subject: 'Welcome to Collective Loft. Your people are here.',
      html: welcomeEmailHtml({ firstname: profile?.firstname || '', appUrl: appUrl() }),
    })

    // Owner notification: fire-and-forget, never blocks the member's welcome.
    const name = [profile?.firstname, profile?.lastname].filter(Boolean).join(' ') || 'No name yet'
    sendMail({
      to: 'edde@collectiveloft.com',
      subject: `New member: ${name}${profile?.founding_member ? ' (founding)' : ''}`,
      html: `<p><strong>${name}</strong> just signed up.</p>
<p>Email: ${user.email}<br>
Founding member: ${profile?.founding_member ? 'yes' : 'no'}<br>
Signed up: ${new Date(user.created_at).toUTCString()}</p>
<p><a href="${appUrl()}/discover">See who's in the loft</a></p>`,
    }).catch(e => console.error('Owner signup notification failed:', e))

    if (error) return Response.json({ error: 'Email failed to send' }, { status: 500 })
    return Response.json({ ok: true })
  } catch (err) {
    console.error('Welcome email route error:', err)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
