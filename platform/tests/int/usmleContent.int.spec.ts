import { describe, expect, it } from 'vitest'

import { usmleContent } from '@/usmleContent'
import { formatDefinitions, subjectDefinitions } from '@/lib/subjects'

describe('USMLE content catalogue', () => {
  it('registers USMLE as a subject with the expected formats', () => {
    const usmle = subjectDefinitions.find((subject) => subject.slug === 'usmle')

    expect(usmle).toMatchObject({
      slug: 'usmle',
      title: 'USMLE',
    })
    expect(formatDefinitions.map((format) => format.slug)).toEqual([
      'cards',
      'test',
      'tickets',
      'clinical-cases',
      'image-cases',
    ])
  })

  it('covers every interactive format with complete original records', () => {
    const counts = usmleContent.reduce<Record<string, number>>((result, item) => {
      result[item.format] = (result[item.format] ?? 0) + 1
      return result
    }, {})

    expect(counts).toEqual({ card: 12, test: 12, ticket: 6, case: 6, 'image-case': 4 })
    expect(usmleContent).toHaveLength(40)

    for (const item of usmleContent) {
      expect(item.subject).toBe('USMLE')
      expect(item.published).toBe(true)
      expect(item.title).not.toHaveLength(0)
      expect(item.summary).not.toHaveLength(0)
      expect(item.question).not.toHaveLength(0)
      expect(item.answer).not.toHaveLength(0)
      expect(['public', 'registered', 'subscription']).toContain(item.visibility)
    }
  })

  it('keeps tests, tickets, and image cases actionable', () => {
    const tests = usmleContent.filter((item) => item.format === 'test')
    const tickets = usmleContent.filter((item) => item.format === 'ticket')
    const imageCases = usmleContent.filter((item) => item.format === 'image-case')

    for (const item of tests) {
      const options = item.sourceData.options
      expect(Array.isArray(options)).toBe(true)
      expect((options as Array<{ correct?: boolean }>).some((option) => option.correct)).toBe(true)
    }

    for (const item of tickets) {
      const answerPlan = item.sourceData.answerPlan
      expect(Array.isArray(answerPlan)).toBe(true)
      expect(answerPlan).toHaveLength(4)
    }

    for (const item of imageCases) {
      expect(item.sourceData.image).toMatch(/^\/assets\/usmle-[\w-]+\.svg$/)
      expect(item.sourceData.imageAlt).not.toHaveLength(0)
      expect(item.sourceData.sourceTitle).toBe('Авторская учебная схема Beep Academy')
    }
  })

  it('keeps a public entry path for the subject', () => {
    expect(usmleContent.filter((item) => item.visibility === 'public').length).toBeGreaterThanOrEqual(4)
  })
})
