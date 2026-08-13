// Single source of truth for the legal documents' identity.
//
// LEGAL_VERSION is recorded against every member's consent, so we always know
// which text a person actually agreed to. Bump it whenever the Terms or the
// Privacy Policy change materially, and update EFFECTIVE_DATE to match. The
// Terms promise registered members 14 days notice before material changes take
// effect, and the stored version is what makes that promise keepable.

export const LEGAL_VERSION = '2026-08-12'

// Shown at the top of both documents. Keep in step with LEGAL_VERSION.
export const EFFECTIVE_DATE = 'August 12, 2026'

// The address published in the Terms and the Privacy Policy for legal notices,
// DMCA, and data rights requests. It must be able to receive external mail.
export const LEGAL_CONTACT = 'hello@collectiveloft.com'

// Public URLs for the documents. /terms is already the collab terms builder,
// so the legal documents live under /legal.
export const TERMS_URL = '/legal/terms'
export const PRIVACY_URL = '/legal/privacy'
