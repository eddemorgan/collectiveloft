import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'node:crypto'

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
// The token must be checked with the anon key: the auth server rejects a user
// JWT presented alongside the service-role apikey. The service client is only
// for the privileged reads the route does after the caller is verified.
export async function verifyCaller(request) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  if (!token) return null
  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const { data: { user }, error } = await authClient.auth.getUser(token)
  if (error || !user) return null
  return { user, supabase: serviceClient() }
}

export function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'https://collectiveloft.com'
}

// The mailing address and phone the board requires in every email footer.
export const MAIL_FOOTER_ADDRESS =
  'Collective Loft · 201 West Lake St, Ste 40769, Chicago, IL 60606 · +1 708.325.8893'

// One-click unsubscribe token: HMAC over the member id, keyed on the service
// role secret, which never leaves the server. The link proves the email came
// from us without requiring the member to sign in, which is what one-click
// unsubscribe laws expect.
export function unsubscribeToken(userId) {
  return createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY)
    .update('unsub:' + userId)
    .digest('hex')
    .slice(0, 32)
}

export function unsubscribeUrl(userId) {
  return `${appUrl()}/api/marketing/unsubscribe?u=${userId}&t=${unsubscribeToken(userId)}`
}

// Sends one email from the platform's noreply sender. Replies bounce by design.
//
// Every email leaves with the mailing address and phone in the footer. Pass
// userId and it also carries a one-click unsubscribe link for marketing
// updates; the transactional email itself keeps arriving either way, and the
// footer says so honestly.
export async function sendMail({ to, subject, html, userId }) {
  if (!to) return { error: 'no recipient' }
  const unsub = userId
    ? ` · <a href="${unsubscribeUrl(userId)}" style="color:#8B6914;text-decoration:underline;">Unsubscribe from updates</a>`
    : ''
  const compliance = `
    <p style="font-size:11px;color:rgba(26,24,20,0.5);text-align:center;margin:16px 0 24px;line-height:1.7;font-family:'DM Sans',system-ui,Arial,sans-serif;">
      ${MAIL_FOOTER_ADDRESS}${unsub}
    </p>`
  const finalHtml = html.includes('</body>')
    ? html.replace('</body>', compliance + '</body>')
    : html + compliance
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: 'Collective Loft <noreply@collectiveloft.com>',
    to,
    subject,
    html: finalHtml,
  })
  if (error) {
    console.error('Resend error:', error)
    return { error }
  }
  return {}
}
