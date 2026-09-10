import 'dotenv/config'

import fs from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'

import { getPayload } from 'payload'

import config from './payload.config'

type SourceRecord = Record<string, unknown>

type ImportRecord = {
  title: string
  slug: string
  subject: string
  format: 'card' | 'test' | 'ticket' | 'case' | 'image-case'
  visibility: 'public' | 'registered' | 'subscription'
  published: true
  summary: string
  question?: string
  answer: string
  sourceData: SourceRecord
}

function findBalancedExpression(source: string, startIndex: number, opening: string, closing: string): string {
  const openingIndex = source.indexOf(opening, startIndex)
  if (openingIndex === -1) throw new Error(`Could not find ${opening}`)

  let depth = 0
  let quote = ''
  let escaped = false

  for (let index = openingIndex; index < source.length; index += 1) {
    const character = source[index]

    if (quote) {
      if (escaped) {
        escaped = false
      } else if (character === '\\') {
        escaped = true
      } else if (character === quote) {
        quote = ''
      }
      continue
    }

    if (character === '"' || character === "'" || character === '`') {
      quote = character
      continue
    }

    if (character === opening) depth += 1
    if (character === closing) depth -= 1
    if (depth === 0) return source.slice(openingIndex, index + 1)
  }

  throw new Error(`Could not close ${opening}`)
}

function extractConstArray(source: string, name: string): SourceRecord[] {
  const declarationIndex = source.indexOf(`const ${name} =`)
  if (declarationIndex === -1) return []
  const expression = findBalancedExpression(source, declarationIndex, '[', ']')
  return Function(`"use strict"; return (${expression})`)() as SourceRecord[]
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function asText(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join('\n')
  if (value && typeof value === 'object') return JSON.stringify(value, null, 2)
  return value == null ? '' : String(value)
}

function recordTitle(record: SourceRecord, fallback: string): string {
  return asText(record.title || record.name || record.question || record.scenario || fallback)
}

function recordSummary(record: SourceRecord): string {
  return asText(record.summary || record.scenario || record.question || record.topics || record.title)
}

function recordAnswer(record: SourceRecord): string {
  const answer = record.answer || record.explanation || record.diagnosis || record.answerPlan || record.steps
  return asText(answer || record.summary || record.scenario || record.question || record.title || record.name)
}

function makeImportRecord(
  record: SourceRecord,
  subject: string,
  format: ImportRecord['format'],
  index: number,
  visibility: ImportRecord['visibility'],
): ImportRecord {
  const title = recordTitle(record, `${format} ${index + 1}`)
  const identifier = asText(record.id || record.number || index + 1)

  const answer = recordAnswer(record) || `Исходный материал импортирован из раздела «${subject}».`

  return {
    title,
    slug: `${slugify(subject)}-${format}-${slugify(identifier)}-${slugify(title)}`,
    subject,
    format,
    visibility,
    published: true,
    summary: recordSummary(record),
    question: asText(record.question || record.scenario || title),
    answer,
    sourceData: record,
  }
}

async function loadOzzExpanded(filePath: string): Promise<Record<string, SourceRecord[]>> {
  const source = await fs.readFile(filePath, 'utf8')
  const sandbox: { window: { OZZ_EXPANDED?: Record<string, SourceRecord[]> } } = { window: {} }
  vm.runInNewContext(source, sandbox, { timeout: 3000 })
  return sandbox.window.OZZ_EXPANDED || {}
}

async function main() {
  const projectRoot = path.resolve(process.cwd(), '..')
  const surgerySource = await fs.readFile(path.join(projectRoot, 'app.js'), 'utf8')
  const ozzExpanded = await loadOzzExpanded(path.join(projectRoot, 'ozz-expanded.js'))
  const visibility = (process.env.IMPORT_VISIBILITY || 'registered') as ImportRecord['visibility']

  if (!['public', 'registered', 'subscription'].includes(visibility)) {
    throw new Error('IMPORT_VISIBILITY must be public, registered, or subscription')
  }

  const surgery: ImportRecord[] = []
  const surgeryDefinitions: Array<[string, ImportRecord['format']]> = [
    ['cards', 'card'],
    ['tickets', 'ticket'],
    ['cases', 'case'],
    ['imageCases', 'image-case'],
    ['testQuestions', 'test'],
  ]

  for (const [name, format] of surgeryDefinitions) {
    const records = extractConstArray(surgerySource, name)
    surgery.push(
      ...records.map((record, index) =>
        makeImportRecord(record, 'Госпитальная хирургия', format, index, visibility),
      ),
    )
  }

  const ozz: ImportRecord[] = []
  const ozzDefinitions: Array<[string, ImportRecord['format']]> = [
    ['cards', 'card'],
    ['tickets', 'ticket'],
    ['tests', 'test'],
    ['cases', 'case'],
    ['imageCases', 'image-case'],
    ['examTickets', 'ticket'],
    ['examTests', 'test'],
  ]

  for (const [name, format] of ozzDefinitions) {
    const records = ozzExpanded[name] || []
    ozz.push(
      ...records.map((record, index) =>
        makeImportRecord(record, 'Основы здравоохранения', format, index, visibility),
      ),
    )
  }

  const records = [...surgery, ...ozz]
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  for (const record of records) {
    const existing = await payload.find({
      collection: 'learning-items',
      limit: 1,
      overrideAccess: true,
      where: { slug: { equals: record.slug } },
    })

    if (existing.docs[0]) {
      await payload.update({
        collection: 'learning-items',
        id: existing.docs[0].id,
        data: record,
        overrideAccess: true,
      })
    } else {
      await payload.create({ collection: 'learning-items', data: record, overrideAccess: true })
    }
  }

  console.log(`Imported ${records.length} learning items.`)
  console.log(`Surgery: ${surgery.length}; OZZ: ${ozz.length}; visibility: ${visibility}`)
  process.exit(0)
}

await main()
