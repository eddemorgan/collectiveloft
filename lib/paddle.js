import crypto from 'node:crypto'

// Paddle Billing helper. Membership billing only; collab payments stay on
// Stripe Connect. Paddle is merchant of record, so Paddle owns the tax side.
//
// PADDLE_ENV picks the API host: 'sandbox' while testing, 'production' when
// live. The keys are environment specific too, so both move together.
export function paddleConfig() {
  const env = process.env.PADDLE_ENV === 'production' ? 'production' : 'sandbox'
  return {
    env,
    apiBase: env === 'production' ? 'https://api.paddle.com' : 'https://sandbox-api.paddle.com',
    apiKey: process.env.PADDLE_API_KEY,
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID,
    webhookSecret: process.env.PADDLE_WEBHOOK_SECRET,
  }
}

export async function paddleFetch(path, { method = 'GET', body } = {}) {
  const { apiBase, apiKey } = paddleConfig()
  const res = await fetch(`${apiBase}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    const detail = json?.error?.detail || res.statusText
    throw new Error(`Paddle ${method} ${path}: ${detail}`)
  }
  return json
}

// Paddle signs webhooks with a header shaped `ts=<unix>;h1=<hex hmac>`, where
// the signed payload is `<ts>:<raw body>`. The timestamp is part of what is
// signed, so an attacker cannot replay an old body under a fresh timestamp.
export function verifyWebhookSignature(rawBody, signatureHeader, maxAgeSeconds = 300) {
  const { webhookSecret } = paddleConfig()
  if (!webhookSecret || !signatureHeader) return false

  const parts = Object.fromEntries(
    signatureHeader.split(';').map(p => {
      const i = p.indexOf('=')
      return i === -1 ? [p, ''] : [p.slice(0, i).trim(), p.slice(i + 1).trim()]
    })
  )
  const ts = parts.ts
  const h1 = parts.h1
  if (!ts || !h1) return false

  // Reject stale signatures so a captured request cannot be replayed later.
  const age = Math.abs(Date.now() / 1000 - Number(ts))
  if (!Number.isFinite(age) || age > maxAgeSeconds) return false

  const digest = crypto
    .createHmac('sha256', webhookSecret)
    .update(`${ts}:${rawBody}`)
    .digest('hex')

  try {
    return crypto.timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(h1, 'hex'))
  } catch {
    return false
  }
}

// Paddle's subscription statuses, mapped to the words the rest of the app
// already speaks. 'canceled' becomes 'cancelled' because SubscriptionGuard
// admits that spelling during the paid-through grace period.
export const STATUS_MAP = {
  trialing: 'trialing',
  active: 'active',
  past_due: 'past_due',
  paused: 'paused',
  canceled: 'cancelled',
}
