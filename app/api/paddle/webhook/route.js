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

  // Anything that can never succeed is acknowledged, not failed. Paddle retries
  // on a non-2xx, so returning 500 for a subscription whose member no longer
  // exists would retry that event forever. Only real database trouble gets a
  // 500, because that is the case where retrying is the right thing to do.
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId || '')
  if (!isUuid) {
    console.error('Paddle webhook with missing or malformed user_id:', eventType, data.id, userId)
    return Response.json({ ok: true, skipped: 'no usable user_id' })
  }

  const { data: updated, error } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: status,
      paddle_subscription_id: data.id ? String(data.id) : null,
      paddle_customer_id: data.customer_id ? String(data.customer_id) : null,
    })
    .eq('id', userId)
    .select('id')

  if (error) {
    console.error('Paddle webhook profile update failed:', error)
    return Response.json({ error: 'Database update failed' }, { status: 500 })
  }

  if (!updated || updated.length === 0) {
    console.error('Paddle webhook for a profile that no longer exists:', eventType, userId)
    return Response.json({ ok: true, skipped: 'no such profile' })
  }

  return Response.json({ ok: true })
}
