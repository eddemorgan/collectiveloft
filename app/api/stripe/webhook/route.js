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

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object
      await supabase
        .from('profiles')
        .update({ subscription_status: subscription.status })
        .eq('stripe_customer_id', subscription.customer)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      await supabase
        .from('profiles')
        .update({ subscription_status: 'cancelled' })
        .eq('stripe_customer_id', subscription.customer)
      break
    }

    // ----------------------------------------------------------------------
    // COLLABORATION PAYMENTS — a hosted Checkout payment completed.
    // Mark the ledger row succeeded, mark the milestone paid (or update the
    // lump-sum total), and recompute the collaboration's payment_status.
    // ----------------------------------------------------------------------
    case 'checkout.session.completed': {
      const session = event.data.object
      const md = session.metadata || {}

      // Only handle sessions that came from our collaboration pay route.
      // (The subscription checkout has no collab_id in metadata.)
      if (!md.collab_id) break
      if (session.payment_status !== 'paid') break

      const paymentIntentId = session.payment_intent || null

      // 1. Flip the ledger row to succeeded (matched by checkout_session_id).
      await supabase
        .from('payments')
        .update({ status: 'succeeded', stripe_payment_intent_id: paymentIntentId })
        .eq('metadata->>checkout_session_id', session.id)

      // 2. Load the collaboration to update its paid state.
      const { data: collab } = await supabase
        .from('collab_terms')
        .select('milestones, agreed_fee, amount_paid, platform_fees')
        .eq('id', md.collab_id)
        .single()

      if (!collab) break

      const paidAmount = (session.amount_total || 0) / 100
      const newAmountPaid = Number(collab.amount_paid || 0) + paidAmount

      // 3. If this was a milestone payment, mark that milestone paid in the jsonb.
      let milestones = Array.isArray(collab.milestones) ? collab.milestones : []
      if (md.milestone_index !== '' && md.milestone_index !== undefined && md.milestone_index !== null) {
        const idx = parseInt(md.milestone_index, 10)
        if (!Number.isNaN(idx) && milestones[idx]) {
          milestones = milestones.map((m, i) =>
            i === idx ? { ...m, paid: true, paid_at: new Date().toISOString(), payment_intent_id: paymentIntentId } : m
          )
        }
      }

      // 4. Recompute overall payment_status against the agreed fee.
      const agreedFee = Number(collab.agreed_fee || 0)
      let payment_status = 'partial'
      if (agreedFee > 0 && newAmountPaid >= agreedFee - 0.005) payment_status = 'paid'
      else if (newAmountPaid <= 0) payment_status = 'unpaid'

      await supabase
        .from('collab_terms')
        .update({
          milestones,
          amount_paid: newAmountPaid,
          payment_status,
        })
        .eq('id', md.collab_id)

      break
    }

    default:
      break
  }

  return Response.json({ received: true })
}
