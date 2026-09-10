import { pushDevSchema } from '@payloadcms/drizzle'
import type { Migration } from 'payload'

type MigrationPayload = {
  db: unknown
}

export const initialSchemaMigration: Migration = {
  name: 'initial-schema',
  async down() {},
  async up(args) {
    const { payload } = args as { payload: MigrationPayload }
    const previousForcePush = process.env.PAYLOAD_FORCE_DRIZZLE_PUSH

    process.env.PAYLOAD_FORCE_DRIZZLE_PUSH = 'true'

    try {
      await pushDevSchema(payload.db as Parameters<typeof pushDevSchema>[0])
    } finally {
      if (previousForcePush === undefined) {
        delete process.env.PAYLOAD_FORCE_DRIZZLE_PUSH
      } else {
        process.env.PAYLOAD_FORCE_DRIZZLE_PUSH = previousForcePush
      }
    }
  },
}
