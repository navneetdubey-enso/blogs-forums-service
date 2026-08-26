import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { media } from './media.schema';

export const forums = pgTable(
  'forum',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    title: varchar('title', { length: 255 }).notNull(),
    content: text('content').notNull(),
    category: varchar('category', { length: 255 }).notNull(),
    subCategory: text('sub_category').array(),
    mediaId: uuid('media_id').references(() => media.id, {
      onDelete: 'set null',
    }),
    mediaUrl: text('media_url'),
    likeCount: integer('like_count').notNull().default(0),
    isAnonymous: boolean('is_anonymous').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdIdx: index('forums_user_id_idx').on(table.userId),
    createdAtIdx: index('forums_created_at_idx').on(table.createdAt),
  }),
);

export const forumComments = pgTable(
  'forum_comments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    forumId: uuid('forum_id')
      .notNull()
      .references(() => forums.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    parentCommentId: uuid('parent_comment_id').references(
      (): AnyPgColumn => forumComments.id,
      { onDelete: 'cascade' },
    ),
    isReply: boolean('is_reply').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    forumCreatedAtIdIdx: index('idx_forum_comments_forum_created_at_id').on(
      table.forumId,
      table.createdAt,
      table.id,
    ),
    parentCommentIdIdx: index('idx_forum_comments_parent_comment_id').on(
      table.parentCommentId,
    ),
  }),
);
