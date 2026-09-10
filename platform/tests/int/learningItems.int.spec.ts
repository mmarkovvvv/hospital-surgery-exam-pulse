import { describe, expect, it } from 'vitest'

import {
  canReadVisibility,
  hasActiveSubscription,
  visibleLearningItemsWhere,
  type AccessUser,
} from '@/access/learningItems'

const now = new Date('2026-09-10T12:00:00.000Z')

describe('learning item visibility', () => {
  it('keeps public content available to anonymous visitors', () => {
    expect(canReadVisibility('public', null, now)).toBe(true)
    expect(canReadVisibility('registered', null, now)).toBe(false)
    expect(canReadVisibility('subscription', null, now)).toBe(false)
  })

  it('opens registration content to any authenticated student', () => {
    const user: AccessUser = { role: 'student', plan: 'free' }

    expect(canReadVisibility('public', user, now)).toBe(true)
    expect(canReadVisibility('registered', user, now)).toBe(true)
    expect(canReadVisibility('subscription', user, now)).toBe(false)
  })

  it('requires a non-expired subscriber entitlement', () => {
    const user: AccessUser = {
      role: 'student',
      plan: 'subscriber',
      subscriptionExpiresAt: '2026-09-11T00:00:00.000Z',
    }

    expect(hasActiveSubscription(user, now)).toBe(true)
    expect(canReadVisibility('subscription', user, now)).toBe(true)
    expect(
      hasActiveSubscription({ ...user, subscriptionExpiresAt: '2026-09-09T00:00:00.000Z' }, now),
    ).toBe(false)
  })

  it('gives admins access to every visibility tier', () => {
    const admin: AccessUser = { role: 'admin', plan: 'free' }

    expect(canReadVisibility('subscription', admin, now)).toBe(true)
    expect(visibleLearningItemsWhere(admin, now)).toBe(true)
  })

  it('builds a server-side query for anonymous visitors', () => {
    expect(visibleLearningItemsWhere(null, now)).toEqual({
      and: [{ published: { equals: true } }, { visibility: { in: ['public'] } }],
    })
  })
})
