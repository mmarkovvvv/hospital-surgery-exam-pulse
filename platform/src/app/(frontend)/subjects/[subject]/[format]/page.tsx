import { notFound } from 'next/navigation'
import Link from 'next/link'

import SubjectShell from '@/components/SubjectShell'
import InteractiveFormat from '@/components/InteractiveFormat'
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
  const interactiveItems = accessibleItems

  return (
    <SubjectShell activePath={format.title} subject={subject} viewerEmail={viewer?.email}>
      <div className="subject-hero compact-hero">
        <p className="eyebrow">{subject.title}</p>
        <h1>{format.title}</h1>
        <p className="subject-lead">{format.description}</p>
        <div className="route-stats"><span>{items.length} материалов</span><span>{accessibleItems.length} доступно</span></div>
      </div>
      <section className="content-section item-list-section">
        {interactiveItems.length === 0 && items.length > 0 ? (
          <div className="empty-state">
            <h2>Материалы закрыты</h2>
            <p>{viewer ? 'Для этого формата нужна активная подписка.' : 'Зарегистрируйтесь, чтобы открыть материалы для зарегистрированных пользователей.'}</p>
            {!viewer && <Link className="button button-aqua" href="/register">Зарегистрироваться</Link>}
          </div>
        ) : <InteractiveFormat format={format.format} items={interactiveItems} subjectSlug={subject.slug} />}
        {items.length > accessibleItems.length && accessibleItems.length > 0 && <div className="locked-message format-locked-note"><strong>Часть банка закрыта</strong><span>Откройте аккаунт или подписку, чтобы получить доступ к остальным материалам.</span></div>}
      </section>
    </SubjectShell>
  )
}
