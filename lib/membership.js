// Membership tiers.
//
// Free members are full members. They have a real profile, they appear in
// Discover and Matching, they can be reached, they can answer, agree terms,
// run collaborations, and build a rating. They are the supply the platform
// exists to make findable, and charging them to be found is the thing this
// platform was built to argue against.
//
// Membership is charged for starting things: reaching out to someone, and
// posting a brief. The member who initiates has a project. The member who
// answers is looking for work. Only one of those two has a budget, and it is
// not the one we used to charge.
//
// It also keeps the filter the paywall was there for. The people who exploit
// creatives do it by contacting many of them at once, and that is exactly the
// side that now costs money.

// Statuses that mean a live paid subscription. 'cancelled' is included on
// purpose: the processor marks a subscription cancelled the moment someone
// turns off renewal, but they have paid through the end of the period.
const PAID_STATUSES = ['active', 'trialing', 'cancelled']

export function isPaidMember(profile) {
  if (!profile) return false
  if (PAID_STATUSES.includes(profile.subscription_status)) return true
  // A comp is a paid membership someone else is covering.
  if (profile.comped_until && new Date(profile.comped_until) > new Date()) return true
  return false
}

// What a free member is asked to upgrade for. The key is passed to /subscribe
// so the page can say which action prompted it instead of a generic pitch.
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
