import type { LearningItem } from '@/lib/learning'

export type LearningOption = {
  id: string
  text: string
  correct: boolean
}

export type ImageDetails = {
  src: string
  alt: string
  sourceTitle?: string
  sourceUrl?: string
  license?: string
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function asText(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join('\n')
  return ''
}

function asTextArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map(asText).filter(Boolean)
}

export function sourceOf(item: LearningItem): Record<string, unknown> {
  return asRecord(item.sourceData)
}

export function promptOf(item: LearningItem): string {
  const source = sourceOf(item)
  return item.question || asText(source.question) || asText(source.scenario) || item.title
}

export function explanationOf(item: LearningItem): string {
  const source = sourceOf(item)
  return item.answer || asText(source.answer) || asText(source.explanation) || asText(source.diagnosis) || item.summary || item.title
}

export function topicsOf(item: LearningItem): string[] {
  const source = sourceOf(item)
  return asTextArray(source.topics)
}

export function stepsOf(item: LearningItem): string[] {
  const source = sourceOf(item)
  return asTextArray(source.steps)
}

export function diagnosisOf(item: LearningItem): string {
  const source = sourceOf(item)
  return asText(source.diagnosis) || explanationOf(item)
}

export function optionsOf(item: LearningItem): LearningOption[] {
  const source = sourceOf(item)
  const rawOptions = Array.isArray(source.options) ? source.options : Array.isArray(source.choices) ? source.choices : []
  const correctAnswer = source.correctAnswer
  const correctAnswers = new Set(Array.isArray(correctAnswer) ? correctAnswer.map(asText) : [asText(correctAnswer)].filter(Boolean))

  return rawOptions.map((rawOption, index) => {
    const option = asRecord(rawOption)
    const id = asText(option.id) || String.fromCharCode(97 + index)
    const text = asText(option.text) || asText(option.label) || asText(option.answer) || id
    const correct = Boolean(option.correct ?? option.isCorrect) || correctAnswers.has(id) || correctAnswers.has(text)
    return { id, text, correct }
  })
}

export function imageOf(item: LearningItem): ImageDetails | null {
  const source = sourceOf(item)
  const rawImage = asText(source.image)
  if (!rawImage) return null

  const src = rawImage.startsWith('/') ? rawImage : `/${rawImage}`
  return {
    src,
    alt: asText(source.imageAlt) || item.title,
    sourceTitle: asText(source.sourceTitle),
    sourceUrl: asText(source.sourceUrl),
    license: asText(source.license),
  }
}

export function expectedOptionIds(item: LearningItem): string[] {
  return optionsOf(item).filter((option) => option.correct).map((option) => option.id).sort()
}

