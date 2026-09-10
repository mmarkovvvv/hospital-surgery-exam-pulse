import type { CollectionConfig } from 'payload'

import { visibleLearningItemsWhere } from '@/access/learningItems'

export const LearningItems: CollectionConfig = {
  slug: 'learning-items',
  admin: {
    defaultColumns: ['title', 'subject', 'format', 'visibility', 'published'],
    useAsTitle: 'title',
  },
  access: {
    read: ({ req: { user } }) => visibleLearningItemsWhere(user),
    create: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'subject',
      type: 'text',
      required: true,
    },
    {
      name: 'format',
      type: 'select',
      options: [
        { label: 'Card', value: 'card' },
        { label: 'Test', value: 'test' },
        { label: 'Ticket', value: 'ticket' },
        { label: 'Clinical case', value: 'case' },
        { label: 'Image case', value: 'image-case' },
      ],
      required: true,
    },
    {
      name: 'visibility',
      type: 'select',
      defaultValue: 'public',
      options: [
        { label: 'Public', value: 'public' },
        { label: 'Registered users', value: 'registered' },
        { label: 'Subscribers', value: 'subscription' },
      ],
      required: true,
    },
    {
      name: 'published',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
    },
    {
      name: 'question',
      type: 'textarea',
    },
    {
      name: 'answer',
      type: 'textarea',
      required: true,
    },
    {
      name: 'sourceData',
      type: 'json',
      admin: {
        description: 'Исходная структура материала для импорта и последующей миграции.',
      },
    },
  ],
}
