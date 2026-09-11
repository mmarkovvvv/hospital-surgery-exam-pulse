import { callTelegram } from './telegramClient'

export function getTelegramWebhookUrl(): string {
  const baseUrl = (process.env.PUBLIC_APP_URL || process.env.TELEGRAM_MINI_APP_URL || '').trim().replace(/\/+$/, '')

  if (!baseUrl.startsWith('https://')) {
    throw new Error('Set PUBLIC_APP_URL or TELEGRAM_MINI_APP_URL to a public HTTPS URL')
  }

  return `${baseUrl}/api/telegram/webhook`
}

export async function configureTelegramWebhook(): Promise<string> {
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (!webhookSecret) throw new Error('TELEGRAM_WEBHOOK_SECRET is not configured')

  const webhookUrl = getTelegramWebhookUrl()

  await callTelegram('setWebhook', {
    url: webhookUrl,
    secret_token: webhookSecret,
    allowed_updates: ['message'],
  })

  return webhookUrl
}
