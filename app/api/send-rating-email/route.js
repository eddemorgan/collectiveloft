import { verifyCaller, sendMail, appUrl } from '../../../lib/mailer'
import { ratingEmailHtml } from '../../../lib/emails'

// Asks both parties to rate a finished collaboration.
// Guard: the caller must be a party to the collab and the collab must actually
// be complete. Recipients are both parties, derived from the row.
export async function POST(request) {
  try {
    const caller = await verifyCaller(request)
    if (!caller) return Response.json({ error: 'Not signed in' }, { status: 401 })
    const { user, supabase } = caller

    const { studioId } = await request.json()
    if (!studioId) return Response.json({ error: 'Missing studioId' }, { status: 400 })

    const { data: terms } = await supabase
      .from('collab_terms')
      .select('id, initiator_id, partner_id, status, project_title')
      .eq('id', studioId)
      .single()

    if (!terms) return Response.json({ error: 'Not found' }, { status: 404 })

    const isParty = terms.initiator_id === user.id || terms.partner_id === user.id
    if (!isParty) return Response.json({ error: 'Not your collaboration' }, { status: 403 })

    // Only mail a collab that is genuinely finished.
    if (terms.status !== 'complete') {
      return Response.json({ ok: true, skipped: 'collab is not complete' })
    }

    const ids = [terms.initiator_id, terms.partner_id].filter(Boolean)
    if (ids.length < 2) return Response.json({ ok: true, skipped: 'needs two parties' })

    const { data: people } = await supabase
      .from('profiles')
      .select('id, email, firstname, lastname')
      .in('id', ids)

    const byId = Object.fromEntries((people || []).map(p => [p.id, p]))
    const projectTitle = terms.project_title || 'your collaboration'
    let sent = 0

    for (const id of ids) {
      const me = byId[id]
      const other = byId[ids.find(x => x !== id)]
      if (!me?.email) continue
      const partnerName = [other?.firstname, other?.lastname].filter(Boolean).join(' ') || 'your collaborator'
      const { error } = await sendMail({
        to: me.email,
        subject: `Rate your collaboration with ${partnerName}`,
        html: ratingEmailHtml({
          recipientFirst: me.firstname || '',
          partnerName,
          projectTitle,
          studioId: terms.id,
          appUrl: appUrl(),
        }),
      })
      if (!error) sent++
    }

    return Response.json({ ok: true, sent })
  } catch (err) {
    console.error('Rating email route error:', err)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
