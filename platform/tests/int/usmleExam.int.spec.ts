import { describe, expect, it } from 'vitest'

import {
  ccsActions,
  formatExamTime,
  getBlockProgress,
  isUsmleSelectionCorrect,
  usmleExamModes,
  usmleQuestions,
} from '@/lib/usmleExam'

describe('USMLE exam simulator', () => {
  it('matches the current official block models', () => {
    expect(usmleExamModes.map(({ slug }) => slug)).toEqual([
      'step1-block',
      'step2ck-block',
      'step3-fip',
      'step3-acm',
      'ccs',
    ])
    expect(usmleExamModes[0]).toMatchObject({ blocks: 14, itemsPerBlock: 20, maximumItems: 280 })
    expect(usmleExamModes[1]).toMatchObject({ blocks: 16, itemsPerBlock: 20, maximumItems: 318 })
    expect(usmleExamModes[2]).toMatchObject({ blocks: 12, itemsPerBlock: 20, maximumItems: 232 })
    expect(usmleExamModes[3]).toMatchObject({ blocks: 9, itemsPerBlock: 20, maximumItems: 180 })
    expect(usmleExamModes[4]).toMatchObject({ blocks: 1, maximumItems: 14 })
  })

  it('checks one-best-answer and multiple-answer selections', () => {
    expect(isUsmleSelectionCorrect([1], [1])).toBe(true)
    expect(isUsmleSelectionCorrect([0], [1])).toBe(false)
    expect(isUsmleSelectionCorrect([1, 2], [1, 2])).toBe(true)
    expect(isUsmleSelectionCorrect([1], [1, 2])).toBe(false)
  })

  it('formats the timer and clamps block progress', () => {
    expect(formatExamTime(125)).toBe('02:05')
    expect(formatExamTime(0)).toBe('00:00')
    expect(getBlockProgress(-1, 10)).toBe(0)
    expect(getBlockProgress(5, 10)).toBe(50)
    expect(getBlockProgress(20, 10)).toBe(100)
  })

  it('represents official interaction types without mislabeling demos', () => {
    expect(usmleQuestions.some(({ kind }) => kind === 'sequential')).toBe(true)
    expect(usmleQuestions.some(({ kind }) => kind === 'chart')).toBe(true)
    expect(usmleQuestions.some(({ kind }) => kind === 'abstract')).toBe(true)
    expect(usmleQuestions.some(({ kind }) => kind === 'audio-video')).toBe(true)
    expect(ccsActions.length).toBeGreaterThanOrEqual(5)
    expect(usmleQuestions.every(({ sourceLabel }) => sourceLabel.includes('Авторская'))).toBe(true)
  })
})
