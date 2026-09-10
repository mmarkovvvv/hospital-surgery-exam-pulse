import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  access: {
    create: () => true,
    read: ({ req: { user } }) => user?.role === 'admin' ? true : user ? { id: { equals: user.id } } : false,
    update: ({ req: { user } }) => user?.role === 'admin' ? true : user ? { id: { equals: user.id } } : false,
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      defaultValue: 'student',
      access: {
        create: ({ req: { user } }) => user?.role === 'admin',
        update: ({ req: { user } }) => user?.role === 'admin',
      },
      options: [
        { label: 'Student', value: 'student' },
        { label: 'Admin', value: 'admin' },
      ],
      required: true,
    },
    {
      name: 'plan',
      type: 'select',
      defaultValue: 'free',
      access: {
        create: ({ req: { user } }) => user?.role === 'admin',
        update: ({ req: { user } }) => user?.role === 'admin',
      },
      options: [
        { label: 'Free', value: 'free' },
        { label: 'Subscriber', value: 'subscriber' },
      ],
      required: true,
    },
    {
      name: 'subscriptionExpiresAt',
      type: 'date',
      access: {
        create: ({ req: { user } }) => user?.role === 'admin',
        update: ({ req: { user } }) => user?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'telegramUserId',
      type: 'number',
      unique: true,
      index: true,
      access: {
        create: ({ req: { user } }) => user?.role === 'admin',
        update: ({ req: { user } }) => user?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'telegramUsername',
      type: 'text',
      access: {
        create: ({ req: { user } }) => user?.role === 'admin',
        update: ({ req: { user } }) => user?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'telegramFirstName',
      type: 'text',
      access: {
        create: ({ req: { user } }) => user?.role === 'admin',
        update: ({ req: { user } }) => user?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
  ],
}
