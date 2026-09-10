import Link from 'next/link'
import { notFound } from 'next/navigation'

import SubjectShell from '@/components/SubjectShell'
import { countByFormat, getLearningContext } from '@/lib/learning'
import { formatDefinitions, getSubjectDefinition, personalSections } from '@/lib/subjects'

type SubjectPageProps = { params: Promise<{ subject: string }> }

export default async function SubjectPage({ params }: SubjectPageProps) {
  const { subject: subjectSlug } = await params
  const subject = getSubjectDefinition(subjectSlug)
  if (!subject) notFound()

  const { viewer, catalog, accessible } = await getLearningContext()
  const items = catalog.filter((item) => item.subject === subject.title)
  const accessibleIds = new Set(accessible.map((item) => item.id))
  const counts = countByFormat(items, subject.title)
  const accessibleCounts = countByFormat(items.filter((item) => accessibleIds.has(item.id)), subject.title)

  return (
    <SubjectShell activePath="Обзор" subject={subject} viewerEmail={viewer?.email}>
      <div className="subject-hero">
        <p className="eyebrow">Предмет</p>
        <h1>{subject.title}</h1>
        <p className="subject-lead">{subject.description} Выбери формат подготовки и продолжай с того места, где остановился.</p>
      </div>
      <section className="subject-summary" aria-label="Сводка по предмету">
        <div><strong>{items.length}</strong><span>материалов в курсе</span></div>
        <div><strong>{items.filter((item) => accessibleIds.has(item.id)).length}</strong><span>доступно сейчас</span></div>
        <div><strong>{viewer ? 'Да' : 'Нет'}</strong><span>личный доступ</span></div>
      </section>
      <section className="content-section">
        <div className="section-heading"><div><p className="eyebrow">Форматы подготовки</p><h2>Выбери режим</h2></div><p>Материалы разделены по задаче</p></div>
        <div className="format-grid">
          {formatDefinitions.map((format) => (
            <Link className="format-card" href={`/subjects/${subject.slug}/${format.slug}`} key={format.slug}>
              <div className="format-card-top"><span>{String(formatDefinitions.indexOf(format) + 1).padStart(2, '0')}</span><span aria-hidden="true">→</span></div>
              <h3>{format.title}</h3>
              <p>{format.description}</p>
              <div className="format-count"><strong>{accessibleCounts[format.format] ?? 0}</strong><span>из {counts[format.format] ?? 0} доступно</span></div>
            </Link>
          ))}
        </div>
      </section>
      <section className="content-section personal-section">
        <div className="section-heading"><div><p className="eyebrow">Личный кабинет предмета</p><h2>Мои материалы</h2></div></div>
        <div className="personal-grid">
          {personalSections.map((section) => <Link className="personal-card" href={`/subjects/${subject.slug}/section/${section.slug}`} key={section.slug}><h3>{section.title}</h3><p>{section.description}</p><span aria-hidden="true">→</span></Link>)}
        </div>
      </section>
    </SubjectShell>
  )
}
