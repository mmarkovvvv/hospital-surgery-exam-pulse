'use client'

import { useEffect } from 'react'

export default function TelegramBootstrap() {
  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    const isTelegramContext =
      navigator.userAgent.includes('Telegram') || query.has('tgWebAppVersion')

    if (!isTelegramContext) return

    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-web-app.js'
    script.async = true
    document.head.appendChild(script)

    let attempts = 0
    const interval = window.setInterval(() => {
      const webApp = window.Telegram?.WebApp
      attempts += 1

      if (webApp?.initData) {
        window.clearInterval(interval)
        webApp.ready()
        webApp.expand()

        void fetch('/api/telegram/auth', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ initData: webApp.initData }),
        })
      }

      if (attempts >= 100) window.clearInterval(interval)
    }, 50)

    return () => {
      window.clearInterval(interval)
      script.remove()
    }
  }, [])

  return null
}
