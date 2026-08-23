import { verifyCaller } from '../../../../lib/mailer'

// Marks a Loft Studio complete and credits BOTH members for the collaboration.
//
// Why this is a server route. The browser used to write both profiles itself,
// but RLS only lets a member update their own row, so the other party's
// increment failed every time and nothing checked the error. Whoever clicked
// Confirm Complete got the credit; their collaborator got nothing. Reputation
// counting is the promise the platform is built on, so it belongs on the
// service role, behind a check that the caller is actually a party to the
// collaboration.
//
// Idempotent. The status change is a conditional update, so a double click, a
// retry, or a second tab cannot credit the same collaboration twice: if the row
// is already complete no rows come back and the counts are left alone.
export async function POST(request) {
  try {
    const caller = await verifyCaller(request)
    if (!caller) return Response.json({ error: 'Not signed in' }, { status: 401 })
    const { user, supabase: db } = caller

    const { studioId } = await request.json().catch(() => ({}))
    if (!studioId) return Response.json({ error: 'Missing studioId' }, { status: 400 })

    const { data: collab, error: loadErr } = await db
      .from('collab_terms')
      .select('id, initiator_id, partner_id, status')
      .eq('id', studioId)
      .maybeSingle()

    if (loadErr) {
      console.error('Studio complete: could not load collab', loadErr)
      return Response.json({ error: 'Could not load this studio' }, { status: 500 })
    }
    if (!collab) return Response.json({ error: 'No such studio' }, { status: 404 })

    const owner = collab.initiator_id
    const contributor = collab.partner_id
    if (user.id !== owner && user.id !== contributor) {
      return Response.json({ error: 'Not your studio' }, { status: 403 })
    }

    const { data: closed, error: closeErr } = await db
      .from('collab_terms')
      .update({
        status: 'complete',
        close_proposed: false,
        completed_at: new Date().toISOString(),
      })
      .eq('id', studioId)
      .neq('status', 'complete')
      .select('id')

    if (closeErr) {
      console.error('Studio complete: status update failed', closeErr)
      return Response.json({ error: 'Could not complete this studio' }, { status: 500 })
    }

    // Already complete. Report success without crediting anyone a second time.
    if (!closed || closed.length === 0) {
      return Response.json({ ok: true, alreadyComplete: true })
    }

    // A repeat collaboration counts again as a collab but not as a new
    // connection, which is what makes connections_count mean people rather
    // than projects.
    let firstTime = true
    if (owner && contributor) {
      const { data: prior } = await db
        .from('collab_terms')
        .select('id')
        .neq('id', studioId)
        .eq('status', 'complete')
        .or(`and(initiator_id.eq.${owner},partner_id.eq.${contributor}),and(initiator_id.eq.${contributor},partner_id.eq.${owner})`)
      firstTime = !prior || prior.length === 0
    }

    const ids = [owner, contributor].filter(Boolean)
    if (ids.length > 0) {
      const { error: countErr } = await db.rpc('increment_collab_counts', {
        p_ids: ids,
        p_first_time: firstTime,
      })
      // The collaboration is closed either way. A failed count is loud in the
      // logs and repairable, and refusing to complete over it would be worse.
      if (countErr) console.error('Studio complete: count increment failed', countErr, ids)
    }

    return Response.json({ ok: true, credited: ids.length, firstTime })
  } catch (err) {
    console.error('Studio complete failed:', err)
    return Response.json({ error: 'Could not complete this studio' }, { status: 500 })
  }
}
