import { NextResponse } from 'next/server'

import { sendStartMessage } from '@/telegram/telegramClient'
import { extractTelegramCommand } from '@/telegram/commands'

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

  let update: TelegramUpdate

  try {
    update = (await request.json()) as TelegramUpdate
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const message = update.message
  const chatId = message?.chat?.id
  const command = extractTelegramCommand(message?.text)

  if (chatId && (command === '/start' || command === '/help')) {
    try {
      await sendStartMessage(chatId, new URL(request.url).origin)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Telegram error'
      console.error(`Telegram webhook reply failed: ${message}`)
      return NextResponse.json({ error: 'Telegram reply failed' }, { status: 502 })
    }
  }

  return NextResponse.json({ ok: true })
}
