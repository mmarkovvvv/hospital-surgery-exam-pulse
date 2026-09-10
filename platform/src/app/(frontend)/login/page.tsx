'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { FormEvent } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setPending(true)
    const response = await fetch('/api/users/login', { body: JSON.stringify({ email, password }), headers: { 'Content-Type': 'application/json' }, method: 'POST' })
    if (!response.ok) { setError('Не удалось войти. Проверь почту и пароль.'); setPending(false); return }
    router.push('/')
    router.refresh()
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <Link className="auth-brand" href="/">Пульс</Link>
        <p className="eyebrow">Личный кабинет</p>
        <h1>Войти</h1>
        <p className="auth-copy">Сохрани прогресс и продолжи подготовку с того места, где остановился.</p>
        <form className="auth-form" onSubmit={submit}>
          <label>Почта<input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label>
          <label>Пароль<input autoComplete="current-password" minLength={8} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-aqua button-wide" disabled={pending} type="submit">{pending ? 'Входим…' : 'Войти'}</button>
        </form>
        <p className="auth-switch">Нет аккаунта? <Link href="/register">Зарегистрироваться</Link></p>
      </section>
    </main>
  )
}
