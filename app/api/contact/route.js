import { Resend } from 'resend'

export async function POST(request) {
  try {
    const { name, email, message } = await request.json()

    // Basic validation
    if (!name || !email || !message) {
      return Response.json({ error: 'Please fill in every field.' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Please enter a valid email.' }, { status: 400 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    const safe = (s) => String(s).replace(/</g, '&lt;').replace(/>/g, '&gt;')

    const { error } = await resend.emails.send({
      from: 'Collective Loft <studio@collectiveloft.com>',
      to: 'help@collectiveloft.com',
      reply_to: email,
      subject: `New Help request from ${name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="margin:0;padding:0;background:#F0ECE3;font-family:Arial,sans-serif;color:#1A1814;">
          <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
            <p style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#B8922E;margin:0 0 16px;">New Help Request</p>
            <p style="margin:0 0 8px;"><strong>Name:</strong> ${safe(name)}</p>
            <p style="margin:0 0 8px;"><strong>Email:</strong> ${safe(email)}</p>
            <p style="margin:16px 0 6px;"><strong>Message:</strong></p>
            <p style="margin:0;white-space:pre-wrap;line-height:1.6;">${safe(message)}</p>
            <hr style="border:none;border-top:1px solid #ddd;margin:24px 0;">
            <p style="font-size:12px;color:#7A7060;margin:0;">Reply directly to this email to respond to ${safe(name)}.</p>
          </div>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return Response.json({ error: 'Something went wrong. Please email us directly at help@collectiveloft.com.' }, { status: 500 })
    }

    return Response.json({ ok: true }, { status: 200 })
  } catch (err) {
    console.error('Contact route error:', err)
    return Response.json({ error: 'Something went wrong. Please email us directly at help@collectiveloft.com.' }, { status: 500 })
  }
}
