import { notFound } from 'next/navigation'

import SubjectShell from '@/components/SubjectShell'
import { getLearningContext } from '@/lib/learning'
import { getPersonalSection, getSubjectDefinition } from '@/lib/subjects'

type SectionPageProps = { params: Promise<{ subject: string; section: string }> }

const usmleSources = [
  {
    title: 'Step 1: форматы вопросов',
    description: 'One-best-answer, виньетки, изображения и мультимедийные задания.',
    href: 'https://www.usmle.org/exam-resources/step-1-materials/step-1-test-question-formats',
  },
  {
    title: 'Step 1: текущая структура экзамена',
    description: 'Актуальные блоки, тайминг и число заданий.',
    href: 'https://www.usmle.org/step-exams/step-1/step-1-exam-content',
  },
  {
    title: 'USMLE: обзор экзамена',
    description: 'Официальная последовательность шагов, требования и общая структура.',
    href: 'https://www.usmle.org/bulletin-information/overview',
  },
  {
    title: 'Step 2 CK: содержание экзамена',
    description: 'Клиническое содержание и текущая структура дня.',
    href: 'https://www.usmle.org/step-exams/step-2-ck/step-2-ck-exam-content',
  },
  {
    title: 'Step 1: содержание и спецификации',
    description: 'Дисциплины, задачи врача и актуальный формат Step 1.',
    href: 'https://www.usmle.org/exam-resources/step-1-materials/step-1-content-outline-and-specifications',
  },
  {
    title: 'Step 3: форматы вопросов',
    description: 'Standalone, sequential, abstracts, charts и мультимедиа.',
    href: 'https://www.usmle.org/exam-resources/step-3-materials/step-3-formats-questions',
  },
  {
    title: 'Step 2 CK: содержание и спецификации',
    description: 'Клинические дисциплины и распределение содержания Step 2 CK.',
    href: 'https://www.usmle.org/exam-resources/step-2-ck-materials/step-2-ck-content-outline-specifications',
  },
  {
    title: 'Step 3: CCS',
    description: 'Официальное описание компьютерных симуляций случаев.',
    href: 'https://www.usmle.org/exam-resources/step-3-materials/step-3-test-question-formats/computer-based-case-simulations',
  },
  {
    title: 'Официальные пробные материалы',
    description: 'Sample questions и интерактивный пробный интерфейс.',
    href: 'https://www.usmle.org/common-questions?category=Practice+Materials',
  },
  {
    title: 'Step 2 CK: форматы вопросов',
    description: 'Официальные форматы заданий и рекомендации по работе с ними.',
    href: 'https://www.usmle.org/exam-resources/step-2-ck-materials/step-2-ck-test-question-formats',
  },
  {
    title: 'Step 3: содержание экзамена',
    description: 'Цели финального шага и клиническое ведение на компьютере.',
    href: 'https://www.usmle.org/exam-resources/step-3-materials/step-3-exam-content',
  },
  {
    title: 'Подготовка к экзамену',
    description: 'Официальные материалы USMLE для планирования и проверки готовности.',
    href: 'https://www.usmle.org/prepare-your-exam',
  },
  {
    title: 'Официальные ресурсы и пробный интерфейс',
    description: 'Материалы экзамена и интерактивное программное обеспечение USMLE.',
    href: 'https://www.usmle.org/exam-resources',
  },
]

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
      {section.slug === 'sources' && <section className="content-section"><div className="info-panel"><h2>Источники предмета</h2>{subject.slug === 'usmle' ? <><p>Начинай с официальных документов USMLE. Коммерческие банки вопросов и руководства используются только как внешние учебные инструменты: их задания и тексты не копируются в Beep Academy.</p><div className="source-list" aria-label="Официальные источники USMLE">{usmleSources.map((source) => <a className="source-link" href={source.href} key={source.href} rel="noreferrer" target="_blank"><span><strong>{source.title}</strong><small>{source.description}</small></span><span aria-hidden="true">↗</span></a>)}</div><p className="source-note">Даты, требования и формат экзамена могут обновляться. Перед регистрацией сверяйся с актуальным Bulletin и официальным сайтом USMLE.</p></> : <><p>Материалы курса импортированы из подготовленного банка учебных материалов. В каждой записи сохраняется исходная структура для дальнейшей проверки и уточнения источника.</p><div className="source-status"><strong>{subjectItems.length}</strong><span>учебных материалов связано с этим предметом</span></div></>}</div></section>}
      {(section.slug === 'errors' || section.slug === 'favorites') && <section className="content-section"><div className="empty-state personal-empty"><h2>{section.slug === 'favorites' ? 'Избранное пока пусто' : 'Ошибок пока нет'}</h2><p>{section.slug === 'favorites' ? 'Сохраняй билеты и карточки, чтобы быстро вернуться к ним из этого раздела.' : 'После прохождения тестов и задач здесь появятся темы, которые стоит повторить.'}</p></div></section>}
    </SubjectShell>
  )
}
