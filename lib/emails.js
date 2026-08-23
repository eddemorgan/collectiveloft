// Email templates for Collective Loft transactional mail (Resend).
// Brand: cream palette. Serif falls back to Georgia in email clients.

// Escapes user-supplied text before it goes into email HTML.
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Shared cream shell: logo, card, gold CTA, Help-page footer.
function shell({ eyebrow, heading, intro, cardHtml = '', ctaLabel, ctaHref, appUrl, preheader, footerHtml }) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#E8E3D9;font-family:'DM Sans',system-ui,Arial,sans-serif;color:#1A1814;">
  <span style="display:none;max-height:0;overflow:hidden;">${esc(preheader || '')}</span>
  <div style="max-width:560px;margin:0 auto;padding:44px 24px;">

    <div style="text-align:center;margin-bottom:36px;">
      <div style="font-size:26px;color:#C9A84C;line-height:1;margin-bottom:14px;">&#10022;</div>
      <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-weight:600;color:#1A1814;">Collective </span><span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-style:italic;color:#8B6914;">Loft</span>
    </div>

    <div style="background:#F0ECE3;border:1px solid rgba(26,24,20,0.1);padding:36px 32px;">

      <div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#8B6914;margin-bottom:14px;">
        ${esc(eyebrow)}
      </div>

      <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:32px;font-weight:600;color:#1A1814;margin:0 0 14px;line-height:1.2;">
        ${heading}
      </h1>

      <p style="font-size:15px;color:rgba(26,24,20,0.75);margin:0 0 28px;line-height:1.7;">
        ${intro}
      </p>

      ${cardHtml}

      <a href="${ctaHref}" style="display:block;background:#8B6914;color:#F0ECE3;text-align:center;padding:15px 24px;font-size:13px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;">
        ${esc(ctaLabel)}
      </a>

    </div>

    <p style="font-size:13px;color:rgba(26,24,20,0.55);text-align:center;margin:28px 0 8px;line-height:1.6;">
      ${footerHtml || `Questions? Just <a href="${appUrl}/help" style="color:#8B6914;text-decoration:underline;">click here</a>. A real person reads it.`}
    </p>
    <p style="text-align:center;margin:0;">
      <a href="${appUrl}" style="font-size:12px;color:#8B6914;text-decoration:none;">collectiveloft.com</a>
    </p>

  </div>
</body>
</html>`
}

// A labelled detail row inside a card.
function row(label, value, gold = false) {
  if (!value) return ''
  return `<tr>
    <td style="font-size:12px;color:rgba(26,24,20,0.45);padding:7px 0;width:110px;vertical-align:top;">${esc(label)}</td>
    <td style="font-size:13px;color:${gold ? '#8B6914' : '#1A1814'};padding:7px 0;">${esc(value)}</td>
  </tr>`
}

function card(innerRows) {
  if (!innerRows) return ''
  return `<div style="border-top:1px solid rgba(26,24,20,0.1);border-bottom:1px solid rgba(26,24,20,0.1);padding:6px 0;margin-bottom:28px;">
    <table style="width:100%;border-collapse:collapse;">${innerRows}</table>
  </div>`
}

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

// Someone applied to your brief. Goes to the brief poster.
export function applicationEmailHtml({
  posterFirst = '', applicantName = 'Someone', applicantHeadline = '',
  briefTitle = 'your brief', message = '', appUrl = 'https://collectiveloft.com',
} = {}) {
  const quoted = message
    ? `<div style="border-left:2px solid #C9A84C;padding:2px 0 2px 16px;margin-bottom:28px;">
         <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;font-style:italic;color:rgba(26,24,20,0.8);margin:0;line-height:1.6;">${esc(message)}</p>
       </div>`
    : ''
  return shell({
    preheader: `${applicantName} applied to ${briefTitle}.`,
    eyebrow: 'New application',
    heading: `${esc(applicantName)} wants to work with you.`,
    intro: `${posterFirst ? esc(posterFirst) + ', s' : 'S'}omeone answered your brief. Review their application and, if it fits, send them terms.`,
    cardHtml: card(
      row('Brief', briefTitle) +
      row('From', applicantName) +
      row('They do', applicantHeadline)
    ) + quoted,
    ctaLabel: 'Review the application',
    ctaHref: `${appUrl}/briefs`,
    appUrl,
  })
}

// Collab terms need your review. Goes to whoever's turn it is.
export function termsEmailHtml({
  reviewerFirst = '', senderName = 'Your collaborator', projectTitle = 'a collaboration',
  compType = '', timeline = '', deadline = '', deliverables = [],
  isHandoff = false, studioId = '', appUrl = 'https://collectiveloft.com',
} = {}) {
  const list = (deliverables || []).slice(0, 5)
  const deliverablesText = list.length ? list.join(', ') : ''
  return shell({
    preheader: `${senderName} sent terms for ${projectTitle}.`,
    eyebrow: isHandoff ? 'Terms updated' : 'New collab terms',
    heading: isHandoff
      ? `${esc(senderName)} sent the terms back.`
      : `${esc(senderName)} wants to collaborate.`,
    intro: isHandoff
      ? `The terms for <strong style="color:#1A1814;">${esc(projectTitle)}</strong> have changed and it is your turn to review. Nothing is agreed until you both say yes.`
      : `${reviewerFirst ? esc(reviewerFirst) + ', ' : ''}terms have been proposed for <strong style="color:#1A1814;">${esc(projectTitle)}</strong>. Review them before any work begins. Nothing is agreed until you both say yes.`,
    cardHtml: card(
      row('Project', projectTitle) +
      row('Type', compType, true) +
      row('Timeline', timeline) +
      row('Deadline', deadline) +
      row('Deliverables', deliverablesText)
    ),
    ctaLabel: 'Review the terms',
    ctaHref: `${appUrl}/terms-review/${studioId}`,
    appUrl,
  })
}

// The collab is complete. Goes to both parties.
export function ratingEmailHtml({
  recipientFirst = '', partnerName = 'your collaborator', projectTitle = 'your collaboration',
  studioId = '', appUrl = 'https://collectiveloft.com',
} = {}) {
  return shell({
    preheader: `Rate your collaboration with ${partnerName}.`,
    eyebrow: 'Collab complete',
    heading: 'The work is done.',
    intro: `${recipientFirst ? esc(recipientFirst) + ', y' : 'Y'}ou and ${esc(partnerName)} finished <strong style="color:#1A1814;">${esc(projectTitle)}</strong>. Rate each other. It takes a minute, and it is what the next person reads when they consider working with ${esc(partnerName)}.`,
    cardHtml: card(
      row('Project', projectTitle) +
      row('With', partnerName)
    ),
    ctaLabel: 'Rate this collaboration',
    ctaHref: `${appUrl}/studio/${studioId}?rate=1`,
    appUrl,
  })
}

// Sent once, as the account closes. The last thing a departing member sees
// from us, so it stays warm and states plainly what was removed and what was
// kept, rather than making them wonder later.
export function accountClosedEmailHtml({ firstname = '', appUrl = 'https://collectiveloft.com' } = {}) {
  return shell({
    preheader: 'Your Collective Loft account is closed.',
    eyebrow: 'Account closed',
    heading: `${firstname ? esc(firstname) + ', y' : 'Y'}our account is closed.`,
    intro: `Your profile, photos, portfolio, and links are deleted, and any subscription is cancelled, so you will not be charged again. Collaborations you finished stay on record for the people you worked with, credited to a former member, so their history and ratings are unchanged.`,
    cardHtml: card(
      row('Your profile', 'Deleted') +
      row('Your subscription', 'Cancelled, no further charges') +
      row('Finished collabs', 'Kept for your collaborators, anonymized')
    ),
    ctaLabel: 'Visit Collective Loft',
    ctaHref: appUrl,
    appUrl,
    footerHtml: `Questions, or was this deletion in error? Just <a href="${appUrl}/help" style="color:#8B6914;text-decoration:underline;">click here</a> and send a message. A real person reads it.`,
  })
}

// The founding welcome. Sent to allowlisted founding members on launch day with
// their signup link. States the 90 days free and the founding badge. The link
// pre-fills their invited email so the allowlist recognizes them on signup.
export function foundingWelcomeEmailHtml({ firstname = '', email = '', appUrl = 'https://collectiveloft.com' } = {}) {
  const hi = firstname ? `${esc(firstname)}, the` : 'The'
  const signup = `${appUrl}/signup${email ? `?email=${encodeURIComponent(email)}` : ''}`
  return shell({
    preheader: 'Your founding spot is ready. The loft is open.',
    eyebrow: 'Founding Member',
    heading: `${hi} loft is open.`,
    intro: `You claimed a founding spot, and the doors are open. You are one of the first creatives inside Collective Loft: a professional network where you find your people, agree on real terms, and build something together. Set up your profile and it carries the Founding Member badge from day one.`,
    cardHtml: card(
      row('Your first 90 days', 'Free. No card needed.') +
      row('After that', '$10 a month, cancel anytime') +
      row('Your badge', 'Founding Member, on your profile forever')
    ),
    ctaLabel: 'Claim your spot',
    ctaHref: signup,
    appUrl,
  }).replace(
    '</a>\n\n    </div>',
    `</a>
      <p style="font-size:12px;color:rgba(26,24,20,0.45);text-align:center;margin:14px 0 0;line-height:1.6;">Use this email address (${esc(email)}) when you sign up, so we know it is you.</p>
      <p style="font-size:12px;color:rgba(26,24,20,0.45);text-align:center;margin:10px 0 0;line-height:1.6;">Want the lay of the land first? Read the <a href="${appUrl}/guide" style="color:#8B6914;text-decoration:underline;">member guide</a>. Everything from your profile to getting paid.</p>

    </div>`
  )
}

// The student verification code. Sent to the member's own .edu address by
// /api/student/request. The code is the payload; the copy stays out of its
// way. Thirty minutes of validity, stated plainly so an old email never sends
// someone typing a dead code.
export function studentVerifyEmailHtml({ code = '', appUrl = 'https://collectiveloft.com' } = {}) {
  return shell({
    preheader: `${esc(code)} is your student verification code.`,
    eyebrow: 'Student verification',
    heading: 'Your code is here.',
    intro: `Enter this code on Collective Loft to confirm your student email. It works for the next 30 minutes. If you did not request it, ignore this email and nothing changes.`,
    cardHtml: `<div style="border-top:1px solid rgba(26,24,20,0.1);border-bottom:1px solid rgba(26,24,20,0.1);padding:18px 0;margin-bottom:28px;text-align:center;">
      <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:40px;font-weight:600;letter-spacing:0.35em;color:#8B6914;">${esc(code)}</span>
    </div>`,
    ctaLabel: 'Enter your code',
    ctaHref: `${appUrl}/student/verify`,
    appUrl,
  })
}

// The legal update notice. Sent once per member by scripts/send-legal-update.mjs
// when the Terms or Privacy Policy change, which is how Section 24's promise of
// advance notice gets kept. This edition announces the Data Covenant and free
// student membership. Both documents gain protections; nothing is taken away.
export function legalUpdateEmailHtml({ firstname = '', effectiveDate = '', appUrl = 'https://collectiveloft.com' } = {}) {
  return shell({
    preheader: 'We wrote "we will never sell your data" into the contract.',
    eyebrow: 'Terms update',
    heading: `${firstname ? esc(firstname) + ', w' : 'W'}e put it in writing.`,
    intro: `We have always said your data is not for sale. As of ${esc(effectiveDate)}, that stops being a promise and becomes a term of our contract with you. The updated Terms and Privacy Policy add the Data Covenant: we never sell, rent, or license your personal data, if the platform ever shuts down your data is deleted rather than transferred, and no acquirer can ever buy their way out of those commitments. One more addition: enrolled students with a verified .edu email now get membership free. Nothing in this update takes anything away from you, and nothing about your membership or billing changes.`,
    cardHtml: card(
      row('Never sold', 'Your data. Binding contract term, not marketing.') +
      row('If we shut down', 'Your data is deleted, not auctioned.') +
      row('If we are acquired', '30 days notice, and you can delete first.') +
      row('Students', 'Free with a verified .edu email.')
    ),
    ctaLabel: 'Read the updated terms',
    ctaHref: `${appUrl}/legal/terms`,
    appUrl,
  })
}
