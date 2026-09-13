'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import Brand from '@/components/Brand'
import LogoutButton from '@/components/LogoutButton'

type HomeNavigationProps = {
  viewerEmail?: string | null
}

export default function HomeNavigation({ viewerEmail }: HomeNavigationProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  useEffect(() => {
    if (!menuOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [menuOpen])

  return (
    <>
      <header className="topbar home-topbar">
        <div className="home-topbar-left">
          <button
            aria-controls="home-navigation"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
            className="menu-toggle home-menu-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            <span />
            <span />
            <span />
          </button>
          <Brand onClick={closeMenu} />
        </div>

        <nav aria-label="Основная навигация" className="topbar-nav">
          {viewerEmail ? (
            <>
              <span className="user-chip">{viewerEmail}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link className="button button-quiet" href="/login">
                Войти
              </Link>
              <Link className="button button-aqua" href="/register">
                Регистрация
              </Link>
            </>
          )}
        </nav>
      </header>

      <aside aria-hidden={!menuOpen} className={`home-drawer${menuOpen ? ' is-open' : ''}`} id="home-navigation" aria-label="Навигация по платформе">
        <div className="home-drawer-header">
          <p>Навигация</p>
          <button aria-label="Закрыть меню" className="home-drawer-close" onClick={closeMenu} type="button">
            ×
          </button>
        </div>
        <nav className="home-drawer-nav" onClick={closeMenu}>
          <Link className="home-drawer-link is-active" href="/">
            Главная
          </Link>
          <a className="home-drawer-link" href="#subjects">
            Предметы
          </a>
          {!viewerEmail && (
            <>
              <Link className="home-drawer-link" href="/login">
                Войти
              </Link>
              <Link className="home-drawer-link" href="/register">
                Регистрация
              </Link>
            </>
          )}
        </nav>
      </aside>

      {menuOpen && <button aria-label="Закрыть меню" className="home-drawer-backdrop" onClick={closeMenu} type="button" />}
    </>
  )
}
