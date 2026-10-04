// Single source of truth for the legal documents' identity.
//
// LEGAL_VERSION is recorded against every member's consent, so we always know
// which text a person actually agreed to. Bump it whenever the Terms or the
// Privacy Policy change materially, and update EFFECTIVE_DATE to match. The
// Terms promise registered members 14 days notice before material changes take
// effect, and the stored version is what makes that promise keepable.

export const LEGAL_VERSION = '2026-10-24'

// Shown at the top of both documents. Keep in step with LEGAL_VERSION.
//
// 2026-10-24: the Button-Up. Counsel reviewed the documents against Reverb,
// Threadless, Cameo and 37signals (the Illinois Button-Up report) and the
// drafting list shipped whole. Terms went 25 sections to 33: disclaimers and
// liability expanded with the greater-of-12-months-fees-or-$100 cap (17), Cook
// County venue and the FAA (19), the member-dispute release with the 1542
// waiver and the step-in rules (20), the full arbitration article with the
// informal step, AAA Consumer Rules, carve-outs, and the 30-DAY OPT-OUT
// (21.5), then eight new sections: Indemnification (24), Your Taxes (25),
// Ideas & Feedback (26), Platform Integrity (27), one-year Time to Bring
// Claims (28), Notices (29), Severability/Waiver/Assignment (30), Survival
// (31). CHANGES MOVED 24 -> 32 and CONTACT 25 -> 33: anything citing "Section
// 24" for the notice promise now means SECTION 32. Privacy gained the
// purpose-to-data mapping (3), full US-state rights + GPC (7.3), the GDPR
// legal bases and rights (7.4), breach notification per Illinois PIPA (8.3),
// and the BIPA no-biometrics statement (8.4), plus COPPA in 9.
//
// MATERIAL CHANGES. The 14-day notice (Section 32, was 24) applies: the
// notice email must go out by OCTOBER 10, 2026 or this date moves. Lawyer
// review of the drafted text happens before the notice goes. One blank
// remains for counsel: Section 29 names the registered agent by reference;
// pin the agent's name and street address when counsel confirms it.
// 2026-09-20: Privacy 8.1 and 8.2 added, disclosing where member data lives
// (Supabase us-west-1, Northern California; Vercel, United States) and the
// Standard Contractual Clauses behind EEA/UK/Swiss transfers, after the
// Supabase DPA (incorporated in their Terms automatically) was archived in
// Legal/ on the shared drive. A transparency ADDITION that takes nothing
// away, so it is effective immediately: Section 24's 14-day cycle governs
// material changes, and disclosing more is not one.
// 2026-09-14: third slide of this date, same cause. The notice has still not
// been sent, and every quiet day shrinks the gap below the 14 days Section 24
// promises. September 14 holds if the notice goes out by August 31. The send
// is blocked on the service and Resend keys, which exist nowhere on disk.
//
// 2026-09-11: the free tier (Terms 3.0, and the landing points named in 3.2,
// 3.3 and 3.6), the Data Covenant (Terms 15.2-15.4, Privacy section 1) and
// free student membership (Terms 3.6). The date was 2026-09-04 on the
// assumption the notice went out on 2026-08-21. It did not:
// scripts/send-legal-update.mjs has never been run, so the clock never
// started, and by 2026-08-23 September 4 was only 12 days out. Moved to
// September 7 so Section 24's 14 days still holds when the notice is sent.
// Send it before 2026-08-24, or move this date again.
//
// 2026-08-25, second pass: membership stopped deciding whether a person can
// be here and started deciding what they can start, so Terms 3 needed a
// definition of the free membership and of where a lapsed, cancelled or
// refunded account lands. Date moved 09-07 to 09-11 to keep a clear 14 days
// from a notice that still has not been sent. One notice now covers the
// Data Covenant, the student tier and the free tier together, which is why
// holding it was worth it.
//
// 2026-08-25: Terms 3.1 and 3.2 gained the 7-day free trial, which signup,
// subscribe, the FAQ, the Help page and the member guide have always promised
// and the contract never mentioned. Folded into this same pending version
// rather than a new one, because the notice has not gone out and 2026-09-07 is
// not yet in force, so nobody has relied on the text as it stands.
export const EFFECTIVE_DATE = 'October 24, 2026'

// The address published in the Terms and the Privacy Policy for legal notices,
// DMCA, and data rights requests. It must be able to receive external mail.
export const LEGAL_CONTACT = 'hello@collectiveloft.com'

// The exact marketing-consent wording, verbatim, everywhere the checkbox
// appears. The database stores this string next to each yes, because consent
// under UK and EU rules is consent to specific words, and proving it later
// means keeping them. Change the words and you change what people consented
// to, so never edit this in place: add a new constant and version it.
export const MARKETING_CONSENT_TEXT = 'Send me occasional updates about Collective Loft.'

// Public URLs for the documents. /terms is already the collab terms builder,
// so the legal documents live under /legal.
export const TERMS_URL = '/legal/terms'
export const PRIVACY_URL = '/legal/privacy'
