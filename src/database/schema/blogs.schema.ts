import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const blogStatusEnum = pgEnum('blog_status', ['DRAFT', 'PUBLISHED']);

export const blogs = pgTable(
  'blogs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    content: text('content').notNull(),
    thumbnailMediaId: uuid('thumbnail_media_id'),
    tags: text('tags').array(),
    status: blogStatusEnum('status').notNull(),
    readingTime: integer('reading_time'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    slugUid: uniqueIndex('blogs_slug_uidx').on(table.slug),
    userIdIdx: index('blogs_user_id_idx').on(table.userId),
    statusIdx: index('blogs_status_idx').on(table.status),
    createdAtIdx: index('blogs_created_at_idx').on(table.createdAt),
  }),
);
