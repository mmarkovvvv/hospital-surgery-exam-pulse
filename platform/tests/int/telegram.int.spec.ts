import { createHmac } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { validateTelegramInitData } from '@/telegram/validateInitData'
import { extractTelegramCommand } from '@/telegram/commands'

function makeInitData(botToken: string, authDate: number) {
  const user = JSON.stringify({ id: 123456789, first_name: 'Student', username: 'student' })
  const dataCheckString = [`auth_date=${authDate}`, `user=${user}`].sort().join('\n')
  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest()
  const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')
  return `auth_date=${authDate}&user=${encodeURIComponent(user)}&hash=${hash}`
}

describe('Telegram Mini App initData', () => {
  it('accepts a valid signed payload', () => {
    const initData = makeInitData('test-bot-token', 1_700_000_000)

    expect(validateTelegramInitData(initData, 'test-bot-token', 100_000_000, 1_700_000_001)).toMatchObject({
      user: { id: 123456789, username: 'student' },
    })
  })

  it('rejects a payload signed with another token', () => {
    const initData = makeInitData('test-bot-token', 1_700_000_000)

    expect(validateTelegramInitData(initData, 'wrong-token', 100_000_000, 1_700_000_001)).toBeNull()
  })

  it('rejects expired payloads', () => {
    const initData = makeInitData('test-bot-token', 1_700_000_000)

    expect(validateTelegramInitData(initData, 'test-bot-token', 60, 1_700_000_100)).toBeNull()
  })
})

describe('Telegram commands', () => {
  it('accepts commands addressed to a bot', () => {
    expect(extractTelegramCommand('/start@beep_academy_bot')).toBe('/start')
  })

  it('ignores ordinary messages', () => {
    expect(extractTelegramCommand('hello')).toBeNull()
  })
})
