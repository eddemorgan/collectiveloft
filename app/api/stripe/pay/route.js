import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Your platform's cut of each paid collaboration.
const PLATFORM_FEE_RATE = 0.05  // 5%

// --------------------------------------------------------------------------
// POST /api/stripe/pay
// Body: { collabId, userId, milestoneIndex|null, savePaymentMethod }
//   - milestoneIndex = number -> pay one milestone (agreed_fee * pct/100)
//   - milestoneIndex = null   -> pay the full agreed_fee (lump sum / on delivery)
//
// Creates a hosted Stripe Checkout Session (payment mode) that routes money to
// the recipient's connected account, with your 5% taken as the application fee.
// Returns { url } to redirect the payer to Stripe's hosted page — same pattern
// as the subscription checkout route.
// --------------------------------------------------------------------------
export async function POST(req) {
  try {
    const { collabId, userId, milestoneIndex = null, savePaymentMethod = false } = await req.json()

    if (!collabId || !userId) {
      return Response.json({ error: 'Missing collabId or userId' }, { status: 400 })
    }

    // 1. Load the collaboration (source of truth for amounts and parties).
    const { data: collab, error: collabErr } = await supabase
      .from('collab_terms')
      .select('*')
      .eq('id', collabId)
      .single()

    if (collabErr || !collab) {
      return Response.json({ error: 'Collaboration not found' }, { status: 404 })
    }

    // 2. Only PAID collaborations can be paid.
    if (collab.collab_type !== 'paid') {
      return Response.json({ error: 'This collaboration is not a paid type' }, { status: 400 })
    }

    // 3. AUTHORIZATION — only the payer (initiator / collab owner) may pay.
    if (collab.initiator_id !== userId) {
      return Response.json({ error: 'Only the collaboration owner can make payments' }, { status: 403 })
    }
    const recipientId = collab.partner_id
    if (!recipientId) {
      return Response.json({ error: 'No recipient on this collaboration' }, { status: 400 })
    }

    // 4. Recipient must have an onboarded Stripe Connect account.
    const { data: recipient, error: recipErr } = await supabase
      .from('profiles')
      .select('stripe_connect_id, connect_onboarded, firstname, lastname')
      .eq('id', recipientId)
      .single()

    if (recipErr || !recipient) {
      return Response.json({ error: 'Recipient profile not found' }, { status: 404 })
    }
    if (!recipient.connect_onboarded || !recipient.stripe_connect_id) {
      return Response.json({
        error: 'recipient_not_ready',
        message: `${recipient.firstname || 'This collaborator'} needs to set up their payout account before they can be paid.`,
      }, { status: 409 })
    }

    // 5. Compute the amount SERVER-SIDE. Never trust an amount from the browser.
    const agreedFee = Number(collab.agreed_fee)
    if (!agreedFee || agreedFee <= 0) {
      return Response.json({ error: 'No valid agreed fee on this collaboration' }, { status: 400 })
    }

    const milestones = Array.isArray(collab.milestones) ? collab.milestones : []
    let amount
    let label

    if (milestoneIndex === null) {
      const alreadyPaid = Number(collab.amount_paid || 0)
      amount = Math.max(0, agreedFee - alreadyPaid)
      label = 'Full payment'
      if (amount <= 0) {
        return Response.json({ error: 'This collaboration is already fully paid' }, { status: 409 })
      }
    } else {
      const m = milestones[milestoneIndex]
      if (!m) {
        return Response.json({ error: 'Milestone not found' }, { status: 404 })
      }
      if (m.paid) {
        return Response.json({ error: 'This milestone has already been paid' }, { status: 409 })
      }
      const pct = Number(m.pct)
      if (!pct || pct <= 0) {
        return Response.json({ error: 'Milestone has no valid percentage' }, { status: 400 })
      }
      amount = Math.round(agreedFee * (pct / 100) * 100) / 100
      label = m.desc || `Milestone ${milestoneIndex + 1}`
    }

    const amountCents = Math.round(amount * 100)
    const feeCents    = Math.round(amountCents * PLATFORM_FEE_RATE)

    // 6. Look up / create the payer's Stripe customer (matches checkout route).
    const { data: payer } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, firstname, lastname')
      .eq('id', userId)
      .single()

    let customerId = payer?.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: payer?.email || undefined,
        name: `${payer?.firstname || ''} ${payer?.lastname || ''}`.trim() || undefined,
        metadata: { supabase_user_id: userId },
      })
      customerId = customer.id
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId)
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL

    // Metadata so the webhook can mark the right milestone/collab paid.
    const sharedMetadata = {
      collab_id: collabId,
      payer_id: userId,
      recipient_id: recipientId,
      milestone_index: milestoneIndex === null ? '' : String(milestoneIndex),
      label,
    }

    // The payment intent behind the session: destination charge + 5% app fee,
    // and (optionally) save the card for future milestone payments.
    const paymentIntentData = {
      application_fee_amount: feeCents,
      transfer_data: { destination: recipient.stripe_connect_id },
      metadata: sharedMetadata,
      description: `Collective Loft · ${collab.project_title || 'Collaboration'} · ${label}`,
    }
    if (savePaymentMethod) {
      paymentIntentData.setup_future_usage = 'off_session'
    }

    // 7. Create the hosted Checkout Session (payment mode).
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: amountCents,
          product_data: {
            name: `${collab.project_title || 'Collaboration'} — ${label}`,
            description: `Payment to ${recipient.firstname || 'collaborator'} via Collective Loft`,
          },
        },
        quantity: 1,
      }],
      payment_intent_data: paymentIntentData,
      metadata: sharedMetadata,
      success_url: `${baseUrl}/studio/${collabId}?paid=1`,
      cancel_url: `${baseUrl}/studio/${collabId}?pay_cancelled=1`,
    })

    // 8. Record a pending payment in the ledger. The webhook flips it to
    //    succeeded and marks the milestone/collab paid once the charge clears.
    await supabase.from('payments').insert({
      collab_id: collabId,
      payer_id: userId,
      recipient_id: recipientId,
      milestone_index: milestoneIndex,
      amount,
      platform_fee: feeCents / 100,
      stripe_payment_intent_id: null,  // filled in by the webhook from the session
      status: 'pending',
      metadata: { label, checkout_session_id: session.id },
    })

    return Response.json({ url: session.url })

  } catch (err) {
    console.error('Payment route error:', err)
    return Response.json({ error: err.message || 'Payment failed to initialize' }, { status: 500 })
  }
}
