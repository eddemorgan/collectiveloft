// Student membership rules, shared by the signup page, the subscribe page,
// and the /api/student routes.
//
// The account email is the credential. A member whose sign-in address ends in
// .edu can request a six-digit code, sent to that address, and entering it
// grants a year of free access (student_until on profiles). Owning the inbox
// is the proof: the code never travels anywhere except to the .edu address
// itself. Re-verification is the same flow run again, which is what makes the
// annual expiry honest. A graduate who loses the inbox loses the tier.
//
// US .edu only for now, because the school pitch starts with US liberal arts
// colleges. International academic domains (.ac.uk, .edu.au) are a deliberate
// later decision, not an oversight: each country's domain rules need their own
// look before they gate free membership.

export const STUDENT_MEMBERSHIP_DAYS = 365

// A code is useless to a shoulder-surfer twenty minutes after it lands.
export const CODE_TTL_MINUTES = 30

// Five wrong guesses burns the code. Six digits at five attempts is a
// 1-in-200,000 guessing game per code, and request rate limiting caps how
// often a new game starts.
export const CODE_MAX_ATTEMPTS = 5

// Returns the lowercased domain when the address is a usable .edu address,
// otherwise null. Rejects the bare 'edu' TLD with no institution in front of
// it, accepts department subdomains like cs.stanford.edu.
export function eduDomain(email) {
  const parts = String(email || '').trim().toLowerCase().split('@')
  if (parts.length !== 2) return null
  const domain = parts[1]
  if (!domain || domain === 'edu' || !domain.endsWith('.edu')) return null
  return domain
}

// True while a profile's student membership is current.
export function studentActive(profile) {
  return !!(profile && profile.student_until && new Date(profile.student_until) > new Date())
}
