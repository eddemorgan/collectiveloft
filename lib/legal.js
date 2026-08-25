// Single source of truth for the legal documents' identity.
//
// LEGAL_VERSION is recorded against every member's consent, so we always know
// which text a person actually agreed to. Bump it whenever the Terms or the
// Privacy Policy change materially, and update EFFECTIVE_DATE to match. The
// Terms promise registered members 14 days notice before material changes take
// effect, and the stored version is what makes that promise keepable.

export const LEGAL_VERSION = '2026-09-11'

// Shown at the top of both documents. Keep in step with LEGAL_VERSION.
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
export const EFFECTIVE_DATE = 'September 11, 2026'

// The address published in the Terms and the Privacy Policy for legal notices,
// DMCA, and data rights requests. It must be able to receive external mail.
export const LEGAL_CONTACT = 'hello@collectiveloft.com'

// Public URLs for the documents. /terms is already the collab terms builder,
// so the legal documents live under /legal.
export const TERMS_URL = '/legal/terms'
export const PRIVACY_URL = '/legal/privacy'
