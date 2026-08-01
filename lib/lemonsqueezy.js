import crypto from 'node:crypto'

// Lemon Squeezy API helper. Membership billing only; collab payments stay on
// Stripe Connect. LS is merchant of record, so LS owns the tax side.
const API = 'https://api.lemonsqueezy.com/v1'

export function lsConfig() {
  return {
    apiKey: process.env.LEMONSQUEEZY_API_KEY,
    storeId: process.env.LEMONSQUEEZY_STORE_ID,
    variantId: process.env.LEMONSQUEEZY_VARIANT_ID,
    webhookSecret: process.env.LEMONSQUEEZY_WEBHOOK_SECRET,
  }
}

export async function lsFetch(path, { method = 'GET', body } = {}) {
  const { apiKey } = lsConfig()
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    const detail = json?.errors?.[0]?.detail || res.statusText
    throw new Error(`Lemon Squeezy ${method} ${path}: ${detail}`)
  }
  return json
}

// Creates a hosted checkout for the membership variant. custom.user_id rides
// along and comes back in every webhook as meta.custom_data.user_id.
export async function createMembershipCheckout({ userId, email, redirectUrl }) {
  const { storeId, variantId } = lsConfig()
  const json = await lsFetch('/checkouts', {
    method: 'POST',
    body: {
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email: email || undefined,
            custom: { user_id: userId },
          },
          product_options: {
            redirect_url: redirectUrl,
          },
        },
        relationships: {
          store: { data: { type: 'stores', id: String(storeId) } },
          variant: { data: { type: 'variants', id: String(variantId) } },
        },
      },
    },
  })
  return json.data.attributes.url
}

// Webhook signatures: hex HMAC-SHA256 of the raw body in the X-Signature header.
export function verifyWebhookSignature(rawBody, signature) {
  const { webhookSecret } = lsConfig()
  if (!webhookSecret || !signature) return false
  const digest = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(signature, 'hex'))
  } catch {
    return false
  }
}
