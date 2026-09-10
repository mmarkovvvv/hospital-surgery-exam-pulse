import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig, type BaseDatabaseAdapter, type DatabaseAdapterObj, type Payload } from 'payload'
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

function makeNonInteractiveDatabase<T extends BaseDatabaseAdapter>(
  adapter: DatabaseAdapterObj<T>,
): DatabaseAdapterObj<T> {
  return {
    ...adapter,
    init: ({ payload }) => {
      const initialized = adapter.init({ payload })
      const migrate = initialized.migrate.bind(initialized)

      initialized.migrate = async (args) => {
        try {
          await initialized.deleteMany({
            collection: 'payload-migrations',
            where: {
              batch: {
                equals: -1,
              },
            },
          })
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          payload.logger.warn(`Could not clean a stale development migration marker: ${message}`)
        }

        return migrate(args)
      }

      return initialized
    },
  }
}

const rawDatabase = databaseUrl.startsWith('postgres')
  ? postgresAdapter({
      pool: {
        connectionString: databaseUrl,
      },
      push: false,
      prodMigrations: [initialSchemaMigration],
    })
  : sqliteAdapter({
      client: {
        url: databaseUrl,
      },
      push: false,
      prodMigrations: [initialSchemaMigration],
    })

const database = makeNonInteractiveDatabase(rawDatabase as DatabaseAdapterObj<BaseDatabaseAdapter>)

let autoImportPromise: Promise<void> | undefined

function ensureStaticContent(payload: Payload) {
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

  autoImportPromise.catch((error) => {
    const message = error instanceof Error ? error.message : String(error)
    payload.logger.error(`Automatic static content import failed: ${message}`)
  })
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
