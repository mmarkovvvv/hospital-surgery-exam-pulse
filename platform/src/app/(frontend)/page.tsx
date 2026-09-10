import { headers as getHeaders } from 'next/headers.js'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import { visibleLearningItemsWhere } from '@/access/learningItems'
import config from '@/payload.config'
import LogoutButton from '@/components/LogoutButton'
import './styles.css'

type Viewer = {
  email?: string | null
  role?: 'admin' | 'student' | null
  plan?: 'free' | 'subscriber' | null
}

type CatalogItem = {
  id: string
  title: string
  subject: string
  format: string
  visibility: 'public' | 'registered' | 'subscription'
  summary?: string | null
}

const visibilityLabels = {
  public: 'Открыто всем',
  registered: 'После регистрации',
  subscription: 'По подписке',
} as const

const formatLabels = {
  card: 'Карточка',
  test: 'Тест',
  ticket: 'Билет',
  case: 'Задача',
  'image-case': 'Изображение',
} as const

export default async function HomePage() {
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
    select: { id: true, title: true, subject: true, format: true, visibility: true, summary: true },
    sort: 'subject,title',
    where: accessWhere === true ? undefined : accessWhere,
    req: { user: user ?? undefined },
  })

  const catalog = { docs: catalogResult.docs as unknown as CatalogItem[] }
  const accessible = { docs: accessibleResult.docs as unknown as CatalogItem[] }

  const accessibleIds = new Set(accessible.docs.map((item) => item.id))
  const grouped = catalog.docs.reduce<Record<string, CatalogItem[]>>((groups, item) => {
    groups[item.subject] ??= []
    groups[item.subject].push(item)
    return groups
  }, {})

  return (
    <main className="pulse-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Пульс — на главную"><span className="brand-mark">|||</span><span>Пульс</span></Link>
        <nav className="topbar-nav" aria-label="Основная навигация">
          {viewer ? <><span className="user-chip">{viewer.email}</span><LogoutButton /></> : <><Link className="button button-quiet" href="/login">Войти</Link><Link className="button button-aqua" href="/register">Регистрация</Link></>}
        </nav>
      </header>

      <section className="hero-section">
        <div><p className="eyebrow">Личная учебная платформа</p><h1>Готовься к экзамену<br />по понятной системе.</h1><p className="hero-copy">Открытые материалы — сразу. Личный прогресс — после регистрации. Расширенные банки — для подписчиков.</p><div className="hero-actions">{!viewer && <Link className="button button-aqua" href="/register">Начать бесплатно</Link>}<a className="button button-outline" href="#catalog">Посмотреть материалы</a></div></div>
        <aside className="hero-panel" aria-label="Статус аккаунта"><span className="hero-panel-label">Текущий доступ</span><strong>{viewer?.plan === 'subscriber' ? 'Подписка' : viewer ? 'Зарегистрирован' : 'Гость'}</strong><p>{accessible.docs.length} материалов доступно сейчас</p>{!viewer && <small>Создай аккаунт, чтобы сохранять прогресс и открывать материалы для зарегистрированных.</small>}</aside>
      </section>

      <section className="access-strip" aria-label="Уровни доступа"><div><strong>01</strong><span>Открыто</span><small>Знакомство с курсом</small></div><div><strong>02</strong><span>Регистрация</span><small>Прогресс и личные материалы</small></div><div><strong>03</strong><span>Подписка</span><small>Полный банк подготовки</small></div></section>

      <section className="catalog-section" id="catalog"><div className="section-heading"><div><p className="eyebrow">Каталог</p><h2>Материалы для подготовки</h2></div><p>{catalog.docs.length} материалов в демо-каталоге</p></div>
        {Object.keys(grouped).length === 0 ? <div className="empty-state"><h3>Каталог пока пуст</h3><p>Запусти `npm run seed` в папке platform, чтобы добавить демо-материалы.</p></div> : <div className="catalog-grid">{Object.entries(grouped).map(([subject, items]) => <section className="subject-block" key={subject}><h3>{subject}</h3><div className="item-grid">{items.map((item) => { const isAccessible = accessibleIds.has(item.id); return <article className={`learning-card ${isAccessible ? '' : 'is-locked'}`} key={item.id}><div className="card-meta"><span>{formatLabels[item.format as keyof typeof formatLabels] ?? item.format}</span><span>{visibilityLabels[item.visibility]}</span></div><h4>{item.title}</h4><p>{isAccessible ? item.summary : 'Материал доступен после выполнения условия доступа.'}</p><div className="card-footer"><span className={isAccessible ? 'status-open' : 'status-locked'}>{isAccessible ? 'Доступно' : 'Закрыто'}</span><span aria-hidden="true">{isAccessible ? '→' : '◌'}</span></div></article> })}</div></section>)}</div>}
      </section>
      <footer className="site-footer"><span>Пульс · учебная платформа</span><span>Сначала доступность и безопасность.</span></footer>
    </main>
  )
}
