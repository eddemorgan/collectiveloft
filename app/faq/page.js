import Head from 'next/head'

const FAQ_GROUPS = [
  {
    group: 'The basics',
    items: [
      {
        q: 'What is Collective Loft?',
        a: 'Collective Loft is a professional network built for the creative class — artists, musicians, writers, poets, designers, filmmakers, photographers, performers, and creative technologists. It\u2019s where creatives who don\u2019t already know each other find collaborators, agree on real terms before any work begins, and open a shared workspace built around the project. It\u2019s not a job board and not a portfolio site. It\u2019s the place creative collaboration actually happens, end to end.',
      },
      {
        q: 'Who is Collective Loft for?',
        a: 'Independent creative professionals across eight disciplines: visual art, music, writing, design and web, film, photography, performance, and creative tech. If you make work and you need the right collaborator to make it real — a composer for your film, a designer for your record, a photographer for your collection — this is built for you.',
      },
      {
        q: 'How is this different from LinkedIn, Upwork, or Behance?',
        a: 'Those platforms treat creatives as something they\u2019re not. LinkedIn treats a musician\u2019s profile like a r\u00e9sum\u00e9 and optimizes for job applications. Upwork creates a client-worker hierarchy and a race to the bottom on price. Behance is a beautiful gallery where work sits waiting to be found, with no path from profile to actual project. Collective Loft is built around the one thing that drives creative output: the relationship between complementary disciplines that produces work neither party could make alone. You find each other, you agree on terms, and you get a shared workspace to do the work.',
      },
    ],
  },
  {
    group: 'How it works',
    items: [
      {
        q: 'How do I find someone to collaborate with?',
        a: 'You post a Collab Brief — a description of what you\u2019re making and who you need, written in creative language, not a job listing. Other members find it filtered by discipline, compensation type, and location. You can also discover and respond to briefs other creatives have posted. When someone\u2019s interested, they send a message explaining why they\u2019re drawn to the project, and you review their profile and portfolio before deciding to move forward.',
      },
      {
        q: 'What are Collab Terms?',
        a: 'Collab Terms are the agreement two creatives set before any work begins. They cover the compensation type — creative exchange, paid, or revenue share — along with rights, deliverables, milestones, and timeline. Both parties review, modify, and accept the terms, and they\u2019re timestamped. It\u2019s the structured agreement layer the creative class has never had: clarity in writing, before the work starts, instead of a misunderstanding three DMs deep after it falls apart.',
      },
      {
        q: 'What is a Loft Studio?',
        a: 'Once both parties accept the Collab Terms, a Loft Studio opens — a shared workspace dedicated to that collaboration. The original brief is pinned at the top, with milestones, files, and persistent messaging all in one place. The collaboration has a home now, instead of being scattered across email, texts, and a shared Notion page held together with hope.',
      },
      {
        q: 'What disciplines does Collective Loft support?',
        a: 'Eight: visual art, music, writing, design and web, film, photography, performance, and creative tech. The whole point is cross-discipline collaboration — a filmmaker finding a composer, a painter finding a musician for an installation — so the network is built to connect across all of them, not silo them.',
      },
    ],
  },
  {
    group: 'Membership and pricing',
    items: [
      {
        q: 'How much does Collective Loft cost?',
        a: 'Membership is $15 per month. There are no tiers, no feature gates, and no pay-to-unlock. The subscription gets you full access to everything: Discover, Collab Briefs, discipline matching, Collab Terms, and the Loft Studio.',
      },
      {
        q: 'Why does Collective Loft charge a subscription?',
        a: 'Because free platforms attract people who aren\u2019t serious. The $15 a month keeps this a professional environment — a room where everyone has skin in the game, agreements are in writing before work starts, and your creative work is protected from day one. The cost is the filter that keeps the quality high.',
      },
      {
        q: 'What does the $15 a month actually get me?',
        a: 'Everything. Full access to Discover, Collab Briefs, discipline matching, Collab Terms, and the Loft Studio, with no tiers or locked features. Use it to run ten collaborations a month, or use it to build your profile and get discovered. The platform works on your timeline and your priorities.',
      },
      {
        q: 'Is there a free trial?',
        a: 'Founding members get three months free — no charge, no catch. After that it\u2019s $15 a month, the same as everyone else. The founding member badge on your profile stays forever.',
      },
    ],
  },
  {
    group: 'Founding members',
    items: [
      {
        q: 'What is a founding member?',
        a: 'Founding members are the first cohort on the platform, selected by hand across disciplines and cities. They get three months free, full access, a permanent founding member badge on their profile, and a direct hand in shaping the platform as it grows. There are 500 founding spots.',
      },
      {
        q: 'How do I become a founding member?',
        a: 'Request early access and tell us your primary discipline. We\u2019re not running an open beta — we\u2019re building the founding cohort by hand, choosing people who are actively making work right now. We read every application. If you\u2019re selected, we\u2019ll be in touch with next steps before anyone else hears about it.',
      },
      {
        q: 'What happens after the three free months end?',
        a: 'It becomes $15 a month, the same as every other member. Nothing else changes — you keep full access and your founding member badge stays on your profile permanently.',
      },
    ],
  },
  {
    group: 'Trust and protection',
    items: [
      {
        q: 'How are my rights and my work protected?',
        a: 'Protection is built into the structure. Before any work begins, both parties agree to Collab Terms covering rights, deliverables, and compensation, and those terms are timestamped. Nothing starts on a handshake and a hope. The agreement layer exists specifically so creatives aren\u2019t left exposed the way they are on platforms that were never built for them.',
      },
      {
        q: 'What kinds of compensation can a collaboration use?',
        a: 'Three: creative exchange, paid, or revenue share. You set which one applies in the Collab Terms before work begins, along with the specifics on rights, deliverables, and milestones. Both parties have to accept before anything starts.',
      },
      {
        q: 'Is Collective Loft only in Chicago?',
        a: 'No. The platform is a digital network open to creatives anywhere — there are 165 million independent creative professionals worldwide, and the network is built for all of them. Chicago is home base and the site of the first physical Loft Studios and founding-member community, but membership and collaboration are not limited by location.',
      },
    ],
  },
  {
    group: 'The bigger picture',
    items: [
      {
        q: 'What is Morgan Collective Group?',
        a: 'Morgan Collective Group is the parent company, and Collective Loft is its flagship. The group is building four divisions that reinforce each other: the platform finds the talent, the studios give them a home, the label releases their work, and publishing protects everything they create. Each division makes every other one stronger.',
      },
      {
        q: 'What\u2019s coming after the platform?',
        a: 'Three more divisions, in sequence. Collective Loft Studios — professional recording infrastructure for independent artists, with priority booking and discounted rates for members. Collective Loft Records — an artist-first independent label starting royalty splits at 50/50, with shorter contracts and more ownership kept by the artist. And Collective Loft Publishing — a full creative publishing house spanning music, literary, and art publishing, including collaborative works unique to the ecosystem.',
      },
    ],
  },
]

export const metadata = {
  title: 'FAQ — Collective Loft',
  description: 'Everything you need to know about Collective Loft: how it works, membership and pricing, founding members, rights protection, and the bigger picture.',
}

export default function FAQPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_GROUPS.flatMap(g =>
      g.items.map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      }))
    ),
  }

  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg0: #F0ECE3;
          --bg1: #E8E3D9;
          --bg2: #DDD8CE;
          --cream: #1A1814;
          --gold: #8B6914;
          --gold2: #A07C1A;
          --teal: #2A7A68;
          --muted: rgba(26,24,20,0.55);
          --faint: rgba(26,24,20,0.1);
          --serif: 'Cormorant Garamond', Georgia, serif;
          --sans: 'DM Sans', system-ui, sans-serif;
        }

        html { scroll-behavior: smooth; }

        body {
          background: var(--bg1);
          color: var(--cream);
          font-family: var(--sans);
          font-weight: 300;
          line-height: 1.6;
          overflow-x: hidden;
        }

        body::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.035'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 999;
          opacity: 0.25;
        }

        nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 3rem;
          border-bottom: 0.5px solid var(--faint);
          background: rgba(240,236,227,0.92);
          backdrop-filter: blur(12px);
        }

        .nav-cta {
          font-family: var(--sans);
          font-size: 0.82rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--bg0);
          background: var(--gold);
          border: none;
          padding: 0.55rem 1.25rem;
          border-radius: 2px;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s;
        }
        .nav-cta:hover { background: var(--gold2); }

        .faq-hero {
          padding: 11rem 2rem 4rem;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .faq-hero-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(139,105,20,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139,105,20,0.06) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, black 0%, transparent 100%);
        }

        .eyebrow {
          font-family: var(--sans);
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--gold);
          opacity: 0.8;
          margin-bottom: 1.5rem;
          position: relative;
        }

        .faq-hero h1 {
          font-family: var(--serif);
          font-size: clamp(2.5rem, 6vw, 4.5rem);
          font-weight: 300;
          line-height: 1.1;
          color: var(--cream);
          margin-bottom: 1rem;
          position: relative;
        }
        .faq-hero h1 em { font-style: italic; color: var(--gold); }

        .faq-hero-sub {
          font-family: var(--sans);
          font-size: clamp(1rem, 2vw, 1.15rem);
          font-weight: 300;
          color: var(--muted);
          max-width: 560px;
          margin: 0 auto;
          line-height: 1.75;
          position: relative;
        }

        .faq-main {
          max-width: 760px;
          margin: 0 auto;
          padding: 3rem 2rem 7rem;
        }

        .faq-group { margin-bottom: 4.5rem; }
        .faq-group:last-child { margin-bottom: 0; }

        .faq-group-label {
          font-family: var(--sans);
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--gold);
          opacity: 0.75;
          padding-bottom: 1rem;
          margin-bottom: 0.5rem;
          border-bottom: 0.5px solid var(--faint);
        }

        .faq-item {
          padding: 2.25rem 0;
          border-bottom: 0.5px solid var(--faint);
        }
        .faq-item:last-child { border-bottom: none; }

        .faq-q {
          font-family: var(--serif);
          font-size: 1.4rem;
          font-weight: 400;
          color: var(--cream);
          margin-bottom: 0.75rem;
          line-height: 1.25;
        }

        .faq-a {
          font-family: var(--sans);
          font-size: 1rem;
          font-weight: 300;
          color: var(--muted);
          line-height: 1.8;
        }

        .faq-cta {
          text-align: center;
          background: var(--bg2);
          border-top: 0.5px solid var(--faint);
          padding: 6rem 2rem;
        }

        .faq-cta-inner { max-width: 560px; margin: 0 auto; }

        .faq-cta-mark {
          font-size: 1.5rem;
          color: var(--gold);
          margin-bottom: 1.5rem;
          display: block;
        }

        .faq-cta h2 {
          font-family: var(--serif);
          font-size: clamp(1.8rem, 4vw, 2.8rem);
          font-weight: 300;
          line-height: 1.15;
          color: var(--cream);
          margin-bottom: 1.5rem;
        }
        .faq-cta h2 em { font-style: italic; color: var(--gold); }

        .btn-primary {
          display: inline-block;
          font-family: var(--sans);
          font-size: 0.85rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--bg0);
          background: var(--gold);
          border: none;
          padding: 0.8rem 2rem;
          border-radius: 2px;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s;
        }
        .btn-primary:hover { background: var(--gold2); transform: translateY(-1px); }

        footer {
          border-top: 0.5px solid var(--faint);
          padding: 2.5rem 3rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .footer-logo { font-family: var(--serif); font-size: 1.2rem; color: var(--cream); text-decoration: none; }
        .footer-logo span { color: var(--gold); }
        .footer-links { display: flex; gap: 2rem; align-items: center; }

        .footer-link {
          font-family: var(--sans);
          font-size: 0.75rem;
          font-weight: 400;
          letter-spacing: 0.08em;
          color: rgba(26,24,20,0.4);
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-link:hover { color: rgba(26,24,20,0.7); }

        .footer-copy {
          font-family: var(--sans);
          font-size: 0.72rem;
          color: rgba(26,24,20,0.25);
          letter-spacing: 0.04em;
        }

        @media (max-width: 768px) {
          nav { padding: 1rem 1.5rem; }
          .faq-hero { padding: 9rem 1.5rem 3rem; }
          footer { flex-direction: column; gap: 1.5rem; text-align: center; }
          .footer-links { flex-wrap: wrap; justify-content: center; }
        }
      `}</style>

      <nav>
        <a href="/" className="footer-logo" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1, textDecoration: 'none' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', lineHeight: 1 }}>
            <span style={{ color: 'var(--gold)' }}>✦</span>
            <span style={{ color: '#1A1814', fontSize: '1.55rem' }}>Collective <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>Loft</em></span>
          </span>
          <span style={{ alignSelf: 'stretch', height: '0.5px', background: 'rgba(139,105,20,0.35)', margin: '5px 0' }} />
          <span style={{ fontFamily: 'var(--sans)', fontSize: '8.5px', letterSpacing: '0.18em', textTransform: 'uppercase', lineHeight: 1, color: 'var(--muted)' }}>Where creatives find each other</span>
        </a>
        <a href="/#waitlist" className="nav-cta">Request early access</a>
      </nav>

      <section className="faq-hero">
        <div className="faq-hero-grid"></div>
        <div className="eyebrow">Frequently asked questions</div>
        <h1>Everything you should<br/>know <em>before you join.</em></h1>
        <p className="faq-hero-sub">The full set. How it works, what it costs, how founding membership works, and how your work is protected.</p>
      </section>

      <main className="faq-main">
        {FAQ_GROUPS.map(group => (
          <div key={group.group} className="faq-group">
            <div className="faq-group-label">{group.group}</div>
            {group.items.map(item => (
              <div key={item.q} className="faq-item">
                <div className="faq-q">{item.q}</div>
                <div className="faq-a">{item.a}</div>
              </div>
            ))}
          </div>
        ))}
      </main>

      <section className="faq-cta">
        <div className="faq-cta-inner">
          <span className="faq-cta-mark">✦</span>
          <h2>Still have a question, or<br/>ready to <em>join the cohort?</em></h2>
          <a href="/#waitlist" className="btn-primary">Request early access ↗</a>
          <div style={{ marginTop: '1.5rem', fontFamily: 'var(--sans)', fontSize: '0.8rem', color: 'rgba(26,24,20,0.4)' }}>
            Or email us directly at <a href="mailto:help@collectiveloft.com" style={{ color: 'var(--gold)' }}>help@collectiveloft.com</a>
          </div>
        </div>
      </section>

      <footer>
        <a href="/" className="footer-logo" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', lineHeight: 1 }}>
            <span style={{ color: 'var(--gold)' }}>✦</span>
            <span style={{ color: '#1A1814' }}>Collective <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>Loft</em></span>
          </span>
          <span style={{ alignSelf: 'stretch', height: '0.5px', background: 'rgba(139,105,20,0.35)', margin: '4px 0' }} />
          <span style={{ fontFamily: 'var(--sans)', fontSize: '7.5px', letterSpacing: '0.18em', textTransform: 'uppercase', lineHeight: 1, color: 'var(--muted)' }}>Where creatives find each other</span>
        </a>
        <div className="footer-links">
          <a href="/#how-it-works" className="footer-link">How it works</a>
          <a href="/#waitlist" className="footer-link">Early access</a>
          <a href="/blog" className="footer-link">The Brief</a>
          <a href="https://www.instagram.com/the.collective.loft" target="_blank" rel="noopener noreferrer" className="footer-link">Instagram</a>
          <a href="mailto:help@collectiveloft.com" className="footer-link">Contact</a>
        </div>
        <div className="footer-copy">© 2026 Morgan Collective Group LLC</div>
      </footer>
    </>
  )
}
