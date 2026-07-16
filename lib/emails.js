// Email templates for Collective Loft transactional mail (Resend).
// Brand: cream palette. Serif falls back to Georgia in email clients.

export function welcomeEmailHtml({ firstname = '', appUrl = 'https://collectiveloft.com' } = {}) {
  const greeting = firstname ? `Welcome, ${firstname}.` : 'Welcome.'
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#E8E3D9;font-family:'DM Sans',system-ui,Arial,sans-serif;color:#1A1814;">
  <span style="display:none;max-height:0;overflow:hidden;">Your people are here. Welcome to Collective Loft.</span>
  <div style="max-width:560px;margin:0 auto;padding:44px 24px;">

    <div style="text-align:center;margin-bottom:36px;">
      <div style="font-size:26px;color:#C9A84C;line-height:1;margin-bottom:14px;">&#10022;</div>
      <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-weight:600;color:#1A1814;">Collective </span><span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-style:italic;color:#8B6914;">Loft</span>
    </div>

    <div style="background:#F0ECE3;border:1px solid rgba(26,24,20,0.1);padding:36px 32px;">

      <div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#8B6914;margin-bottom:14px;">
        You are in
      </div>

      <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:32px;font-weight:600;color:#1A1814;margin:0 0 14px;line-height:1.2;">
        Your people are here.
      </h1>

      <p style="font-size:15px;color:rgba(26,24,20,0.75);margin:0 0 28px;line-height:1.7;">
        ${greeting} Collective Loft is a professional network where creatives find each other, agree on real terms, and make things together. No feeds to perform for. No bosses, just collaborators.
      </p>

      <div style="border-top:1px solid rgba(26,24,20,0.1);padding-top:24px;margin-bottom:28px;">

        <table style="border-collapse:collapse;margin-bottom:18px;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:top;width:34px;font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;color:#8B6914;">1.</td>
            <td style="font-size:14px;color:rgba(26,24,20,0.8);line-height:1.6;padding-bottom:16px;">
              <strong style="color:#1A1814;">Build your profile.</strong><br>
              Say what you make, and what kind of help you need.
            </td>
          </tr>
          <tr>
            <td style="vertical-align:top;width:34px;font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;color:#8B6914;">2.</td>
            <td style="font-size:14px;color:rgba(26,24,20,0.8);line-height:1.6;padding-bottom:16px;">
              <strong style="color:#1A1814;">Find your collaborators.</strong><br>
              Browse creatives by discipline, skill, and distance, or post a brief and let them come to you.
            </td>
          </tr>
          <tr>
            <td style="vertical-align:top;width:34px;font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;color:#8B6914;">3.</td>
            <td style="font-size:14px;color:rgba(26,24,20,0.8);line-height:1.6;">
              <strong style="color:#1A1814;">Open a Loft Studio.</strong><br>
              Agree on terms first, then make it real: files, milestones, and messages in one room.
            </td>
          </tr>
        </table>

      </div>

      <a href="${appUrl}" style="display:block;background:#8B6914;color:#F0ECE3;text-align:center;padding:15px 24px;font-size:13px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;">
        Step into the Loft
      </a>

    </div>

    <p style="font-size:13px;color:rgba(26,24,20,0.55);text-align:center;margin:28px 0 8px;line-height:1.6;">
      Questions? Just <a href="${appUrl}/help" style="color:#8B6914;text-decoration:underline;">click here</a>. A real person reads it.
    </p>
    <p style="text-align:center;margin:0;">
      <a href="${appUrl}" style="font-size:12px;color:#8B6914;text-decoration:none;">collectiveloft.com</a>
    </p>

  </div>
</body>
</html>`
}
