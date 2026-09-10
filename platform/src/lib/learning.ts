import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'

import { visibleLearningItemsWhere } from '@/access/learningItems'
import config from '@/payload.config'

export type Viewer = {
  email?: string | null
  role?: 'admin' | 'student' | null
  plan?: 'free' | 'subscriber' | null
}

export type LearningItem = {
  id: string
  title: string
  subject: string
  format: 'card' | 'test' | 'ticket' | 'case' | 'image-case'
  visibility: 'public' | 'registered' | 'subscription'
  summary?: string | null
  question?: string | null
  answer?: string | null
  sourceData?: Record<string, unknown> | null
}

export async function getLearningContext() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })
  const viewer = user as Viewer | null
  const accessWhere = visibleLearningItemsWhere(viewer)

  const catalogResult = await payload.find({
    collection: 'learning-items',
    depth: 0,
    limit: 1000,
    pagination: false,
    select: { id: true, title: true, subject: true, format: true, visibility: true, summary: true },
    sort: 'subject,title',
    overrideAccess: true,
    where: { published: { equals: true } },
  })

  const accessibleResult = await payload.find({
    collection: 'learning-items',
    depth: 0,
    limit: 1000,
    pagination: false,
    select: {
      id: true,
      title: true,
      subject: true,
      format: true,
      visibility: true,
      summary: true,
      question: true,
      answer: true,
      sourceData: true,
    },
    sort: 'subject,title',
    where: accessWhere === true ? undefined : accessWhere,
    req: { user: user ?? undefined },
  })

  return {
    viewer,
    catalog: catalogResult.docs as unknown as LearningItem[],
    accessible: accessibleResult.docs as unknown as LearningItem[],
  }
}

export function countByFormat(items: LearningItem[], subjectTitle: string) {
  return items.filter((item) => item.subject === subjectTitle).reduce<Record<string, number>>((counts, item) => {
    counts[item.format] = (counts[item.format] ?? 0) + 1
    return counts
  }, {})
}
