import { notFound } from 'next/navigation'

import SubjectShell from '@/components/SubjectShell'
import { getLearningContext } from '@/lib/learning'
import { getPersonalSection, getSubjectDefinition } from '@/lib/subjects'

type SectionPageProps = { params: Promise<{ subject: string; section: string }> }

export default async function SectionPage({ params }: SectionPageProps) {
  const { subject: subjectSlug, section: sectionSlug } = await params
  const subject = getSubjectDefinition(subjectSlug)
  const section = getPersonalSection(sectionSlug)
  if (!subject || !section) notFound()

  const { viewer, catalog, accessible } = await getLearningContext()
  const subjectItems = catalog.filter((item) => item.subject === subject.title)
  const subjectAccessible = accessible.filter((item) => item.subject === subject.title)

  return (
    <SubjectShell activePath={section.title} subject={subject} viewerEmail={viewer?.email}>
      <div className="subject-hero compact-hero">
        <p className="eyebrow">{subject.title}</p>
        <h1>{section.title}</h1>
        <p className="subject-lead">{section.description}</p>
      </div>
      {section.slug === 'progress' && <section className="content-section"><div className="progress-panel"><div className="progress-number"><strong>{subjectAccessible.length}</strong><span>из {subjectItems.length} материалов доступно</span></div><div className="progress-track"><span style={{ width: `${subjectItems.length ? Math.round((subjectAccessible.length / subjectItems.length) * 100) : 0}%` }} /></div><p>Здесь будет сохраняться твой прогресс по форматам, когда появятся отметки о прохождении.</p></div></section>}
      {section.slug === 'sources' && <section className="content-section"><div className="info-panel"><h2>Источники предмета</h2><p>Материалы курса импортированы из подготовленного банка учебных материалов. В каждой записи сохраняется исходная структура для дальнейшей проверки и уточнения источника.</p><div className="source-status"><strong>{subjectItems.length}</strong><span>учебных материалов связано с этим предметом</span></div></div></section>}
      {(section.slug === 'errors' || section.slug === 'favorites') && <section className="content-section"><div className="empty-state personal-empty"><h2>{section.slug === 'favorites' ? 'Избранное пока пусто' : 'Ошибок пока нет'}</h2><p>{section.slug === 'favorites' ? 'Сохраняй билеты и карточки, чтобы быстро вернуться к ним из этого раздела.' : 'После прохождения тестов и задач здесь появятся темы, которые стоит повторить.'}</p></div></section>}
    </SubjectShell>
  )
}
