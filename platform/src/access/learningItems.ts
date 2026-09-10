import type { Where } from 'payload'

export type LearningVisibility = 'public' | 'registered' | 'subscription'

export type AccessUser = {
  role?: 'admin' | 'student' | null
  plan?: 'free' | 'subscriber' | null
  subscriptionExpiresAt?: string | null
}

export function hasActiveSubscription(user: AccessUser | null | undefined, now = new Date()): boolean {
  if (!user || user.role === 'admin' || user.plan !== 'subscriber') return false
  if (!user.subscriptionExpiresAt) return false
  return new Date(user.subscriptionExpiresAt).getTime() > now.getTime()
}

export function canReadVisibility(
  visibility: LearningVisibility,
  user: AccessUser | null | undefined,
  now = new Date(),
): boolean {
  if (visibility === 'public') return true
  if (!user) return false
  if (user.role === 'admin') return true
  if (visibility === 'registered') return true
  return hasActiveSubscription(user, now)
}

export function visibleLearningItemsWhere(
  user: AccessUser | null | undefined,
  now = new Date(),
): Where | true {
  if (user?.role === 'admin') return true

  const visibilities: LearningVisibility[] = ['public']
  if (user) visibilities.push('registered')
  if (hasActiveSubscription(user, now)) visibilities.push('subscription')

  return {
    and: [
      { published: { equals: true } },
      { visibility: { in: visibilities } },
    ],
  }
}
