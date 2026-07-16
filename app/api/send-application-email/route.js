import { verifyCaller, sendMail, appUrl } from '../../../lib/mailer'
import { applicationEmailHtml } from '../../../lib/emails'

// Tells a brief poster that someone applied.
// Guard: the caller must be the applicant on the application row. The
// recipient is derived from the brief's poster, never from the request body.
export async function POST(request) {
  try {
    const caller = await verifyCaller(request)
    if (!caller) return Response.json({ error: 'Not signed in' }, { status: 401 })
    const { user, supabase } = caller

    const { applicationId } = await request.json()
    if (!applicationId) return Response.json({ error: 'Missing applicationId' }, { status: 400 })

    const { data: application } = await supabase
      .from('applications')
      .select('id, applicant_id, brief_id, message')
      .eq('id', applicationId)
      .single()

    if (!application) return Response.json({ error: 'Not found' }, { status: 404 })
    if (application.applicant_id !== user.id) {
      return Response.json({ error: 'Not your application' }, { status: 403 })
    }

    const { data: brief } = await supabase
      .from('briefs')
      .select('id, title, poster_id')
      .eq('id', application.brief_id)
      .single()

    if (!brief?.poster_id) return Response.json({ error: 'Brief not found' }, { status: 404 })
    if (brief.poster_id === user.id) {
      return Response.json({ ok: true, skipped: 'own brief' })
    }

    const { data: poster } = await supabase
      .from('profiles')
      .select('email, firstname')
      .eq('id', brief.poster_id)
      .single()

    const { data: applicant } = await supabase
      .from('profiles')
      .select('firstname, lastname, headline')
      .eq('id', user.id)
      .single()

    if (!poster?.email) return Response.json({ ok: true, skipped: 'no poster email' })

    const applicantName = [applicant?.firstname, applicant?.lastname].filter(Boolean).join(' ') || 'Someone'

    const { error } = await sendMail({
      to: poster.email,
      subject: `${applicantName} applied to your brief on Collective Loft`,
      html: applicationEmailHtml({
        posterFirst: poster.firstname || '',
        applicantName,
        applicantHeadline: applicant?.headline || '',
        briefTitle: brief.title || 'your brief',
        message: application.message || '',
        appUrl: appUrl(),
      }),
    })

    if (error) return Response.json({ error: 'Email failed to send' }, { status: 500 })
    return Response.json({ ok: true })
  } catch (err) {
    console.error('Application email route error:', err)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
