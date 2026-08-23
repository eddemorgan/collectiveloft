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

// Money events. Without these a real charge left no trace in this database at
// all: subscription.* tells us what a member is entitled to, never whether
// they actually paid. transaction.completed is revenue, payment_failed is the
// start of dunning, and both belong in the ledger.
const TRANSACTION_EVENTS = new Set([
  'transaction.completed',
  'transaction.payment_failed',
])

// Paddle sends money as a string of minor units. Most currencies are hundredths,
// but a few have no fractional part at all, and dividing those by 100 would
// under-report a charge by two orders of magnitude.
const ZERO_DECIMAL = new Set(['JPY', 'KRW', 'VND', 'CLP', 'ISK', 'HUF', 'TWD'])

function toMajorUnits(minor, currency) {
  if (minor === null || minor === undefined || minor === '') return null
  const n = Number(minor)
  if (!Number.isFinite(n)) return null
  return ZERO_DECIMAL.has(String(currency || '').toUpperCase()) ? n : n / 100
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// A renewal transaction usually carries the subscription's custom_data, but not
// always, and a member who signed up before custom_data existed would have none.
// The Paddle ids already stored on the profile are the fallback, so a payment is
// still attributed to the right person when custom_data is missing.
async function resolveUserId(data) {
  const fromCustom = data?.custom_data?.user_id
  if (UUID_RE.test(fromCustom || '')) return fromCustom

  const subId = data?.subscription_id ? String(data.subscription_id) : null
  if (subId) {
    const { data: bySub } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('paddle_subscription_id', subId)
      .maybeSingle()
    if (bySub?.id) return bySub.id
  }

  const custId = data?.customer_id ? String(data.customer_id) : null
  if (custId) {
    const { data: byCust } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('paddle_customer_id', custId)
      .maybeSingle()
    if (byCust?.id) return byCust.id
  }

  return null
}

async function handleTransaction(eventType, data) {
  const txnId = data?.id ? String(data.id) : null
  if (!txnId) {
    console.error('Paddle transaction event with no transaction id:', eventType)
    return Response.json({ ok: true, skipped: 'no transaction id' })
  }

  const totals = data?.details?.totals || {}
  const currency = totals.currency_code || data?.currency_code || null
  const userId = await resolveUserId(data)

  if (!userId) {
    // Recorded anyway, unattributed. Losing the record of a real charge because
    // we could not match a member would be worse than an orphan row, and the
    // row is what makes the mismatch visible at all.
    console.error('Paddle transaction could not be attributed to a member:', eventType, txnId)
  }

  const row = {
    user_id: userId,
    paddle_transaction_id: txnId,
    paddle_subscription_id: data?.subscription_id ? String(data.subscription_id) : null,
    paddle_customer_id: data?.customer_id ? String(data.customer_id) : null,
    status: eventType === 'transaction.payment_failed' ? 'payment_failed' : (data?.status || 'completed'),
    amount: toMajorUnits(totals.total, currency),
    tax: toMajorUnits(totals.tax, currency),
    currency,
    occurred_at: data?.billed_at || data?.updated_at || data?.created_at || new Date().toISOString(),
    raw: data || null,
  }

  // Paddle retries anything that is not a 2xx, so the same transaction can
  // arrive more than once. The unique id turns a retry into an update.
  const { error } = await supabaseAdmin
    .from('membership_payments')
    .upsert(row, { onConflict: 'paddle_transaction_id' })

  if (error) {
    console.error('Paddle transaction ledger write failed:', error)
    return Response.json({ error: 'Database update failed' }, { status: 500 })
  }

  return Response.json({ ok: true, recorded: txnId, attributed: Boolean(userId) })
}

async function handleSubscription(eventType, data) {
  const userId = data?.custom_data?.user_id
  const status = STATUS_MAP[data.status] || data.status

  // Anything that can never succeed is acknowledged, not failed. Paddle retries
  // on a non-2xx, so returning 500 for a subscription whose member no longer
  // exists would retry that event forever. Only real database trouble gets a
  // 500, because that is the case where retrying is the right thing to do.
  if (!UUID_RE.test(userId || '')) {
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
  const data = payload?.data || {}

  if (TRANSACTION_EVENTS.has(eventType)) return handleTransaction(eventType, data)
  if (SUBSCRIPTION_EVENTS.has(eventType)) return handleSubscription(eventType, data)

  return Response.json({ ok: true, skipped: eventType })
}
