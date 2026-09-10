import 'dotenv/config'

import { getPayload } from 'payload'

import config from './payload.config'

const demoItems = [
  { title: 'Открытая карточка: схема устного ответа', slug: 'demo-card-public', subject: 'Госпитальная хирургия', format: 'card', visibility: 'public', published: true, summary: 'Короткий пример открытой карточки.', answer: 'Сначала сформулировать диагноз, затем оценить угрозы и выбрать тактику.' },
  { title: 'Тест: первичная оценка пациента', slug: 'demo-test-registered', subject: 'Госпитальная хирургия', format: 'test', visibility: 'registered', published: true, summary: 'Доступно после регистрации.', answer: 'Оценить ABCDE, жизненные показатели и признаки немедленной угрозы.' },
  { title: 'Билет: неотложная хирургия', slug: 'demo-ticket-subscription', subject: 'Госпитальная хирургия', format: 'ticket', visibility: 'subscription', published: true, summary: 'Пример расширенного билета для подписчиков.', answer: 'Раскрыть определение, классификацию, клинику, диагностику, дифференциальную диагностику, лечение и профилактику осложнений.' },
  { title: 'ОЗЗ: медицинская демография', slug: 'demo-ozz-public', subject: 'Основы здравоохранения', format: 'card', visibility: 'public', published: true, summary: 'Открытый материал нового предмета.', answer: 'Раскрыть предмет медицинской демографии, источники данных и основные показатели.' },
  { title: 'ОЗЗ: показатели здоровья населения', slug: 'demo-ozz-registered', subject: 'Основы здравоохранения', format: 'test', visibility: 'registered', published: true, summary: 'Практика работы с показателями после регистрации.', answer: 'Различать абсолютные, относительные и средние величины и выбирать подходящий показатель.' },
] as const

const payload = await getPayload({ config })

let created = 0
let updated = 0

for (const item of demoItems) {
  const existing = await payload.find({
    collection: 'learning-items',
    limit: 1,
    overrideAccess: true,
    where: { slug: { equals: item.slug } },
  })

  if (existing.docs[0]) {
    await payload.update({
      collection: 'learning-items',
      id: existing.docs[0].id,
      data: item,
      overrideAccess: true,
    })
    updated += 1
  } else {
    await payload.create({ collection: 'learning-items', data: item, overrideAccess: true })
    created += 1
  }
}

console.log(`Seed complete. Created: ${created}; updated: ${updated}.`)
process.exit(0)
