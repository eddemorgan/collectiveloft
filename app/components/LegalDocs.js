// The Terms and the Privacy Policy, rendered from one place.
//
// These used to live inline in the onboarding modal, with a second, unreachable
// copy sitting in app/public/*.html. Two copies of a legal document drift, and
// the drift is invisible until it matters. This is now the only copy.
//
// Rendered by the onboarding consent modal and by the public pages at
// /legal/terms and /legal/privacy, so a member can read what they agreed to
// at any time, not only during signup.

import { EFFECTIVE_DATE, LEGAL_CONTACT } from '../../lib/legal'

const s = {
  p: () => ({ fontSize:'0.78rem', color:'var(--cream)', lineHeight:1.75, fontWeight:300, marginBottom:'0.75rem' }),
  h: () => ({ fontFamily:'var(--serif)', fontSize:'1.05rem', fontWeight:700, color:'var(--cream)', marginBottom:'0.5rem', marginTop:'1.5rem', paddingTop:'1rem', borderTop:'0.5px solid var(--rule)' }),
  sub: () => ({ fontSize:'0.72rem', fontWeight:600, color:'var(--gold)', marginBottom:'0.35rem', marginTop:'1rem', letterSpacing:'0.02em' }),
  li: () => ({ fontSize:'0.76rem', color:'var(--muted)', lineHeight:1.65, paddingLeft:'1rem', position:'relative', marginBottom:'0.25rem' }),
  caps: () => ({ fontSize:'0.74rem', color:'var(--cream)', lineHeight:1.7, fontWeight:500, marginBottom:'0.75rem' }),
}

const Sec = ({num, title, children}) => (
  <div style={{marginBottom:'0.5rem'}}>
    <div style={s.h()}><span style={{color:'var(--gold)',marginRight:'0.5rem'}}>{num}.</span>{title}</div>
    {children}
  </div>
)
const P = ({children}) => <p style={s.p()}>{children}</p>
const Sub = ({children}) => <div style={s.sub()}>{children}</div>
const Ul = ({items}) => (
  <ul style={{listStyle:'none',padding:0,margin:'0 0 0.75rem 0'}}>
    {items.map((item,i) => (
      <li key={i} style={s.li()}>
        <span style={{position:'absolute',left:0,color:'var(--gold)',fontSize:'0.55rem',top:'0.2rem'}}>○</span>
        {item}
      </li>
    ))}
  </ul>
)
const Caps = ({children}) => <p style={s.caps()}>{children}</p>

export const TermsDoc = () => (
  <div style={{fontFamily:'var(--sans)'}}>
    <div style={{background:'rgba(201,168,76,0.06)',border:'0.5px solid rgba(201,168,76,0.15)',borderRadius:'4px',padding:'1rem',marginBottom:'1.5rem'}}>
      <P>Welcome to Collective Loft. These Terms & Conditions govern your access to and use of the Collective Loft platform, website, applications, services, collaboration systems, creator tools, community features, and subscription offerings (collectively, the "Platform"). By accessing or using the Platform, you agree to be bound by these Terms. If you do not agree, you may not use the Platform.</P>
      <div style={{fontSize:'0.68rem',color:'var(--muted)',display:'flex',gap:'1rem',flexWrap:'wrap'}}>
        <span>Effective Date: {EFFECTIVE_DATE}</span><span>·</span><span>collectiveloft.com</span><span>·</span><span>{LEGAL_CONTACT}</span><span>·</span><span>Morgan Collective Group LLC · Chicago, Illinois</span>
      </div>
    </div>
    <Sec num="1" title="Platform Overview"><P>Collective Loft is not a traditional freelance marketplace, portfolio site, job board, or social media feed. The Platform exists to facilitate creative collaboration through creator identity profiles, collaboration briefs, discipline matching, Loft Studios, and structured collaboration terms.</P><Ul items={['Creative Profiles and Right Now project cards','Collaboration Briefs and application systems','Discipline Matching systems','Loft Studios: shared project workspaces','Shared files, notes, and milestone tracking','Community Voice ratings and reviews','Messaging and communication tools','Collaboration term agreements','Subscription services']}/></Sec>
    <Sec num="2" title="Eligibility"><P>You must be at least 18 years old to use the Platform. Collective Loft is designed for working creative professionals. We do not permit use by individuals under 18 under any circumstances, including with parental consent. By creating an account, you represent and warrant that you are 18 years of age or older and have the full legal authority to enter into binding agreements. Your use of the Platform must comply with all applicable local, state, national, and international laws and regulations.</P></Sec>
    <Sec num="3" title="Subscription & Billing">
      <div style={{background:'rgba(201,168,76,0.1)',border:'0.5px solid rgba(201,168,76,0.25)',borderRadius:'3px',padding:'0.6rem 1rem',marginBottom:'0.75rem'}}><span style={{fontFamily:'var(--serif)',fontSize:'1.2rem',color:'var(--gold)',fontWeight:700}}>$15 USD / month</span></div>
      <Sub>3.1 Billing</Sub><P>By subscribing, you authorize our merchant of record, Paddle.com Market Ltd, to automatically charge your selected payment method on a recurring monthly basis at the then-current subscription rate. Paddle is the seller of record for Collective Loft memberships and handles applicable sales tax, VAT, and GST.</P>
      <Sub>3.2 Renewal & Cancellation</Sub><Ul items={['Subscriptions automatically renew each month unless canceled before the next billing cycle','You may cancel at any time through your account settings','Upon cancellation, your access continues through the end of your current paid billing period, not terminated immediately','No partial-month refunds unless required by applicable law']}/>
      <Sub>3.3 Price Changes</Sub><P>We will provide at least 30 days advance notice of any pricing changes via email. Continued use after the effective date constitutes acceptance of new pricing.</P>
      <Sub>3.4 Payment Processor Terms</Sub><P>Membership billing is handled by Paddle as merchant of record and is subject to Paddle's terms of service and privacy policy. Payments between members for collaborations are processed by Stripe through Stripe Connect and are subject to Stripe's terms. Collective Loft is not responsible for payment processing errors, disputes, or issues arising from either provider's systems.</P>
    </Sec>
    <Sec num="4" title="Creator Profiles & Identity"><P>Collective Loft profiles are designed as creative professional identities rather than traditional résumés. You are solely responsible for all information and content submitted to your profile. You agree not to:</P><Ul items={['Impersonate another individual or entity','Submit false collaboration history or fabricated credentials','Manipulate ratings, reviews, or trust systems','Use automated bots, scripts, or fake engagement systems','Create multiple accounts to circumvent platform rules or suspensions']}/></Sec>
    <Sec num="5" title="Collaboration Briefs & Matching"><P>Users may create or respond to Collaboration Briefs describing creative projects, collaborator needs, compensation arrangements, timelines, and project goals. Collective Loft does not guarantee:</P><Ul items={['Project completion or successful collaboration outcomes','Collaboration compatibility between users','Financial outcomes or revenue generation','Match quality or algorithm accuracy']}/><P>Discipline Matching systems are algorithmic recommendation tools only, not endorsements, certifications, or guarantees of any kind.</P></Sec>
    <Sec num="6" title="Loft Studios"><P>A Loft Studio is a shared collaboration workspace that opens when users mutually agree to collaborate by accepting Collab Terms. Loft Studios include shared milestones, deliverable tracking, shared files, shared notes, chat history, timestamped activity records, and collaboration terms.</P><P>Users acknowledge that activity history and collaboration records may remain associated with completed projects as part of the Platform's trust and reputation infrastructure, even after a subscription is canceled or an account is closed.</P></Sec>
    <Sec num="7" title="Collab Terms & Creative Agreements"><P>Before beginning work, collaborating parties may negotiate and agree upon deliverables, timelines, rights transfer terms, revenue share percentages, milestone structures, compensation arrangements, and creative exchange terms through the Platform's Collab Terms system.</P><P>Collective Loft is not a legal representative, employer, talent agency, escrow service, or contracting party to agreements between users.</P></Sec>
    <Sec num="8" title="Types of Collaboration"><Ul items={['Creative Exchange: skills traded between parties, no money changes hands','Paid Collaboration: fee agreed upfront between parties','Revenue Share: parties split revenue generated by the work']}/><P>Collective Loft does not process escrow services, guarantee payment enforcement, or act as intermediary in financial transactions between users.</P></Sec>
    <Sec num="9" title="Content Ownership & License"><P>Creators retain full ownership of content they upload to the Platform. By uploading content, you grant Collective Loft a worldwide, non-exclusive, royalty-free license to host, display, store, and technically process your content solely as necessary to operate the Platform.</P></Sec>
    <Sec num="10" title="Community Voice & Reputation"><Ul items={['Ratings and reviews must be honest, accurate, and made in good faith based on your direct collaboration experience','Harassment, retaliation, defamation, or coordinated review manipulation is prohibited','Collective Loft may remove reviews that violate these Terms or are fraudulent, abusive, or defamatory','All moderation decisions are made at Collective Loft\'s sole discretion and are final']}/></Sec>
    <Sec num="11" title="Email Communications"><P>By creating an account, you consent to receive transactional emails including a welcome message, password resets, notification when someone applies to your brief, collaboration term notifications, rating prompts when a collaboration completes, billing notifications, and platform policy changes. These are service messages, not marketing. We do not send promotional email to members who have not asked for it.</P></Sec>
    <Sec num="12" title="Acceptable Use"><Ul items={['Harass, threaten, intimidate, or abuse other users','Upload illegal, infringing, stolen, or unauthorized content','Share malware, malicious code, or harmful content','Attempt unauthorized access to any system, account, or data','Scrape, crawl, or systematically harvest Platform data','Manipulate matching, rating, or reputation systems','Circumvent subscription fees or access controls','Use the Platform for any unlawful purpose','Impersonate Collective Loft staff or representatives']}/></Sec>
    <Sec num="13" title="Intellectual Property"><P>All Platform branding, logos, systems, interfaces, software, workflows, visual design, matching systems, and proprietary technology are owned by Collective Loft and Morgan Collective Group LLC.</P></Sec>
    <Sec num="14" title="Copyright & DMCA"><P>Submit DMCA takedown notices to hello@collectiveloft.com including: identification of the copyrighted work, identification of the infringing material and its location, your contact information, a good faith statement, and a statement under penalty of perjury that you are authorized to act on behalf of the copyright owner.</P></Sec>
    <Sec num="15" title="Privacy & Data"><P>Your use of the Platform is governed by our Privacy Policy, available at collectiveloft.com/legal/privacy and linked from the footer of the Platform and from the Help page.</P></Sec>
    <Sec num="16" title="Disclaimers"><Caps>THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND.</Caps></Sec>
    <Sec num="17" title="Limitation of Liability"><Caps>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, COLLECTIVE LOFT AND MORGAN COLLECTIVE GROUP LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, PUNITIVE, OR SPECIAL DAMAGES.</Caps></Sec>
    <Sec num="18" title="Termination"><P>Collective Loft may suspend or terminate accounts at its sole discretion. Users may terminate at any time. Access continues through the end of the current paid billing period.</P></Sec>
    <Sec num="19" title="Governing Law"><P>These Terms are governed by the laws of the State of Illinois. Disputes not subject to arbitration shall be resolved in courts located in Chicago, Illinois.</P></Sec>
    <Sec num="20" title="User Disputes & Platform Non-Liability"><P>Collective Loft and Morgan Collective Group LLC are not parties to agreements between users. All collaborations, payments, rights transfers, and business arrangements are solely between participating users.</P></Sec>
    <Sec num="21" title="Mandatory Arbitration & Class Action Waiver"><P>By using the Platform, you agree that any dispute arising out of or relating to these Terms shall be resolved through binding individual arbitration in Chicago, Illinois under AAA rules.</P><Caps>YOU WAIVE ANY RIGHT TO PARTICIPATE IN CLASS ACTIONS, CLASS ARBITRATIONS, OR REPRESENTATIVE PROCEEDINGS AGAINST COLLECTIVE LOFT OR MORGAN COLLECTIVE GROUP LLC.</Caps></Sec>
    <Sec num="22" title="Creator Verification Disclaimer"><P>Profile completion indicators, collaboration history counts, Community Voice ratings, and trust signals are informational only, not endorsements, certifications, or background checks of any kind.</P></Sec>
    <Sec num="23" title="Collaborative Works & Rights Ownership"><P>Rights related to collaborative works are determined solely by agreements between participating users.</P></Sec>
    <Sec num="24" title="Changes to Terms"><P>We will notify registered users by email at least 14 days before material changes take effect.</P></Sec>
    <Sec num="25" title="Contact Information">
      <div style={{background:'var(--bg1)',border:'0.5px solid var(--rule)',borderRadius:'3px',padding:'1rem',fontSize:'0.78rem',color:'var(--muted)',lineHeight:1.8}}>
        Collective Loft · Morgan Collective Group LLC<br/>Chicago, Illinois<br/>hello@collectiveloft.com · collectiveloft.com
      </div>
    </Sec>
  </div>
)

export const PrivacyDoc = () => (
  <div style={{fontFamily:'var(--sans)'}}>
    <div style={{background:'rgba(201,168,76,0.06)',border:'0.5px solid rgba(201,168,76,0.15)',borderRadius:'4px',padding:'1rem',marginBottom:'1.5rem'}}>
      <P>Collective Loft is committed to protecting your privacy. This Privacy Policy explains what information we collect, how we use it, who we share it with, and what rights you have regarding your data.</P>
      <div style={{fontSize:'0.68rem',color:'var(--muted)',display:'flex',gap:'1rem',flexWrap:'wrap'}}>
        <span>Effective Date: {EFFECTIVE_DATE}</span><span>·</span><span>collectiveloft.com</span><span>·</span><span>{LEGAL_CONTACT}</span><span>·</span><span>Morgan Collective Group LLC · Chicago, Illinois</span>
      </div>
    </div>
    <Sec num="1" title="Information We Collect">
      <Sub>1.1 Information You Provide Directly</Sub><Ul items={['Name and email address','Password (stored encrypted)','Location (country, state, city)','Creative profile: disciplines, skills, bio, headline, Right Now card, portfolio links, social links','Collaboration preferences','Uploaded content: portfolio files, studio files, profile and cover images','Messages and communications within Loft Studios','Collaboration terms you create or accept','Ratings and reviews you submit','Payment information (processed by Paddle for membership, Stripe for collaboration payments)']}/>
      <Sub>1.2 Information Collected Automatically</Sub><Ul items={['Log data: IP address, browser type, pages visited, time spent','Device information: device type, operating system, browser version','Usage data: features used, actions taken, collaboration activity','Session data: authentication tokens managed by Supabase Auth','Analytics data via Google Analytics']}/>
      <Sub>1.3 Cookies & Tracking Technologies</Sub><Ul items={['Authentication cookies (Supabase): maintain your logged-in session. Required for Platform functionality.','Google Analytics cookies: understand how users navigate the Platform.']}/>
      <P>We do not use advertising cookies, third-party tracking pixels, or behavioral targeting technologies beyond those described above.</P>
    </Sec>
    <Sec num="2" title="How We Use Your Information"><Ul items={['Create and manage your account','Provide, operate, and improve the Platform','Power the Discipline Matching algorithm','Enable Briefs, Terms, and Loft Studio features','Process membership payments through Paddle and collaboration payments through Stripe','Send transactional emails','Display your profile to other users','Generate and display Community Voice ratings and reviews','Analyze Platform usage to improve features','Respond to support requests and resolve disputes','Comply with legal obligations']}/>
      <div style={{background:'rgba(86,179,156,0.08)',border:'0.5px solid rgba(86,179,156,0.25)',borderRadius:'3px',padding:'0.75rem 1rem',fontSize:'0.78rem',color:'var(--teal)',marginBottom:'0.75rem'}}>We do not sell your personal data. We do not use your data to serve third-party advertising.</div>
    </Sec>
    <Sec num="3" title="How We Share Your Information">
      <Sub>3.1 With Other Users (visible by default)</Sub><Ul items={['Name, headline, bio, and Right Now card','Disciplines, skills, and collaboration preferences','Location','Portfolio links and social links','Collaboration history','Community Voice rating and reviews']}/>
      <Sub>3.2 With Service Providers</Sub>
      {[['Supabase','Database, auth, storage, realtime'],['Vercel','Platform hosting and deployment'],['Paddle','Membership billing (merchant of record)'],['Stripe','Collaboration payments and member payouts'],['Resend','Transactional email delivery'],['Google Analytics','Platform usage analytics (anonymized)']].map(([p,pu]) => (
        <div key={p} style={{display:'flex',gap:'1rem',padding:'0.3rem 0',borderBottom:'0.5px solid var(--rule)',fontSize:'0.75rem'}}>
          <span style={{color:'var(--gold)',fontWeight:500,minWidth:'120px'}}>{p}</span>
          <span style={{color:'var(--muted)'}}>{pu}</span>
        </div>
      ))}
      <div style={{height:'0.75rem'}}/>
      <Sub>3.3 Legal Disclosures</Sub><P>We may disclose your information when required by law, subpoena, court order, or government request.</P>
    </Sec>
    <Sec num="4" title="Payment Data"><P>Collective Loft does not store your full payment card information. Membership billing is handled by Paddle as merchant of record; collaboration payments are handled by Stripe.</P></Sec>
    <Sec num="5" title="Data Retention">
      {[['Active account data','Life of account'],['Completed Loft Studio records','Indefinitely as part of collaboration history'],['Billing records','7 years (tax and legal compliance)'],['System backups','Purged within 90 days'],['Google Analytics data','~26 months']].map(([t,r]) => (
        <div key={t} style={{display:'flex',justifyContent:'space-between',padding:'0.3rem 0',borderBottom:'0.5px solid var(--rule)',fontSize:'0.75rem'}}>
          <span style={{color:'var(--muted)'}}>{t}</span>
          <span style={{color:'var(--muted)',textAlign:'right',maxWidth:'55%'}}>{r}</span>
        </div>
      ))}
      <div style={{height:'0.5rem'}}/>
    </Sec>
    <Sec num="6" title="Your Rights & Choices">
      <Sub>6.1 Access & Correction</Sub><P>Update your profile information directly through your account settings at any time.</P>
      <Sub>6.2 Account Deletion</Sub><P>Contact hello@collectiveloft.com to request deletion. We process requests within 30 days.</P>
      <Sub>6.3 California Residents (CCPA)</Sub><P>California residents have rights under the CCPA. We do not sell personal information. Contact hello@collectiveloft.com.</P>
      <Sub>6.4 European Users (GDPR)</Sub><P>Users in the EEA, UK, or Switzerland have rights under GDPR. Contact hello@collectiveloft.com.</P>
    </Sec>
    <Sec num="7" title="Data Security"><Ul items={['Encrypted data transmission (HTTPS/TLS)','Encrypted password storage (managed by Supabase Auth)','Row Level Security (RLS) enforced at the database level','Access controls limiting staff access to user data']}/></Sec>
    <Sec num="8" title="Children's Privacy"><P>The Platform is exclusively for users 18 years of age or older. We do not knowingly collect personal information from anyone under 18.</P></Sec>
    <Sec num="9" title="Changes to This Policy"><P>We will notify you by email at least 14 days before material changes take effect.</P></Sec>
    <Sec num="10" title="Contact Us">
      <div style={{background:'var(--bg1)',border:'0.5px solid var(--rule)',borderRadius:'3px',padding:'1rem',fontSize:'0.78rem',color:'var(--muted)',lineHeight:1.8}}>
        Collective Loft · Morgan Collective Group LLC<br/>Chicago, Illinois<br/>hello@collectiveloft.com · collectiveloft.com
      </div>
    </Sec>
  </div>
)

