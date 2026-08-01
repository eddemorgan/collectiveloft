import { createClient } from '@supabase/supabase-js'
import { lsFetch } from '../../../../lib/lemonsqueezy'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Returns the member's Lemon Squeezy customer portal URL (signed, short-lived)
// where they update cards, cancel, or resume.
export async function POST(req) {
  try {
    const { userId } = await req.json()
    if (!userId) {
      return Response.json({ error: 'userId required' }, { status: 400 })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('lemonsqueezy_subscription_id')
      .eq('id', userId)
      .single()

    if (!profile?.lemonsqueezy_subscription_id) {
      return Response.json({ error: 'No subscription on file' }, { status: 404 })
    }

    const json = await lsFetch(`/subscriptions/${profile.lemonsqueezy_subscription_id}`)
    const url = json?.data?.attributes?.urls?.customer_portal
    if (!url) {
      return Response.json({ error: 'No portal available' }, { status: 404 })
    }

    return Response.json({ url })
  } catch (err) {
    console.error('Lemon Squeezy portal error:', err)
    return Response.json({ error: 'Could not open portal' }, { status: 500 })
  }
}
