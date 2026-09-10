'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { FormEvent } from 'react'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setPending(true)
    const response = await fetch('/api/users', { body: JSON.stringify({ email, password }), headers: { 'Content-Type': 'application/json' }, method: 'POST' })
    if (!response.ok) { setError('Не удалось создать аккаунт. Возможно, эта почта уже зарегистрирована.'); setPending(false); return }
    const loginResponse = await fetch('/api/users/login', { body: JSON.stringify({ email, password }), headers: { 'Content-Type': 'application/json' }, method: 'POST' })
    if (!loginResponse.ok) { setError('Аккаунт создан, но автоматический вход не удался. Войди вручную.'); setPending(false); return }
    router.push('/')
    router.refresh()
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <Link className="auth-brand" href="/">Пульс</Link>
        <p className="eyebrow">Бесплатный доступ</p>
        <h1>Создать аккаунт</h1>
        <p className="auth-copy">Открой материалы для зарегистрированных пользователей и сохрани свой прогресс.</p>
        <form className="auth-form" onSubmit={submit}>
          <label>Почта<input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label>
          <label>Пароль<input autoComplete="new-password" minLength={8} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-aqua button-wide" disabled={pending} type="submit">{pending ? 'Создаём…' : 'Создать аккаунт'}</button>
        </form>
        <p className="auth-switch">Уже есть аккаунт? <Link href="/login">Войти</Link></p>
      </section>
    </main>
  )
}
