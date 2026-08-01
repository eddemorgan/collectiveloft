import { createMembershipCheckout } from '../../../../lib/lemonsqueezy'

// Hands the member a Lemon Squeezy hosted checkout for the $15 membership
// (7-day trial on the variant). LS is merchant of record: they collect and
// remit sales tax worldwide, so the platform files nothing.
export async function POST(req) {
  try {
    const { userId, email } = await req.json()
    if (!userId) {
      return Response.json({ error: 'userId required' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://collectiveloft.com'
    const url = await createMembershipCheckout({
      userId,
      email,
      redirectUrl: `${baseUrl}/onboarding?onboarding=true`,
    })

    return Response.json({ url })
  } catch (err) {
    console.error('Lemon Squeezy checkout error:', err)
    return Response.json({ error: 'Could not create checkout' }, { status: 500 })
  }
}
