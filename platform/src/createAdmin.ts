import 'dotenv/config'

import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { getPayload } from 'payload'

import config from './payload.config'

const prompts = createInterface({ input, output })
const email = (await prompts.question('Email администратора: ')).trim()
const password = await prompts.question('Пароль администратора (минимум 8 символов): ')
prompts.close()

if (!email || password.length < 8) {
  throw new Error('Нужны email и пароль длиной минимум 8 символов.')
}

const payload = await getPayload({ config })
const existing = await payload.find({
  collection: 'users',
  limit: 1,
  overrideAccess: true,
  where: { email: { equals: email } },
})

if (existing.docs[0]) {
  await payload.update({
    collection: 'users',
    data: { password, plan: 'free', role: 'admin' },
    draft: false,
    id: existing.docs[0].id,
    overrideAccess: true,
  })
  console.log(`Администратор обновлён: ${email}`)
} else {
  await payload.create({
    collection: 'users',
    data: { email, password, plan: 'free', role: 'admin' },
    draft: false,
    overrideAccess: true,
  })
  console.log(`Администратор создан: ${email}`)
}

process.exit(0)
