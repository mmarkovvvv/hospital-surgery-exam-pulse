type TelegramResponse<T> = {
  ok: boolean
  result?: T
  description?: string
}

export async function callTelegram<T>(method: string, body: Record<string, unknown>): Promise<T> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not configured')

  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = (await response.json()) as TelegramResponse<T>
  if (!response.ok || !data.ok) {
    throw new Error(data.description || `Telegram API request failed: ${method}`)
  }

  return data.result as T
}

export async function sendStartMessage(chatId: number, fallbackMiniAppUrl?: string): Promise<void> {
  const configuredMiniAppUrl = process.env.TELEGRAM_MINI_APP_URL || process.env.PUBLIC_APP_URL
  const miniAppUrl = (configuredMiniAppUrl || fallbackMiniAppUrl)?.trim().replace(/\/+$/, '')
  if (!miniAppUrl || !miniAppUrl.startsWith('https://')) {
    throw new Error('A public HTTPS Mini App URL is not configured')
  }

  await callTelegram('sendMessage', {
    chat_id: chatId,
    text: 'BEEP — учебная платформа для подготовки к медицинским экзаменам.',
    reply_markup: {
      inline_keyboard: [[{ text: 'Открыть BEEP', web_app: { url: miniAppUrl } }]],
    },
  })
}
