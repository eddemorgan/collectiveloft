import { serviceClient, unsubscribeToken } from '../../../../lib/mailer'

// One-click marketing unsubscribe. No login required: the HMAC token in the
// link proves the request came from an email we sent to this member. Turning
// marketing off is the only thing this route can do, so the worst a forged
// link could ever achieve is unsubscribing someone, and the token prevents
// even that.
export async function GET(request) {
  const url = new URL(request.url)
  const userId = url.searchParams.get('u') || ''
  const token = url.searchParams.get('t') || ''

  const ok =
    /^[0-9a-f-]{36}$/i.test(userId) &&
    token.length === 32 &&
    token === unsubscribeToken(userId)

  const page = (title, body) =>
    new Response(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title></head>
<body style="margin:0;background:#F0ECE3;color:#1A1814;font-family:system-ui,Arial,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px;">
<div style="max-width:420px;text-align:center;">
<div style="color:#8B6914;font-size:20px;margin-bottom:12px;">&#10022;</div>
<h1 style="font-family:Georgia,serif;font-weight:600;font-size:26px;margin:0 0 12px;">${title}</h1>
<p style="font-size:15px;line-height:1.7;color:rgba(26,24,20,0.7);margin:0;">${body}</p>
</div></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )

  if (!ok) {
    return page('That link did not check out', 'The unsubscribe link looks incomplete or expired. You can also manage updates from your profile, or write to hello@collectiveloft.com and we will sort it by hand.')
  }

  const db = serviceClient()
  const { error } = await db
    .from('profiles')
    .update({ marketing_opt_in: false, marketing_unsub_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) {
    console.error('unsubscribe failed:', error)
    return page('Something went wrong', 'We could not process that just now. Write to hello@collectiveloft.com and we will take care of it.')
  }

  return page('You are unsubscribed', 'No more update emails from Collective Loft. Emails about your own account and collaborations still arrive, because the platform cannot work without them. Changed your mind? Tick the updates box in your profile any time.')
}
