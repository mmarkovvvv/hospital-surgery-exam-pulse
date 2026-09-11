import 'dotenv/config'

import { configureTelegramWebhook } from './webhook'

const webhookUrl = await configureTelegramWebhook()

console.log(`Telegram webhook configured: ${webhookUrl}`)
