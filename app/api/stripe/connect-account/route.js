import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return Response.json({ error: 'userId required' }, { status: 400 })
    }

    // Pull the profile to check for an existing Connect account
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_connect_id, connect_onboarded, email, firstname, lastname')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return Response.json({ error: 'Profile not found' }, { status: 404 })
    }

    let accountId = profile.stripe_connect_id

    // If they already have an account but haven't finished onboarding,
    // just generate a fresh onboarding link for the existing account.
    // If they're already fully onboarded, nothing to do.
    if (profile.connect_onboarded) {
      return Response.json({ error: 'Already onboarded' }, { status: 400 })
    }

    // Create a new Express account if one doesn't exist yet
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: profile.email || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          supabase_user_id: userId,
        },
      })

      accountId = account.id

      // Persist the account ID immediately so we don't create duplicates
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ stripe_connect_id: accountId })
        .eq('id', userId)

      if (updateError) {
        console.error('Failed to save stripe_connect_id:', updateError)
        return Response.json({ error: 'Database update failed' }, { status: 500 })
      }
    }

    // Generate the onboarding link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://collectiveloft-git-dev-edde-morgan-s-projects.vercel.app'

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/api/stripe/connect-account`,  // They bailed — let them restart
      return_url:  `${baseUrl}/api/stripe/connect-return?account_id=${accountId}&user_id=${userId}`,
      type: 'account_onboarding',
    })

    return Response.json({ url: accountLink.url })

  } catch (err) {
    console.error('Stripe Connect account creation error:', err)
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}