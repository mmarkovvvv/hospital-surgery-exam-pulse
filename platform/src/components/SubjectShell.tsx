'use client'

import Link from 'next/link'
import { useState } from 'react'

import LogoutButton from '@/components/LogoutButton'
import {
  formatDefinitions,
  getSubjectPath,
  personalSections,
  type SubjectDefinition,
} from '@/lib/subjects'

type SubjectShellProps = {
  subject: SubjectDefinition
  activePath?: string
  viewerEmail?: string | null
  children: React.ReactNode
}

export default function SubjectShell({ subject, activePath = '', viewerEmail, children }: SubjectShellProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const subjectPath = getSubjectPath(subject.slug)

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="subject-shell">
      <header className="topbar subject-topbar">
        <div className="subject-topbar-left">
          <button
            aria-controls="subject-navigation"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Закрыть меню предмета' : 'Открыть меню предмета'}
            className="menu-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            <span />
            <span />
            <span />
          </button>
          <Link className="brand" href="/" onClick={closeMenu}>
            <span className="brand-mark">|||</span>
            <span>Пульс</span>
          </Link>
          <div className="breadcrumbs" aria-label="Хлебные крошки">
            <Link href="/">Предметы</Link>
            <span aria-hidden="true">/</span>
            <Link href={subjectPath}>{subject.title}</Link>
            {activePath && <><span aria-hidden="true">/</span><span>{activePath}</span></>}
          </div>
        </div>
        <nav className="topbar-nav" aria-label="Аккаунт">
          {viewerEmail ? <><span className="user-chip">{viewerEmail}</span><LogoutButton /></> : <><Link className="button button-quiet" href="/login">Войти</Link><Link className="button button-aqua" href="/register">Регистрация</Link></>}
        </nav>
      </header>

      <div className="subject-layout">
        <aside className={`subject-sidebar ${menuOpen ? 'is-open' : ''}`} id="subject-navigation">
          <div className="sidebar-heading">
            <span className="eyebrow">Текущий предмет</span>
            <strong>{subject.title}</strong>
          </div>
          <nav aria-label={`Разделы предмета «${subject.title}»`} onClick={closeMenu}>
            <Link className={`sidebar-link ${activePath === 'Обзор' ? 'is-active' : ''}`} href={subjectPath}>Обзор</Link>
            <span className="sidebar-label">Форматы подготовки</span>
            {formatDefinitions.map((format) => (
              <Link
                className={`sidebar-link ${activePath === format.title ? 'is-active' : ''}`}
                href={`${subjectPath}/${format.slug}`}
                key={format.slug}
              >
                {format.title}
              </Link>
            ))}
            <span className="sidebar-label">Мои материалы</span>
            {personalSections.map((section) => (
              <Link
                className={`sidebar-link ${activePath === section.title ? 'is-active' : ''}`}
                href={`${subjectPath}/section/${section.slug}`}
                key={section.slug}
              >
                {section.title}
              </Link>
            ))}
          </nav>
          <Link className="back-to-subjects" href="/" onClick={closeMenu}>← Все предметы</Link>
        </aside>
        {menuOpen && <button aria-label="Закрыть меню" className="sidebar-backdrop" onClick={closeMenu} type="button" />}
        <main className="subject-main">{children}</main>
      </div>
    </div>
  )
}
