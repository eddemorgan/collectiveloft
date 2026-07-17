'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TERMS_URL, PRIVACY_URL } from '../../lib/legal'
import styles from './help.module.css'

const SOCIALS = [
  ['Instagram','https://www.instagram.com/the.collective.loft/','M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.31-1.46.72-2.12 1.38C1.35 2.67.94 3.34.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.72 1.46 1.38 2.12.66.66 1.33 1.07 2.12 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.31 1.46-.72 2.12-1.38.66-.66 1.07-1.33 1.38-2.12.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.31-.79-.72-1.46-1.38-2.12C21.33 1.35 20.66.94 19.86.63 19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zM12 16a4 4 0 110-8 4 4 0 010 8zm6.41-11.85a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z'],
  ['TikTok','https://www.tiktok.com/@the.collective.loft','M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64c.3 0 .59.05.86.13V9.4a6.33 6.33 0 00-.86-.06A6.34 6.34 0 005.15 20.4a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.19-.4z'],
  ['Bluesky','https://bsky.app/profile/thecollectiveloft.bsky.social','M5.77 3.36C8.23 5.2 10.88 8.95 12 11.24c1.12-2.3 3.77-6.04 6.23-7.88C20 2.03 22 1.02 22 3.34c0 .46-.26 3.9-.42 4.45-.55 1.94-2.52 2.44-4.28 2.14 3.07.52 3.85 2.25 2.16 3.98-3.2 3.28-4.6-.82-4.96-1.87-.07-.2-.1-.28-.1-.2 0-.08-.03 0-.1.2-.36 1.05-1.76 5.15-4.96 1.87-1.69-1.73-.91-3.46 2.16-3.98-1.76.3-3.73-.2-4.28-2.14C2.26 7.24 2 3.8 2 3.34c0-2.32 2-1.31 3.77.02z'],
  ['LinkedIn','https://www.linkedin.com/company/collectiveloft','M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 110-4.13 2.06 2.06 0 010 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z'],
  ['Reddit','https://www.reddit.com/r/CollectiveLoft/','M24 11.78a2.34 2.34 0 00-3.96-1.68 11.5 11.5 0 00-6.24-1.98l1.06-5.02 3.5.74a1.67 1.67 0 103.34-.15 1.67 1.67 0 00-3.16-.74l-3.9-.83a.42.42 0 00-.5.32l-1.18 5.56a11.5 11.5 0 00-6.32 1.98 2.34 2.34 0 10-2.58 3.83 4.6 4.6 0 00-.06.72c0 3.66 4.26 6.63 9.52 6.63s9.52-2.97 9.52-6.63a4.6 4.6 0 00-.06-.72A2.34 2.34 0 0024 11.78zM6.67 13.44a1.67 1.67 0 113.34 0 1.67 1.67 0 01-3.34 0zm9.34 4.42c-1.14 1.14-3.32 1.23-3.96 1.23s-2.82-.09-3.96-1.23a.42.42 0 01.6-.6c.72.72 2.26.98 3.36.98s2.64-.26 3.36-.98a.42.42 0 01.6.6zm-.31-2.75a1.67 1.67 0 110-3.34 1.67 1.67 0 010 3.34z'],
  ['Facebook','https://www.facebook.com/people/Collective-Loft/61591496305697/','M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z'],
]

const FAQS = [
  { q: 'What is Collective Loft?', a: <>A professional network built for the creative class. It&rsquo;s where creatives who don&rsquo;t already know each other find collaborators, agree on real terms before any work begins, and open a shared workspace built around the project. Not a job board, not a portfolio site. The place creative collaboration actually happens, end to end.</> },
  { q: 'How do I find someone to collaborate with?', a: <>You post a Collab Brief, a description of what you&rsquo;re making and who you need, written in creative language, not a job listing. Other members find it filtered by discipline, compensation type, and location. You can also discover and respond to briefs other creatives have posted. When someone&rsquo;s interested, they message you, and you review their profile and portfolio before moving forward.</> },
  { q: 'What are Collab Terms?', a: <>The agreement two creatives set <b>before any work begins</b>. They cover compensation type (creative exchange, paid, or revenue share), along with rights, deliverables, milestones, and timeline. Both parties review, modify, and accept, and the terms are timestamped. It&rsquo;s clarity in writing, before the work starts, instead of a misunderstanding three DMs deep after it falls apart.</> },
  { q: 'What is a Loft Studio?', a: <>Once both parties accept the Collab Terms, a Loft Studio opens, a shared workspace dedicated to that collaboration. The brief is pinned at the top, with milestones, files, and persistent messaging all in one place. The collaboration has a home, instead of being scattered across email, texts, and a shared doc held together with hope.</> },
  { q: 'How much does Collective Loft cost?', a: <>Membership is <b>$15 per month</b>. No tiers, no feature gates, no pay-to-unlock. The subscription gets you full access to everything: Discover, Collab Briefs, discipline matching, Collab Terms, and the Loft Studio.</> },
  { q: 'Is there a free trial?', a: <>Yes. Your first <b>7 days are free</b>. You won&rsquo;t be charged until the trial ends, and you can cancel anytime before then. After the trial, membership is $15 per month.</> },
  { q: 'Why does Collective Loft charge a subscription?', a: <>Because free platforms attract people who aren&rsquo;t serious. The $15 a month keeps this a professional environment, a room where everyone has skin in the game, agreements are in writing before work starts, and <b>your creative work is protected from day one</b>. The cost is the filter that keeps the people who exploit creatives out.</> },
  { q: 'How are my rights and my work protected?', a: <>Protection is built into the structure. Before any work begins, both parties agree to Collab Terms covering rights, deliverables, and compensation, and those terms are timestamped. <b>Nothing starts on a handshake and a hope.</b> The agreement layer exists specifically so creatives aren&rsquo;t left exposed the way they are on platforms that were never built for them.</> },
  { q: 'What kinds of compensation can a collaboration use?', a: <>Three: <b>creative exchange, paid, or revenue share</b>. You set which one applies in the Collab Terms before work begins, along with the specifics on rights, deliverables, and milestones. Both parties have to accept before anything starts.</> },
]

export default function HelpPage() {
  const [open, setOpen] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [errMsg, setErrMsg] = useState('')

  const toggle = (i) => setOpen(open === i ? null : i)
  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async () => {
    if (!form.name || !form.email || !form.message) {
      setErrMsg('Please fill in every field.'); setStatus('error'); return
    }
    setStatus('sending'); setErrMsg('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) { setStatus('sent') }
      else { setErrMsg(data.error || 'Something went wrong.'); setStatus('error') }
    } catch {
      setErrMsg('Something went wrong. Please email us directly.'); setStatus('error')
    }
  }

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.brand}>
            <span className={styles.mark}>&#10022;</span>
            <span>
              <span className={styles.wm}>Collective <em>Loft</em></span>
              <span className={styles.tag}>Where creatives find each other</span>
            </span>
          </Link>
          <Link href="/" className={styles.navBack}>&larr; Back to Collective Loft</Link>
        </div>
      </nav>

      <header className={styles.hero}>
        <div className={styles.eyebrow}>Help &amp; support</div>
        <h1 className={styles.title}>We&rsquo;re here <em>when you need us.</em></h1>
        <p className={styles.lede}>Answers to the most common questions, and a direct line to us for everything else.</p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.secTitle}>Frequently asked</h2>
        <p className={styles.secSub}>The quick answers. Anything else, just reach out below.</p>
        <div className={styles.faqList}>
          {FAQS.map((f, i) => (
            <div key={i} className={styles.faqItem}>
              <button className={styles.faqQ} onClick={() => toggle(i)} aria-expanded={open === i}>
                {f.q}
                <span className={`${styles.faqIcon} ${open === i ? styles.faqIconOpen : ''}`}>+</span>
              </button>
              <div className={`${styles.faqA} ${open === i ? styles.faqAOpen : ''}`}>
                <div className={styles.faqAInner}>{f.a}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.contact}>
        <div className={styles.contactInner}>
          <h2 className={styles.secTitle}>Still need a hand?</h2>
          <p className={styles.secSub}>Send us a message and we&rsquo;ll get back to you.</p>

          {status === 'sent' ? (
            <div className={styles.sent}>
              <div className={styles.sentIcon}>&#10022;</div>
              <div className={styles.sentTitle}>Message sent.</div>
              <div className={styles.sentSub}>Thanks for reaching out. We&rsquo;ll reply to your email as soon as we can.</div>
            </div>
          ) : (
            <div className={styles.form}>
              {status === 'error' && <div className={styles.error}>{errMsg}</div>}
              <div className={styles.field}>
                <label className={styles.label}>Name</label>
                <input className={styles.input} value={form.name} onChange={update('name')} placeholder="Your name" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <input className={styles.input} type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Message</label>
                <textarea className={styles.textarea} value={form.message} onChange={update('message')} placeholder="How can we help?" />
              </div>
              <button className={styles.submit} onClick={submit} disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending&hellip;' : 'Send message'}
              </button>
              <p className={styles.formNote}>A real person reads every message, and we reply to the address you give us.</p>
            </div>
          )}
        </div>
      </section>

      <section className={styles.connect}>
        <h2 className={styles.connectTitle}>Stay connected</h2>
        <p className={styles.connectSub}>Follow along and be part of the community.</p>
        <div className={styles.socials}>
          {SOCIALS.map(([name, href, d]) => (
            <a key={name} href={href} target="_blank" rel="noopener noreferrer" aria-label={name} className={styles.social}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d={d}/></svg>
            </a>
          ))}
        </div>
      </section>

      <footer className={styles.foot}>
        <div className={styles.footInner}>
          <div className={styles.fine}>&copy; 2026 Collective Loft &middot; A Morgan Collective Group company</div>
          <div className={styles.legalLinks}>
            <Link href="/guide">Member Guide</Link>
            <Link href={TERMS_URL}>Terms &amp; Conditions</Link>
            <Link href={PRIVACY_URL}>Privacy Policy</Link>
          </div>
          <div className={styles.fine}>Chicago &middot; London</div>
        </div>
      </footer>
    </div>
  )
}
