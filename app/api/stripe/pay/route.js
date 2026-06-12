import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Your platform's cut of each paid collaboration.
const PLATFORM_FEE_RATE = 0.05  // 5%

// --------------------------------------------------------------------------
// POST /api/stripe/pay
// Body: { collabId, userId, milestoneIndex|null, savePaymentMethod (bool) }
//   - milestoneIndex = number  -> pay one milestone (amount = agreed_fee * pct/100)
//   - milestoneIndex = null    -> pay the full agreed_fee (lump sum / on-delivery)
//
// Returns a Stripe PaymentIntent client_secret for the browser to confirm with
// the card element. The actual money only moves when the client confirms.
// --------------------------------------------------------------------------
export async function POST(req) {
  try {
    const { collabId, userId, milestoneIndex = null, savePaymentMethod = false } = await req.json()

    if (!collabId || !userId) {
      return Response.json({ error: 'Missing collabId or userId' }, { status: 400 })
    }

    // 1. Load the collaboration (the source of truth for amounts and parties).
    const { data: collab, error: collabErr } = await supabaseAdmin
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
    const { data: recipient, error: recipErr } = await supabaseAdmin
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
    let amount  // in dollars
    let label

    if (milestoneIndex === null) {
      // Lump sum — pay the full fee minus anything already paid.
      const alreadyPaid = Number(collab.amount_paid || 0)
      amount = Math.max(0, agreedFee - alreadyPaid)
      label = 'Full payment'
      if (amount <= 0) {
        return Response.json({ error: 'This collaboration is already fully paid' }, { status: 409 })
      }
    } else {
      // Milestone payment.
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
      // Round to cents to avoid floating-point drift.
      amount = Math.round(agreedFee * (pct / 100) * 100) / 100
      label = m.desc || `Milestone ${milestoneIndex + 1}`
    }

    // 6. Compute amounts in cents for Stripe.
    const amountCents = Math.round(amount * 100)
    const feeCents    = Math.round(amountCents * PLATFORM_FEE_RATE)

    // 7. Look up / create the payer's Stripe customer (so cards can be saved).
    const { data: payer } = await supabaseAdmin
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
      await supabaseAdmin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId)
    }

    // 8. Create the destination charge: payer -> recipient's connected account,
    //    with your 5% taken as the application fee. Money is held by Stripe until
    //    the client confirms this PaymentIntent with a card.
    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      customer: customerId,
      setup_future_usage: savePaymentMethod ? 'off_session' : undefined,
      application_fee_amount: feeCents,
      transfer_data: { destination: recipient.stripe_connect_id },
      metadata: {
        collab_id: collabId,
        payer_id: userId,
        recipient_id: recipientId,
        milestone_index: milestoneIndex === null ? '' : String(milestoneIndex),
        label,
      },
      description: `Collective Loft · ${collab.project_title || 'Collaboration'} · ${label}`,
    })

    // 9. Record a pending payment in the ledger. The webhook flips it to
    //    'succeeded' and marks the milestone/collab paid once the charge clears.
    await supabaseAdmin.from('payments').insert({
      collab_id: collabId,
      payer_id: userId,
      recipient_id: recipientId,
      milestone_index: milestoneIndex,
      amount,
      platform_fee: feeCents / 100,
      stripe_payment_intent_id: intent.id,
      status: 'pending',
      metadata: { label },
    })

    return Response.json({
      client_secret: intent.client_secret,
      amount,
      platform_fee: feeCents / 100,
      net_to_recipient: (amountCents - feeCents) / 100,
      recipient_name: `${recipient.firstname || ''} ${recipient.lastname || ''}`.trim(),
      label,
    })

  } catch (err) {
    console.error('Payment route error:', err)
    return Response.json({ error: err.message || 'Payment failed to initialize' }, { status: 500 })
  }
}
