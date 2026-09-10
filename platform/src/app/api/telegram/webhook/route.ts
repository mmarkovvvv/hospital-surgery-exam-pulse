import { NextResponse } from 'next/server'

import { sendStartMessage } from '@/telegram/telegramClient'

type TelegramUpdate = {
  message?: {
    chat?: { id: number }
    text?: string
  }
}

export async function POST(request: Request) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (expectedSecret && request.headers.get('x-telegram-bot-api-secret-token') !== expectedSecret) {
    return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 })
  }

  const update = (await request.json()) as TelegramUpdate
  const message = update.message
  const chatId = message?.chat?.id
  const command = message?.text?.trim().split(/\s+/)[0]

  if (chatId && (command === '/start' || command === '/help')) {
    await sendStartMessage(chatId)
  }

  return NextResponse.json({ ok: true })
}
