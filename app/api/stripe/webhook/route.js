import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(req) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    return Response.json({ error: err.message }, { status: 400 })
  }

  const subscription = event.data.object

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await supabase
        .from('profiles')
        .update({ subscription_status: subscription.status })
        .eq('stripe_customer_id', subscription.customer)
      break

    case 'customer.subscription.deleted':
      await supabase
        .from('profiles')
        .update({ subscription_status: 'cancelled' })
        .eq('stripe_customer_id', subscription.customer)
      break

    default:
      break
  }

  return Response.json({ received: true })
}