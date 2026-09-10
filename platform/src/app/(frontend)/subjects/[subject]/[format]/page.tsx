import { notFound } from 'next/navigation'

import SubjectShell from '@/components/SubjectShell'
import { getLearningContext } from '@/lib/learning'
import { getFormatDefinition, getSubjectDefinition } from '@/lib/subjects'

type FormatPageProps = { params: Promise<{ subject: string; format: string }> }

export default async function FormatPage({ params }: FormatPageProps) {
  const { subject: subjectSlug, format: formatSlug } = await params
  const subject = getSubjectDefinition(subjectSlug)
  const format = getFormatDefinition(formatSlug)
  if (!subject || !format) notFound()

  const { viewer, catalog, accessible } = await getLearningContext()
  const items = catalog.filter((item) => item.subject === subject.title && item.format === format.format)
  const accessibleItems = accessible.filter((item) => item.subject === subject.title && item.format === format.format)
  const accessibleIds = new Set(accessibleItems.map((item) => item.id))

  return (
    <SubjectShell activePath={format.title} subject={subject} viewerEmail={viewer?.email}>
      <div className="subject-hero compact-hero">
        <p className="eyebrow">{subject.title}</p>
        <h1>{format.title}</h1>
        <p className="subject-lead">{format.description}</p>
        <div className="route-stats"><span>{items.length} материалов</span><span>{accessibleItems.length} доступно</span></div>
      </div>
      <section className="content-section item-list-section">
        <div className="learning-list">
          {items.length === 0 && <div className="empty-state"><h2>Материалов пока нет</h2><p>Для этого формата ещё не добавлены записи.</p></div>}
          {items.map((item, index) => {
            const isAccessible = accessibleIds.has(item.id)
            const accessibleItem = accessibleItems.find((candidate) => candidate.id === item.id)
            return (
              <article className={`learning-detail-card ${isAccessible ? '' : 'is-locked'}`} key={item.id}>
                <div className="learning-detail-meta"><span>{String(index + 1).padStart(2, '0')}</span><span>{isAccessible ? 'Доступно' : 'Закрыто'}</span></div>
                <h2>{item.title}</h2>
                <p className="learning-summary">{item.summary}</p>
                {isAccessible && accessibleItem ? <div className="learning-answer"><div><span className="answer-label">Вопрос</span><p>{accessibleItem.question || item.title}</p></div><div><span className="answer-label">Ответ</span><p>{accessibleItem.answer}</p></div></div> : <div className="locked-message"><strong>Материал закрыт</strong><span>Войдите или оформите подписку, чтобы открыть этот блок.</span></div>}
              </article>
            )
          })}
        </div>
      </section>
    </SubjectShell>
  )
}
