import { randomBytes } from 'node:crypto'
import { cookies } from 'next/headers.js'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { validateTelegramInitData } from '@/telegram/validateInitData'

type TelegramAuthRequest = {
  initData?: string
}

export async function POST(request: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    return NextResponse.json({ error: 'Telegram authentication is not configured' }, { status: 503 })
  }

  let body: TelegramAuthRequest
  try {
    body = (await request.json()) as TelegramAuthRequest
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const maxAgeSeconds = Number(process.env.TELEGRAM_INIT_DATA_MAX_AGE_SECONDS || 86400)
  const validated = validateTelegramInitData(body.initData || '', botToken, maxAgeSeconds)
  if (!validated) {
    return NextResponse.json({ error: 'Invalid or expired Telegram initData' }, { status: 401 })
  }

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const existingUsers = await payload.find({
    collection: 'users',
    limit: 1,
    overrideAccess: true,
    where: { telegramUserId: { equals: validated.user.id } },
  })

  const email = `telegram-${validated.user.id}@users.invalid`
  const temporaryPassword = randomBytes(32).toString('hex')
  const userData = {
    email,
    password: temporaryPassword,
    telegramUserId: validated.user.id,
    telegramUsername: validated.user.username || undefined,
    telegramFirstName: validated.user.first_name || undefined,
  }

  if (existingUsers.docs[0]) {
    await payload.update({
      collection: 'users',
      id: existingUsers.docs[0].id,
      data: userData,
      overrideAccess: true,
    })
  } else {
    await payload.create({
      collection: 'users',
      data: { ...userData, role: 'student', plan: 'free' },
      overrideAccess: true,
    })
  }

  const loginResult = await payload.login({
    collection: 'users',
    data: { email, password: temporaryPassword },
  })

  const cookieStore = await cookies()
  cookieStore.set('payload-token', loginResult.token || '', {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  return NextResponse.json({
    ok: true,
    user: {
      id: validated.user.id,
      firstName: validated.user.first_name || null,
      username: validated.user.username || null,
    },
  })
}
