export const subjectDefinitions = [
  {
    slug: 'hospital-surgery',
    title: 'Госпитальная хирургия',
    shortTitle: 'Хирургия',
    description: 'Системная подготовка: от карточек и билетов до клинических решений.',
  },
  {
    slug: 'healthcare-basics',
    title: 'Основы здравоохранения',
    shortTitle: 'ОЗЗ',
    description: 'Материалы по общественному здоровью, статистике и организации помощи.',
  },
] as const

export type SubjectDefinition = (typeof subjectDefinitions)[number]

export const formatDefinitions = [
  {
    slug: 'cards',
    format: 'card',
    title: 'Карточки',
    description: 'Короткие вопросы и ответы для интервального повторения.',
  },
  {
    slug: 'test',
    format: 'test',
    title: 'Тест',
    description: 'Самопроверка с вариантами ответа и разбором результата.',
  },
  {
    slug: 'tickets',
    format: 'ticket',
    title: 'Билеты',
    description: 'Полные темы и структура ответа на экзамене.',
  },
  {
    slug: 'clinical-cases',
    format: 'case',
    title: 'Клинические задачи',
    description: 'Ситуации для тренировки диагностики и тактики.',
  },
  {
    slug: 'image-cases',
    format: 'image-case',
    title: 'Задачи с изображениями',
    description: 'Задачи, где решение начинается с анализа изображения.',
  },
] as const

export type FormatDefinition = (typeof formatDefinitions)[number]

export const personalSections = [
  {
    slug: 'progress',
    title: 'Прогресс',
    description: 'Что уже пройдено и сколько осталось.',
  },
  {
    slug: 'errors',
    title: 'Ошибки и слабые места',
    description: 'Темы, к которым стоит вернуться.',
  },
  {
    slug: 'favorites',
    title: 'Избранное',
    description: 'Сохранённые материалы для повторения.',
  },
  {
    slug: 'sources',
    title: 'Источники',
    description: 'Материалы, на которых основан курс.',
  },
] as const

export type PersonalSection = (typeof personalSections)[number]

export function getSubjectDefinition(slug: string): SubjectDefinition | undefined {
  return subjectDefinitions.find((subject) => subject.slug === slug)
}

export function getFormatDefinition(slug: string): FormatDefinition | undefined {
  return formatDefinitions.find((format) => format.slug === slug)
}

export function getPersonalSection(slug: string): PersonalSection | undefined {
  return personalSections.find((section) => section.slug === slug)
}

export function getSubjectPath(subjectSlug: string, path = ''): string {
  return `/subjects/${subjectSlug}${path ? `/${path}` : ''}`
}
