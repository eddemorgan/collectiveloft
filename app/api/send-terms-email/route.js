import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { studioId, initiatorId, partnerId } = await request.json()

    const { data: initiator } = await supabase
      .from('profiles')
      .select('firstname, lastname, email, headline')
      .eq('id', initiatorId)
      .single()

    const { data: partner } = await supabase
      .from('profiles')
      .select('firstname, lastname, email, headline')
      .eq('id', partnerId)
      .single()

    const { data: studio } = await supabase
      .from('collab_terms')
      .select('project_title, collab_type, fee_from, fee_to, timeline, deliverables')
      .eq('id', studioId)
      .single()

    if (!partner?.email) {
      return Response.json({ error: 'No partner email found' }, { status: 400 })
    }

    const compType = studio.collab_type === 'exchange' ? 'Creative exchange'
      : studio.collab_type === 'paid' ? `Paid${studio.fee_from ? ` · $${studio.fee_from}${studio.fee_to ? '–' + studio.fee_to : ''}` : ''}`
      : 'Revenue share'

    const deliverablesList = (studio.deliverables || [])
      .slice(0, 5)
      .map(d => `<li style="margin-bottom:6px;color:rgba(240,236,227,0.7);">${d}</li>`)
      .join('')

    const { data, error } = await resend.emails.send({
      from: 'Collective Loft <studio@collectiveloft.com>',
      to: partner.email,
      subject: `${initiator.firstname} ${initiator.lastname} has sent you collab terms — ${studio.project_title || 'Untitled project'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background:#111111;font-family:'DM Sans',system-ui,sans-serif;color:#F0ECE3;">
          <div style="max-width:560px;margin:0 auto;padding:40px 24px;">

            <div style="margin-bottom:32px;">
              <span style="font-family:Georgia,serif;font-size:20px;color:#F0ECE3;">Collective </span>
              <span style="font-family:Georgia,serif;font-size:20px;color:#C9A84C;">Loft</span>
            </div>

            <div style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#C9A84C;opacity:0.75;margin-bottom:12px;">
              Loft Studio · New collab terms
            </div>

            <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#F0ECE3;margin:0 0 8px;line-height:1.2;">
              ${initiator.firstname} ${initiator.lastname} wants to collaborate.
            </h1>
            <p style="font-size:15px;color:rgba(240,236,227,0.55);font-weight:300;margin:0 0 32px;line-height:1.6;">
              ${initiator.firstname} has sent you collab terms for <strong style="color:#F0ECE3;">${studio.project_title || 'a new project'}</strong>. Review them and open your Loft Studio.
            </p>

            <div style="background:#161616;border:0.5px solid rgba(240,236,227,0.08);border-radius:6px;padding:24px;margin-bottom:24px;">
              <div style="font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:rgba(240,236,227,0.3);margin-bottom:16px;">Terms summary</div>
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="font-size:12px;color:rgba(240,236,227,0.35);padding:6px 0;width:120px;">Project</td>
                  <td style="font-size:13px;color:#F0ECE3;padding:6px 0;">${studio.project_title || 'Untitled project'}</td>
                </tr>
                <tr>
                  <td style="font-size:12px;color:rgba(240,236,227,0.35);padding:6px 0;">Type</td>
                  <td style="font-size:13px;color:#C9A84C;padding:6px 0;">${compType}</td>
                </tr>
                ${studio.timeline ? `
                <tr>
                  <td style="font-size:12px;color:rgba(240,236,227,0.35);padding:6px 0;">Timeline</td>
                  <td style="font-size:13px;color:#F0ECE3;padding:6px 0;">${studio.timeline}</td>
                </tr>` : ''}
                ${deliverablesList ? `
                <tr>
                  <td style="font-size:12px;color:rgba(240,236,227,0.35);padding:6px 0;vertical-align:top;">Deliverables</td>
                  <td style="padding:6px 0;">
                    <ul style="margin:0;padding-left:16px;font-size:12px;line-height:1.6;">
                      ${deliverablesList}
                    </ul>
                  </td>
                </tr>` : ''}
              </table>
            </div>

            <a href="https://collectiveloft.com/my-studios" style="display:block;background:#C9A84C;color:#0D0D0D;text-align:center;padding:14px 24px;border-radius:3px;font-size:13px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;margin-bottom:16px;">
              Review terms &amp; open studio ↗
            </a>

            <p style="font-size:12px;color:rgba(240,236,227,0.22);text-align:center;margin:0 0 32px;line-height:1.6;">
              Once you accept, your Loft Studio opens and the collaboration officially begins.
            </p>

            <div style="border-top:0.5px solid rgba(240,236,227,0.06);padding-top:24px;">
              <p style="font-size:11px;color:rgba(240,236,227,0.2);margin:0;line-height:1.6;">
                You received this because ${initiator.firstname} ${initiator.lastname} sent you collab terms on Collective Loft.<br>
                <a href="https://collectiveloft.com" style="color:rgba(201,168,76,0.5);text-decoration:none;">collectiveloft.com</a>
              </p>
            </div>

          </div>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return Response.json({ error }, { status: 400 })
    }

    return Response.json({ success: true, id: data?.id })
  } catch (err) {
    console.error('Email route error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}