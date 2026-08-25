import { verifyCaller } from '../../../../lib/mailer'
import { paddleFetch } from '../../../../lib/paddle'

// Returns the signed-in member's Paddle customer portal URL, where they update
// a card, cancel, or resume.
//
// The member is taken from the verified session and never from the request
// body. This route used to read a userId off the POST body with no session
// check at all, which meant anyone holding a member's UUID could open that
// member's billing portal: their payment method, their invoices, their cancel
// button. Profile UUIDs travel in ordinary profile links, so that was not a
// theoretical id to come by.
export async function POST(request) {
  try {
    const caller = await verifyCaller(request)
    if (!caller) return Response.json({ error: 'Not signed in' }, { status: 401 })
    const { user, supabase: db } = caller

    const { data: profile } = await db
      .from('profiles')
      .select('paddle_customer_id, paddle_subscription_id')
      .eq('id', user.id)
      .maybeSingle()

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
