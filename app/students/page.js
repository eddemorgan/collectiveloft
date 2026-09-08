import Link from 'next/link'
import Footer from '../components/Footer'
import styles from './students.module.css'

// The landing page for the student ad campaigns. Deliberately unlinked from
// nav, footer, and sitemap until Edde says otherwise: ads point here directly,
// which also makes attribution free. Anyone who signs up from /students came
// from an ad.

const STEPS = [
  {
    n: '01',
    title: 'Sign up with your school email',
    body: 'Your school address is your student ID here. No documents, no upload, no waiting on a human to approve you.',
  },
  {
    n: '02',
    title: 'Enter the six-digit code we send it',
    body: 'The code goes to your school inbox and nowhere else. Owning that inbox is the whole proof. Check spam if it hides.',
  },
  {
    n: '03',
    title: 'That’s it. You’re in.',
    body: 'Free for as long as you’re enrolled. Once a year we ask you to verify again, and that’s the entire cost.',
  },
]

export default function StudentsPage() {
  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.brand}>
            <span className={styles.mark}>✦</span>
            <span>
              <span className={styles.wm}>Collective <em>Loft</em></span>
              <span className={styles.tag}>Where creatives find each other</span>
            </span>
          </Link>
          <Link href="/signup" className={styles.join}>Join free</Link>
        </div>
      </nav>

      <header className={styles.hero}>
        <div className={styles.eyebrow}>For students</div>
        <h1 className={styles.h1}>Enrolled? <em>It&rsquo;s free.</em></h1>
        <p className={styles.sub}>
          Collective Loft is where creatives find collaborators, agree real terms before the work
          starts, and finish things that build a reputation. If you&rsquo;re a student, the whole
          platform costs you nothing. Verify your school email and you&rsquo;re in.
        </p>
        <Link href="/signup" className={styles.cta}>Join with your school email →</Link>
        <div className={styles.ctaNote}>No card. No trial clock. Nothing to cancel.</div>
      </header>

      <section className={styles.section}>
        <h2 className={styles.h2}>Not a student discount. The whole thing.</h2>
        <p className={styles.p}>
          Free students hold full membership. You appear in Discover and Matching. You post briefs
          that say what you&rsquo;re making and who you need. You reach out first. You agree
          compensation, rights, and timeline in writing before a single note or frame gets made,
          and then you work in a Loft Studio built for exactly that: files, milestones, and
          messages in one room. When it&rsquo;s done, you rate each other, and the finished work
          becomes part of a record anyone can trust.
        </p>
        <p className={styles.p}>
          Here&rsquo;s the part that matters at graduation. Most people leave school with a degree
          and a hard drive. You can leave with collaborators in six disciplines, a portfolio of
          finished work with real people, and a public record showing you deliver what you agree
          to. That record compounds, and it starts the day you join, not the day you need it.
        </p>
      </section>

      <section className={styles.sectionAlt}>
        <div className={styles.sectionInner}>
          <h2 className={styles.h2}>Why free? Because the fee was never about you.</h2>
          <p className={styles.p}>
            Membership costs $10 a month because the fee is a filter. People who exploit creatives
            do it by blasting hundreds of them at once, and making that cost money is what keeps
            this room clean. Students aren&rsquo;t the problem the fee exists to solve.
            You&rsquo;re the reason the room exists. So you get the room.
          </p>
          <p className={styles.p}>
            One more thing, because you grew up being the product: your data is never sold, rented,
            or licensed. Not as policy. As a term of the contract. If this platform ever shuts
            down, your data is deleted, not auctioned. Read it yourself in the{' '}
            <Link href="/legal/terms" className={styles.inlineLink}>Terms</Link>.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h2}>Ninety seconds, start to finish</h2>
        <div className={styles.steps}>
          {STEPS.map(s => (
            <div key={s.n} className={styles.step}>
              <div className={styles.stepN}>{s.n}</div>
              <div>
                <div className={styles.stepTitle}>{s.title}</div>
                <p className={styles.stepBody}>{s.body}</p>
              </div>
            </div>
          ))}
        </div>
        <p className={styles.fine}>
          Works wherever school email domains are reserved for real institutions: .edu in the US,
          .ac.uk in the UK, and around thirty more countries including Australia, Japan, India,
          Brazil, and South Africa. School on an ordinary domain? Tell us through the{' '}
          <Link href="/help" className={styles.inlineLink}>Help page</Link> and we&rsquo;ll work on it.
        </p>
      </section>

      <section className={styles.sectionAlt}>
        <div className={styles.sectionInner}>
          <h2 className={styles.h2}>Free membership is not free labor.</h2>
          <p className={styles.p}>
            Every collaboration here starts with terms: who owns what, who gets paid what, by when.
            Paid work is paid through the platform, and we take no cut of it. Your money moves from
            the person who hired you to you. A student membership costs nothing, and your work
            never will be the thing that&rsquo;s free.
          </p>
        </div>
      </section>

      <section className={styles.close}>
        <h2 className={styles.closeH}>Your people are <em>already looking.</em></h2>
        <p className={styles.closeSub}>
          Filmmakers who need composers. Writers who need illustrators. Producers who need vocalists.
          Show up with what you make, and be findable.
        </p>
        <Link href="/signup" className={styles.cta}>Join free with your school email →</Link>
      </section>

      <Footer />
    </div>
  )
}
