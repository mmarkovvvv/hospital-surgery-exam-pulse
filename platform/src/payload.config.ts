import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { LearningItems } from './collections/LearningItems'
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
  sharp,
  plugins: [],
})
