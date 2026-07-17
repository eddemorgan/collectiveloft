'use client'

import Link from 'next/link'
import { TERMS_URL, PRIVACY_URL } from '../../lib/legal'
import styles from './guide.module.css'

const SECTIONS = [
  { id: 'account',  n: '1', t: 'Create your account' },
  { id: 'membership', n: '2', t: 'Your membership' },
  { id: 'profile',  n: '3', t: 'Build your profile' },
  { id: 'find',     n: '4', t: 'Find your people' },
  { id: 'terms',    n: '5', t: 'Agree on terms' },
  { id: 'studio',   n: '6', t: 'The Loft Studio' },
  { id: 'payouts',  n: '7', t: 'Getting paid' },
  { id: 'ratings',  n: '8', t: 'Community Voice' },
  { id: 'help',     n: '9', t: 'Getting help' },
]

export default function GuidePage() {
  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoRow}>
            <span className={styles.mark}>&#10022;</span>
            <span>Collective <em>Loft</em></span>
          </span>
          <span className={styles.tag}>Where creatives find each other</span>
        </Link>
      </nav>

      <div className={styles.wrap}>
        <div className={styles.eyebrow}>Member Guide</div>
        <h1 className={styles.title}>How Collective Loft works.</h1>
        <p className={styles.lede}>
          Everything from creating your account to getting paid for finished work. Collective Loft is a
          professional network for creatives who are serious about collaboration. Not a feed to perform for.
          Not a gig marketplace. A room with a lock on the door, where you find your people, agree on real
          terms, and do the work.
        </p>

        <nav className={styles.toc}>
          <div className={styles.tocLbl}>In this guide</div>
          <ul className={styles.tocList}>
            {SECTIONS.map(s => (
              <li key={s.id}>
                <a href={`#${s.id}`}><span className={styles.tocNum}>{s.n}</span>{s.t}</a>
              </li>
            ))}
          </ul>
        </nav>

        {/* 1 */}
        <section id="account" className={styles.section}>
          <div className={styles.sHead}><span className={styles.sNum}>1</span><h2 className={styles.sTitle}>Create your account</h2></div>
          <p className={styles.p}>
            Founding members arrive through a personal claim link sent by email. Click it, set a password, and
            you land straight in onboarding. Everyone else starts from the landing page.
          </p>
          <ol className={styles.steps}>
            <li>Click <strong>Join Collective Loft</strong> on the landing page.</li>
            <li>Enter your first name, last name, email, and a password of at least 8 characters.</li>
            <li>You are signed in immediately and taken to membership.</li>
          </ol>
          <div className={styles.note}>
            <div className={styles.calloutLbl}>Welcome email</div>
            <p>A welcome email lands in your inbox the moment you join. It comes from noreply@collectiveloft.com, so replies are not monitored. Questions always go through the Help page.</p>
          </div>
        </section>

        {/* 2 */}
        <section id="membership" className={styles.section}>
          <div className={styles.sHead}><span className={styles.sNum}>2</span><h2 className={styles.sTitle}>Your membership</h2></div>
          <p className={styles.p}>
            Membership is <strong>$15 a month</strong>, with a 7-day free trial. Your card is not charged until
            the trial ends, and you can cancel anytime before then at no cost.
          </p>
          <p className={styles.p}>
            The membership is the filter. It keeps the people who exploit creatives out, so everyone inside has
            agreed to real terms and has skin in the game. It is what keeps this a protected place to work.
          </p>
          <div className={styles.callout}>
            <div className={styles.calloutLbl}>Founding members</div>
            <p>If you joined through a founding claim link, your first 90 days are free. No card is needed to reach the platform. Near the end of that window you will be invited to add a card to continue at $15 a month.</p>
          </div>
          <p className={styles.p}>
            Manage or cancel your plan anytime from your profile. Cancelling stops the next renewal; you keep
            access through the end of the period you already paid for.
          </p>
        </section>

        {/* 3 */}
        <section id="profile" className={styles.section}>
          <div className={styles.sHead}><span className={styles.sNum}>3</span><h2 className={styles.sTitle}>Build your profile</h2></div>
          <p className={styles.p}>
            Your profile is how the right people find you. The fields that carry the most weight:
          </p>
          <ul className={styles.bullets}>
            <li><strong>Disciplines and skills.</strong> What you make, and specifically how. These drive discovery and matching.</li>
            <li><strong>Headline and bio.</strong> A line and a paragraph in your own voice. This is what a stranger reads first.</li>
            <li><strong>Right now.</strong> What you are actively working on, so people reach you about the right thing.</li>
            <li><strong>What you are seeking.</strong> The disciplines and skills you want to collaborate with.</li>
          </ul>
          <p className={styles.p}>
            You can edit any of this at any time from your profile. A fuller profile gets better matches, so it
            is worth returning to as your work changes.
          </p>
        </section>

        {/* 4 */}
        <section id="find" className={styles.section}>
          <div className={styles.sHead}><span className={styles.sNum}>4</span><h2 className={styles.sTitle}>Find your people</h2></div>
          <p className={styles.p}>There are three ways to find a collaborator, and they work together.</p>
          <div className={styles.h3}>Discover</div>
          <p className={styles.p}>Browse every creative on the platform. Filter by discipline, skill, and distance, and sort by who is recently active or has completed the most collaborations.</p>
          <div className={styles.h3}>Matching</div>
          <p className={styles.p}>A ranked view of the people who best fit what you are making now, based on your disciplines, skills, and collaboration history. Matches improve as your profile fills out.</p>
          <div className={styles.h3}>Collab Briefs</div>
          <p className={styles.p}>Post a brief that says what you are making and who you need. Other members apply, and you review them. Or apply to briefs others have posted. When someone applies to your brief, you get an email.</p>
        </section>

        {/* 5 */}
        <section id="terms" className={styles.section}>
          <div className={styles.sHead}><span className={styles.sNum}>5</span><h2 className={styles.sTitle}>Agree on terms</h2></div>
          <p className={styles.p}>
            Before any work begins, both people agree on terms. This is what makes Collective Loft different from
            a handshake: the agreement is written down, and it protects both sides.
          </p>
          <p className={styles.p}>You choose one of three compensation types:</p>
          <table className={styles.table}>
            <thead><tr><th>Type</th><th>What it means</th></tr></thead>
            <tbody>
              <tr><td><strong>Creative exchange</strong></td><td>Skills traded between the two of you. No money changes hands.</td></tr>
              <tr><td><strong>Paid</strong></td><td>One person pays the other. A fee, payment schedule, and rights are agreed upfront.</td></tr>
              <tr><td><strong>Revenue share</strong></td><td>No upfront fee. The two of you split revenue the work generates.</td></tr>
            </tbody>
          </table>
          <p className={styles.p}>
            Terms move back and forth until you both accept. One person proposes, the other can accept, modify,
            or decline, and each hand-off sends the other person an email. Once both accept, the terms lock and a
            Loft Studio opens automatically.
          </p>
        </section>

        {/* 6 */}
        <section id="studio" className={styles.section}>
          <div className={styles.sHead}><span className={styles.sNum}>6</span><h2 className={styles.sTitle}>The Loft Studio</h2></div>
          <p className={styles.p}>
            The Studio is the shared room where the work happens. It opens the moment terms are accepted, and
            holds everything about the collaboration in one place:
          </p>
          <ul className={styles.bullets}>
            <li><strong>Overview and terms.</strong> The agreement you both accepted, locked.</li>
            <li><strong>Milestones.</strong> Track the work from first draft to finished.</li>
            <li><strong>Files.</strong> Share drafts and deliverables.</li>
            <li><strong>Messages.</strong> A chat between the two of you, in the room with the work.</li>
          </ul>
          <div className={styles.h3}>Completing a collaboration</div>
          <p className={styles.p}>
            When the work is done, the collab owner confirms it complete. Both people are then invited by email
            to rate each other. Completing a collaboration is what builds your reputation on the platform, so it
            is worth doing properly.
          </p>
        </section>

        {/* 7. the payout section */}
        <section id="payouts" className={styles.section}>
          <div className={styles.sHead}><span className={styles.sNum}>7</span><h2 className={styles.sTitle}>Getting paid</h2></div>
          <p className={styles.p}>
            On a <strong>paid</strong> collaboration, money moves through Collective Loft directly to the person
            who did the work. Payments run on Stripe, the same service that handles your membership. To receive
            money, you set up a payout account once. After that, you are paid straight into your bank.
          </p>

          <div className={styles.callout}>
            <div className={styles.calloutLbl}>Two roles</div>
            <p>The person who owns the collaboration is the payer. The person they are working with is the recipient. Only paid collaborations move money. Creative exchange and revenue share do not run through this flow.</p>
          </div>

          <div className={styles.h3}>To receive payment: connect your payout account</div>
          <ol className={styles.steps}>
            <li>Go to <strong>your own profile</strong> and click <strong>Connect payout account</strong>.</li>
            <li>You are taken to Stripe to set up payouts. Stripe collects your bank details and the identity information it is legally required to verify. Collective Loft never sees your bank details.</li>
            <li>When you finish, you return to your profile and a <strong>Payout ready</strong> badge appears. If you leave partway through, the button reads <strong>Finish payout setup</strong> so you can pick up where you left off.</li>
          </ol>
          <div className={styles.note}>
            <div className={styles.calloutLbl}>Why the recipient sets up first</div>
            <p>A collaborator cannot be paid until their payout account is ready. Until then, the payer sees a note that payment is paused. If you are expecting to be paid, connect your payout account early so nothing holds up the work.</p>
          </div>

          <div className={styles.h3}>To pay a collaborator</div>
          <p className={styles.p}>
            Payment happens inside the Loft Studio, in the <strong>Payment</strong> section, and only the collab
            owner sees it. What you see depends on the payment schedule in your terms:
          </p>
          <ul className={styles.bullets}>
            <li><strong>On delivery or lump sum.</strong> One button pays the full agreed fee.</li>
            <li><strong>Milestone-based.</strong> Each milestone shows its share of the fee, and you pay them one at a time as the work lands.</li>
          </ul>
          <p className={styles.p}>
            Paying takes you to Stripe&rsquo;s secure checkout, the same as membership. When the payment clears,
            the Studio marks it paid and the money is on its way to your collaborator&rsquo;s bank.
          </p>

          <div className={styles.h3}>No platform fee</div>
          <p className={styles.p}>
            Collective Loft takes <strong>no fee</strong> on collaborations. The full agreed amount goes to the
            creative who did the work. On a $500 project, the creative receives $500. The platform is funded by
            membership, not by taking a cut of your work.
          </p>
        </section>

        {/* 8 */}
        <section id="ratings" className={styles.section}>
          <div className={styles.sHead}><span className={styles.sNum}>8</span><h2 className={styles.sTitle}>Community Voice</h2></div>
          <p className={styles.p}>
            Your reputation on Collective Loft is built from finished work, not followers. After a collaboration
            completes, you and your collaborator rate each other and can leave a review. Those ratings appear on
            your profile under Community Voice.
          </p>
          <p className={styles.p}>
            Ratings only ever come from real, completed collaborations, so they mean something. It is a slower
            and truer signal than a follower count, and it is what the next person reads when they consider
            working with you.
          </p>
        </section>

        {/* 9 */}
        <section id="help" className={styles.section}>
          <div className={styles.sHead}><span className={styles.sNum}>9</span><h2 className={styles.sTitle}>Getting help</h2></div>
          <p className={styles.p}>
            Questions go through the <Link href="/help">Help page</Link>. There is a short FAQ, and a contact
            form that reaches a real person. We reply to the address you give us. A member of the team reads
            every message.
          </p>
        </section>

        <div className={styles.footer}>
          <Link href="/help">Help</Link>
          <Link href={TERMS_URL}>Terms &amp; Conditions</Link>
          <Link href={PRIVACY_URL}>Privacy Policy</Link>
          <Link href="/">Back to Collective Loft</Link>
        </div>
      </div>
    </div>
  )
}
