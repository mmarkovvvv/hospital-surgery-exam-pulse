'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LogoutButton() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  const logout = async () => {
    setPending(true)
    await fetch('/api/users/logout', { method: 'POST' })
    router.refresh()
    setPending(false)
  }

  return (
    <button className="button button-quiet" disabled={pending} onClick={logout} type="button">
      {pending ? 'Выходим…' : 'Выйти'}
    </button>
  )
}
