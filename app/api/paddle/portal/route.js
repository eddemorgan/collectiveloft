import { createClient } from '@supabase/supabase-js'
import { paddleFetch } from '../../../../lib/paddle'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Returns the member's Paddle customer portal URL, where they update cards,
// cancel, or resume. The customer id is read from their profile, never taken
// from the request, so a caller cannot open someone else's portal.
export async function POST(req) {
  try {
    const { userId } = await req.json()
    if (!userId) {
      return Response.json({ error: 'userId required' }, { status: 400 })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('paddle_customer_id, paddle_subscription_id')
      .eq('id', userId)
      .single()

    if (!profile?.paddle_customer_id) {
      return Response.json({ error: 'No subscription on file' }, { status: 404 })
    }

    const body = profile.paddle_subscription_id
      ? { subscription_ids: [profile.paddle_subscription_id] }
      : {}

    const json = await paddleFetch(`/customers/${profile.paddle_customer_id}/portal-sessions`, {
      method: 'POST',
      body,
    })

    const urls = json?.data?.urls || {}
    const url =
      urls?.subscriptions?.[0]?.update_subscription_payment_method ||
      urls?.general?.overview
    if (!url) {
      return Response.json({ error: 'No portal available' }, { status: 404 })
    }

    return Response.json({ url })
  } catch (err) {
    console.error('Paddle portal error:', err)
    return Response.json({ error: 'Could not open portal' }, { status: 500 })
  }
}
