import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig, type Payload } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { LearningItems } from './collections/LearningItems'
import { importStaticContent } from './importStaticContent'
import { initialSchemaMigration } from './migrations/initialSchema'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const databaseUrl = process.env.DATABASE_URL || ''
const database = databaseUrl.startsWith('postgres')
  ? postgresAdapter({
      pool: {
        connectionString: databaseUrl,
      },
      prodMigrations: [initialSchemaMigration],
    })
  : sqliteAdapter({
      client: {
        url: databaseUrl,
      },
      prodMigrations: [initialSchemaMigration],
    })

let autoImportPromise: Promise<void> | undefined

async function ensureStaticContent(payload: Payload) {
  if (process.env.DISABLE_AUTO_IMPORT === 'true') return

  autoImportPromise ??= (async () => {
    const existing = await payload.count({
      collection: 'learning-items',
      overrideAccess: true,
    })

    if (existing.totalDocs > 0) return

    const visibility = (process.env.IMPORT_VISIBILITY || 'registered') as
      | 'public'
      | 'registered'
      | 'subscription'
    await importStaticContent(payload, visibility)
  })()

  await autoImportPromise
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, LearningItems],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: database,
  onInit: ensureStaticContent,
  sharp,
  plugins: [],
})
