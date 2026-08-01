import { createClient } from '@supabase/supabase-js'
import { verifyWebhookSignature } from '../../../../lib/lemonsqueezy'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// LS statuses land almost verbatim in profiles.subscription_status.
// on_trial maps to 'trialing' because that is the word SubscriptionGuard and
// the rest of the app already speak. 'cancelled' stays admitted by the guard
// until the subscription_expired event closes the door: LS flips to cancelled
// the moment someone cancels, but the member has paid through the period.
const STATUS_MAP = {
  on_trial: 'trialing',
  active: 'active',
  paused: 'paused',
  past_due: 'past_due',
  unpaid: 'unpaid',
  cancelled: 'cancelled',
  expired: 'expired',
}

const SUBSCRIPTION_EVENTS = new Set([
  'subscription_created',
  'subscription_updated',
  'subscription_resumed',
  'subscription_cancelled',
  'subscription_expired',
  'subscription_paused',
  'subscription_unpaused',
])

export async function POST(req) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-signature')

  if (!verifyWebhookSignature(rawBody, signature)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return Response.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const eventName = payload?.meta?.event_name
  if (!SUBSCRIPTION_EVENTS.has(eventName)) {
    return Response.json({ ok: true, skipped: eventName })
  }

  const userId = payload?.meta?.custom_data?.user_id
  const attributes = payload?.data?.attributes || {}
  const subscriptionId = payload?.data?.id
  const status = STATUS_MAP[attributes.status] || attributes.status

  if (!userId) {
    console.error('LS webhook without user_id custom data:', eventName, subscriptionId)
    return Response.json({ ok: true, skipped: 'no user_id' })
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: status,
      lemonsqueezy_subscription_id: subscriptionId ? String(subscriptionId) : null,
      lemonsqueezy_customer_id: attributes.customer_id ? String(attributes.customer_id) : null,
    })
    .eq('id', userId)

  if (error) {
    console.error('LS webhook profile update failed:', error)
    return Response.json({ error: 'Database update failed' }, { status: 500 })
  }

  return Response.json({ ok: true })
}
