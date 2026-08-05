import { verifyCaller, serviceClient } from '../../../../lib/mailer'

// Returns what the caller told us on the founding signup form, so onboarding
// can pre-select it. Read-only, and it only ever reads the caller's OWN row:
// the email comes from their verified session, never from the request body,
// so nobody can look up another member's answers.
export async function GET(request) {
  try {
    const caller = await verifyCaller(request)
    if (!caller) return Response.json({ error: 'Not signed in' }, { status: 401 })

    const email = (caller.user.email || '').trim().toLowerCase()
    if (!email) return Response.json({ discipline: null })

    const db = serviceClient()
    const { data: invite } = await db
      .from('founding_invites')
      .select('discipline')
      .eq('email', email)
      .maybeSingle()

    return Response.json({ discipline: invite?.discipline || null })
  } catch (err) {
    console.error('Founding invite lookup error:', err)
    return Response.json({ discipline: null })
  }
}
