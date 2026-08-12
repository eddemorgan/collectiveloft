import { createClient } from '@supabase/supabase-js'
import { verifyWebhookSignature, STATUS_MAP } from '../../../../lib/paddle'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const SUBSCRIPTION_EVENTS = new Set([
  'subscription.created',
  'subscription.updated',
  'subscription.activated',
  'subscription.canceled',
  'subscription.paused',
  'subscription.resumed',
  'subscription.trialing',
  'subscription.past_due',
])

export async function POST(req) {
  const rawBody = await req.text()
  const signature = req.headers.get('paddle-signature')

  if (!verifyWebhookSignature(rawBody, signature)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return Response.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const eventType = payload?.event_type
  if (!SUBSCRIPTION_EVENTS.has(eventType)) {
    return Response.json({ ok: true, skipped: eventType })
  }

  const data = payload?.data || {}
  const userId = data?.custom_data?.user_id
  const status = STATUS_MAP[data.status] || data.status

  if (!userId) {
    console.error('Paddle webhook without user_id custom data:', eventType, data.id)
    return Response.json({ ok: true, skipped: 'no user_id' })
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: status,
      paddle_subscription_id: data.id ? String(data.id) : null,
      paddle_customer_id: data.customer_id ? String(data.customer_id) : null,
    })
    .eq('id', userId)

  if (error) {
    console.error('Paddle webhook profile update failed:', error)
    return Response.json({ error: 'Database update failed' }, { status: 500 })
  }

  return Response.json({ ok: true })
}
