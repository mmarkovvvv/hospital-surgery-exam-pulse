import 'dotenv/config'

import { callTelegram } from './telegramClient'

const webhookUrl = `${process.env.PUBLIC_APP_URL || process.env.TELEGRAM_MINI_APP_URL || ''}/api/telegram/webhook`
const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET

if (!webhookUrl.startsWith('https://') || !webhookSecret) {
  throw new Error('Set PUBLIC_APP_URL or TELEGRAM_MINI_APP_URL and TELEGRAM_WEBHOOK_SECRET first')
}

await callTelegram('setWebhook', {
  url: webhookUrl,
  secret_token: webhookSecret,
  allowed_updates: ['message'],
})

console.log(`Telegram webhook configured: ${webhookUrl}`)
