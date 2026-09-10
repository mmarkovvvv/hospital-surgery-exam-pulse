import Link from 'next/link'
import React from 'react'

import LogoutButton from '@/components/LogoutButton'
import { countByFormat, getLearningContext } from '@/lib/learning'
import { formatDefinitions, subjectDefinitions } from '@/lib/subjects'

import './styles.css'

const visibilityLabels = {
  public: 'Открыто всем',
  registered: 'После регистрации',
  subscription: 'По подписке',
} as const

export default async function HomePage() {
  const { viewer, catalog, accessible } = await getLearningContext()
  const accessibleIds = new Set(accessible.map((item) => item.id))

  return (
    <main className="pulse-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Пульс — на главную">
          <span className="brand-mark">|||</span>
          <span>Пульс</span>
        </Link>
        <nav className="topbar-nav" aria-label="Основная навигация">
          {viewer ? <><span className="user-chip">{viewer.email}</span><LogoutButton /></> : <><Link className="button button-quiet" href="/login">Войти</Link><Link className="button button-aqua" href="/register">Регистрация</Link></>}
        </nav>
      </header>

      <section className="hero-section">
        <div>
          <p className="eyebrow">Личная учебная платформа</p>
          <h1>Готовься к экзамену<br />по понятной системе.</h1>
          <p className="hero-copy">Выбери предмет, а внутри — нужный формат: карточки, тесты, билеты или клинические задачи.</p>
          <div className="hero-actions">
            {!viewer && <Link className="button button-aqua" href="/register">Начать бесплатно</Link>}
            <a className="button button-outline" href="#subjects">Выбрать предмет</a>
          </div>
        </div>
        <aside className="hero-panel" aria-label="Статус аккаунта">
          <span className="hero-panel-label">Текущий доступ</span>
          <strong>{viewer?.plan === 'subscriber' ? 'Подписка' : viewer ? 'Зарегистрирован' : 'Гость'}</strong>
          <p>{accessible.length} материалов доступно сейчас</p>
          {!viewer && <small>После регистрации сохраняй прогресс и открывай материалы для зарегистрированных пользователей.</small>}
        </aside>
      </section>

      <section className="access-strip" aria-label="Уровни доступа">
        <div><strong>01</strong><span>{visibilityLabels.public}</span><small>Знакомство с курсом</small></div>
        <div><strong>02</strong><span>{visibilityLabels.registered}</span><small>Прогресс и личные материалы</small></div>
        <div><strong>03</strong><span>{visibilityLabels.subscription}</span><small>Полный банк подготовки</small></div>
      </section>

      <section className="catalog-section" id="subjects">
        <div className="section-heading">
          <div><p className="eyebrow">Каталог предметов</p><h2>Выбери, что учить</h2></div>
          <p>{subjectDefinitions.length} предмета · {catalog.length} материалов</p>
        </div>
        <div className="subject-catalog-grid">
          {subjectDefinitions.map((subject) => {
            const subjectItems = catalog.filter((item) => item.subject === subject.title)
            const subjectAccessible = subjectItems.filter((item) => accessibleIds.has(item.id)).length
            const counts = countByFormat(subjectItems, subject.title)

            return (
              <Link className="subject-card" href={`/subjects/${subject.slug}`} key={subject.slug}>
                <div className="subject-card-top"><span className="subject-number">{String(subjectDefinitions.indexOf(subject) + 1).padStart(2, '0')}</span><span aria-hidden="true">→</span></div>
                <h3>{subject.title}</h3>
                <p>{subject.description}</p>
                <div className="subject-card-stats"><strong>{subjectAccessible}/{subjectItems.length}</strong><span>доступно сейчас</span></div>
                <div className="format-pills">
                  {formatDefinitions.map((format) => <span key={format.slug}>{format.title} · {counts[format.format] ?? 0}</span>)}
                </div>
              </Link>
            )
          })}
        </div>
      </section>
      <footer className="site-footer"><span>Пульс · учебная платформа</span><span>Сначала доступность и безопасность.</span></footer>
    </main>
  )
}
