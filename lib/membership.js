// Membership tiers.
//
// Free members are real members. They have a profile, they appear in Discover
// and Matching, they can be reached, and once reached they answer, agree
// terms, run the Loft Studio, get paid, and build a rating. That last part is
// the point: a member who cannot finish work cannot earn a reputation, and the
// record of finished work is the thing this platform exists to produce.
//
// Membership is charged for STARTING things: posting a brief, and reaching out
// first. The member who initiates has a project. The member who answers is
// looking for work. Only one of those two has a budget, and it is not the one
// worth charging.
//
// It keeps the filter, and sharpens it. People who exploit creatives do it by
// contacting a great many of them at once, and that is now precisely the side
// that costs money. A door that locks out the people it was built to protect
// is not a filter, it is a shortage.
//
// The database enforces this, not the browser: public.is_paid_member() sits in
// the insert policies on briefs and collab_terms. Everything here is the UI
// telling the same truth in advance, so nobody meets a wall by surprise.

// Statuses that mean a live paid subscription. 'cancelled' is included on
// purpose: the processor marks a subscription cancelled the moment renewal is
// switched off, but the member has paid through the end of the period.
export const PAID_STATUSES = ['active', 'trialing', 'cancelled']

// May this member start things? Mirrors public.is_paid_member() exactly.
// Keep the two in step: if one changes, the other is now a lie.
export function canInitiate(profile) {
  if (!profile) return false
  if (PAID_STATUSES.includes(profile.subscription_status)) return true
  // A comp is a membership someone else is covering.
  if (profile.comped_until && new Date(profile.comped_until) > new Date()) return true
  // Terms 3.6: student membership grants full platform access, which includes
  // starting your own projects. A student filmmaker hiring a composer is the
  // whole idea.
  if (profile.student_until && new Date(profile.student_until) > new Date()) return true
  return false
}

// Which tier a member is on. For our own reporting only. Deliberately never
// rendered on a profile: nobody should be able to tell who pays, or the room
// acquires two classes and free members stop feeling like members.
export function membershipTier(profile) {
  if (!profile) return 'free'
  if (profile.student_until && new Date(profile.student_until) > new Date()) return 'student'
  if (PAID_STATUSES.includes(profile.subscription_status)) return 'paid'
  if (profile.comped_until && new Date(profile.comped_until) > new Date()) return 'comped'
  return 'free'
}

// What a free member is being asked to upgrade for. The key travels to
// /subscribe as ?why=, so the page names the action that sent them there
// instead of making a generic pitch at someone who was mid-thought.
export const UPGRADE_REASONS = {
  reach: {
    headline: 'Reaching out is a member feature.',
    line: 'Anyone can be found here and answer for free. Starting the conversation is what membership pays for.',
  },
  brief: {
    headline: 'Posting a brief is a member feature.',
    line: 'Say what you are making and who you need, and let the right people come to you. Answering briefs stays free.',
  },
  default: {
    headline: 'A room with a lock on the door.',
    line: 'Membership is what keeps the people who exploit creatives out, and it is what pays for the room.',
  },
}

export function upgradeReason(key) {
  return UPGRADE_REASONS[key] || UPGRADE_REASONS.default
}

// Where to send someone who tried to start something they cannot start yet.
export function upgradeHref(key) {
  return `/subscribe?why=${encodeURIComponent(key || 'default')}`
}
