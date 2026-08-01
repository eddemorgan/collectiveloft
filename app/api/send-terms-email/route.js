import { verifyCaller, sendMail, appUrl } from '../../../lib/mailer'
import { termsEmailHtml } from '../../../lib/emails'

// Tells the reviewing party that collab terms need their review.
// Guard: the caller must be the initiator or the partner on the collab_terms
// row. The recipient is derived from current_editor (whoever must act next),
// never from the request body.
export async function POST(request) {
  try {
    const caller = await verifyCaller(request)
    if (!caller) return Response.json({ error: 'Not signed in' }, { status: 401 })
    const { user, supabase } = caller

    const { studioId } = await request.json()
    if (!studioId) return Response.json({ error: 'Missing studioId' }, { status: 400 })

    const { data: terms } = await supabase
      .from('collab_terms')
      .select('id, initiator_id, partner_id, current_editor, status, project_title, collab_type, agreed_fee, fee_from, fee_to, timeline, deadline, deliverables')
      .eq('id', studioId)
      .single()

    if (!terms) return Response.json({ error: 'Not found' }, { status: 404 })

    const isParty = terms.initiator_id === user.id || terms.partner_id === user.id
    if (!isParty) return Response.json({ error: 'Not your collaboration' }, { status: 403 })

    // Only mail while terms are actually awaiting review.
    if (terms.status !== 'pending') {
      return Response.json({ ok: true, skipped: 'terms are not pending' })
    }

    // current_editor is the party who must act. Mail them, not the sender.
    const reviewerId = terms.current_editor === 'partner' ? terms.partner_id : terms.initiator_id
    const senderId   = terms.current_editor === 'partner' ? terms.initiator_id : terms.partner_id

    if (!reviewerId || reviewerId === user.id) {
      return Response.json({ ok: true, skipped: 'caller is the reviewer' })
    }

    const { data: reviewer } = await supabase
      .from('profiles').select('email, firstname').eq('id', reviewerId).single()
    const { data: sender } = await supabase
      .from('profiles').select('firstname, lastname').eq('id', senderId).single()

    if (!reviewer?.email) return Response.json({ ok: true, skipped: 'no reviewer email' })

    const senderName = [sender?.firstname, sender?.lastname].filter(Boolean).join(' ') || 'Your collaborator'

    // Fees are stored two ways: agreed_fee for a single figure (what the terms
    // page writes), fee_from/fee_to for a range. Honor whichever is present.
    const feeText =
      terms.agreed_fee ? ` · $${terms.agreed_fee}`
      : terms.fee_from ? ` · $${terms.fee_from}${terms.fee_to ? '-' + terms.fee_to : ''}`
      : ''

    const compType =
      terms.collab_type === 'exchange' ? 'Creative exchange'
      : terms.collab_type === 'paid' ? `Paid${feeText}`
      : terms.collab_type === 'revshare' ? 'Revenue share' : ''

    // A handoff is any review turn that is not the initiator's opening send.
    const isHandoff = terms.current_editor !== 'partner'

    const { error } = await sendMail({
      to: reviewer.email,
      subject: isHandoff
        ? `${senderName} sent the terms back for ${terms.project_title || 'your collaboration'}`
        : `${senderName} has sent you collab terms on Collective Loft`,
      html: termsEmailHtml({
        reviewerFirst: reviewer.firstname || '',
        senderName,
        projectTitle: terms.project_title || 'a collaboration',
        compType,
        timeline: terms.timeline || '',
        deadline: terms.deadline || '',
        deliverables: terms.deliverables || [],
        isHandoff,
        studioId: terms.id,
        appUrl: appUrl(),
      }),
    })

    if (error) return Response.json({ error: 'Email failed to send' }, { status: 500 })
    return Response.json({ ok: true })
  } catch (err) {
    console.error('Terms email route error:', err)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
