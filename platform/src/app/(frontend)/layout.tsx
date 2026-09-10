import React from 'react'

import TelegramBootstrap from '@/components/TelegramBootstrap'
import './styles.css'

export const metadata = {
  description: 'Локальная учебная платформа с управляемым доступом к материалам.',
  title: 'Beep Academy — учебная платформа',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html data-scroll-behavior="smooth" lang="ru">
      <body>
        <TelegramBootstrap />
        <main>{children}</main>
      </body>
    </html>
  )
}
