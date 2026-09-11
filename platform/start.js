import { spawn } from 'node:child_process'

const server = spawn(process.execPath, ['server.js'], {
  env: process.env,
  stdio: 'inherit',
})

async function configureTelegramWebhook() {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  const baseUrl = (process.env.PUBLIC_APP_URL || process.env.TELEGRAM_MINI_APP_URL || '').trim().replace(/\/+$/, '')

  if (!token || !secret || !baseUrl.startsWith('https://')) {
    console.error('[telegram] webhook not configured: missing token, secret, or HTTPS app URL')
    return
  }

  const webhookUrl = `${baseUrl}/api/telegram/webhook`
  const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: secret,
      allowed_updates: ['message'],
    }),
  })
  const result = await response.json()

  if (!response.ok || !result.ok) {
    throw new Error(result.description || `Telegram setWebhook failed with HTTP ${response.status}`)
  }

  console.log(`[telegram] webhook configured: ${webhookUrl}`)
}

const webhookTimer = setTimeout(() => {
  configureTelegramWebhook().catch((error) => {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[telegram] webhook setup failed: ${message}`)
  })
}, 1000)

function forwardSignal(signal) {
  clearTimeout(webhookTimer)
  server.kill(signal)
}

process.on('SIGTERM', () => forwardSignal('SIGTERM'))
process.on('SIGINT', () => forwardSignal('SIGINT'))
server.on('exit', (code, signal) => {
  clearTimeout(webhookTimer)
  process.exit(code ?? (signal ? 1 : 0))
})
