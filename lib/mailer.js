import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

// Shared plumbing for transactional email routes.
//
// Security model: the caller never chooses the recipient. Each route verifies
// the caller's session, loads the relevant row with the service key, confirms
// the caller is a legitimate party to that row, and derives the recipient from
// the database. That way a leaked route URL cannot be used to mail strangers.

export function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

// Verifies the bearer token on a request. Returns { user, supabase } or null.
export async function verifyCaller(request) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  if (!token) return null
  const supabase = serviceClient()
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return { user, supabase }
}

export function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'https://collectiveloft.com'
}

// Sends one email from the platform's noreply sender. Replies bounce by design.
export async function sendMail({ to, subject, html }) {
  if (!to) return { error: 'no recipient' }
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: 'Collective Loft <noreply@collectiveloft.com>',
    to,
    subject,
    html,
  })
  if (error) {
    console.error('Resend error:', error)
    return { error }
  }
  return {}
}
