import { createHmac, timingSafeEqual } from 'node:crypto'

export type TelegramMiniAppUser = {
  id: number
  first_name?: string
  last_name?: string
  username?: string
}

export type ValidatedTelegramInitData = {
  authDate: number
  queryId?: string
  user: TelegramMiniAppUser
}

export function validateTelegramInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds = 86400,
  now = Math.floor(Date.now() / 1000),
): ValidatedTelegramInitData | null {
  if (!initData || !botToken) return null

  const params = new URLSearchParams(initData)
  const receivedHash = params.get('hash')
  const authDate = Number(params.get('auth_date'))
  const userRaw = params.get('user')

  if (!receivedHash || !Number.isSafeInteger(authDate) || !userRaw) return null
  if (authDate > now + 60 || now - authDate > maxAgeSeconds) return null

  const dataCheckString = [...params.entries()]
    .filter(([key]) => key !== 'hash')
    .sort(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest()
  const calculatedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')
  const receivedHashBuffer = Buffer.from(receivedHash, 'hex')
  const calculatedHashBuffer = Buffer.from(calculatedHash, 'hex')

  if (
    receivedHashBuffer.length !== calculatedHashBuffer.length ||
    !timingSafeEqual(receivedHashBuffer, calculatedHashBuffer)
  ) {
    return null
  }

  try {
    const user = JSON.parse(userRaw) as TelegramMiniAppUser
    if (!Number.isSafeInteger(user.id)) return null

    return {
      authDate,
      queryId: params.get('query_id') ?? undefined,
      user,
    }
  } catch {
    return null
  }
}
