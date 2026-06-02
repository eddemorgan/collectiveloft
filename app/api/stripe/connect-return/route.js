import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get('account_id')
  const userId    = searchParams.get('user_id')

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://collectiveloft-git-dev-edde-morgan-s-projects.vercel.app'

  if (!accountId || !userId) {
    return Response.redirect(`${baseUrl}/?connect_error=missing_params`)
  }

  try {
    // Verify the account with Stripe before marking as onboarded.
    // charges_enabled = they've completed onboarding and can receive payments.
    const account = await stripe.accounts.retrieve(accountId)

    if (!account.charges_enabled) {
      // They returned but didn't finish. Don't mark as onboarded.
      // Send them back to their profile with a soft warning.
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('firstname, lastname')
        .eq('id', userId)
        .single()

      const slug = profile
        ? `${profile.firstname.toLowerCase()}-${profile.lastname.toLowerCase()}`
        : userId

      return Response.redirect(`${baseUrl}/profile/${slug}?connect_incomplete=true`)
    }

    // Charges are enabled — they're fully onboarded.
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ connect_onboarded: true })
      .eq('id', userId)

    if (updateError) {
      console.error('Failed to mark connect_onboarded:', updateError)
      return Response.redirect(`${baseUrl}/?connect_error=db_update_failed`)
    }

    // Redirect to their profile with success signal
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('firstname, lastname')
      .eq('id', userId)
      .single()

    const slug = profile
      ? `${profile.firstname.toLowerCase()}-${profile.lastname.toLowerCase()}`
      : userId

    return Response.redirect(`${baseUrl}/profile/${slug}?connect_success=true`)

  } catch (err) {
    console.error('Stripe Connect return error:', err)
    return Response.redirect(`${baseUrl}/?connect_error=stripe_error`)
  }
}