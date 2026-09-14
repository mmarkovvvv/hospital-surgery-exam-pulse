import { notFound } from 'next/navigation'

import SubjectShell from '@/components/SubjectShell'
import UsmleExamClient from '@/components/UsmleExamClient'
import { getLearningContext } from '@/lib/learning'
import { getSubjectDefinition } from '@/lib/subjects'
import { usmleExamModes, usmleQuestions } from '@/lib/usmleExam'

type ExamPageProps = { params: Promise<{ subject: string }> }

export default async function ExamPage({ params }: ExamPageProps) {
  const { subject: subjectSlug } = await params
  const subject = getSubjectDefinition(subjectSlug)
  if (!subject || subject.slug !== 'usmle') notFound()

  const { viewer } = await getLearningContext()

  return <SubjectShell activePath="Экзамен USMLE" subject={subject} viewerEmail={viewer?.email}><div className="subject-hero compact-hero"><p className="eyebrow">USMLE</p><h1>Экзаменационный режим</h1><p className="subject-lead">Блоки с таймером, один лучший ответ, последовательные наборы, абстракты, таблицы, мультимедиа и CCS.</p></div><UsmleExamClient modes={usmleExamModes} questions={usmleQuestions} /></SubjectShell>
}
