import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { welcomeEmailHtml } from '../../../lib/emails'

// Sends the welcome email to the signed-in caller only.
// Guarded: requires a valid session token, sends only to the caller's own
// address, and only within 24 hours of account creation.
export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (!token) {
      return Response.json({ error: 'Not signed in' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user?.email) {
      return Response.json({ error: 'Not signed in' }, { status: 401 })
    }

    const accountAgeMs = Date.now() - new Date(user.created_at).getTime()
    if (accountAgeMs > 24 * 60 * 60 * 1000) {
      return Response.json({ ok: true, skipped: 'account is not new' })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('firstname')
      .eq('id', user.id)
      .single()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://collectiveloft.com'
    const resend = new Resend(process.env.RESEND_API_KEY)

    const { error } = await resend.emails.send({
      from: 'Collective Loft <noreply@collectiveloft.com>',
      to: user.email,
      subject: 'Welcome to Collective Loft. Your people are here.',
      html: welcomeEmailHtml({ firstname: profile?.firstname || '', appUrl }),
    })

    if (error) {
      console.error('Resend error:', error)
      return Response.json({ error: 'Email failed to send' }, { status: 500 })
    }

    return Response.json({ ok: true })
  } catch (err) {
    console.error('Welcome email route error:', err)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
