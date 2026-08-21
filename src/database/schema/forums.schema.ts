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
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const forumTopicStatusEnum = pgEnum('forum_topic_status', [
  'DRAFT',
  'PUBLISHED',
]);

export const forums = pgTable(
  'forums',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    description: text('description'),
    likeCount: integer('like_count').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    slugUid: uniqueIndex('forums_slug_uidx').on(table.slug),
    createdAtIdx: index('forums_created_at_idx').on(table.createdAt),
  }),
);

export const forumTopics = pgTable(
  'forum_topics',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    forumId: uuid('forum_id')
      .notNull()
      .references(() => forums.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    content: text('content').notNull(),
    status: forumTopicStatusEnum('status').notNull().default('DRAFT'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    slugUid: uniqueIndex('forum_topics_slug_uidx').on(table.slug),
    forumIdIdx: index('forum_topics_forum_id_idx').on(table.forumId),
    userIdIdx: index('forum_topics_user_id_idx').on(table.userId),
    statusIdx: index('forum_topics_status_idx').on(table.status),
    createdAtIdx: index('forum_topics_created_at_idx').on(table.createdAt),
  }),
);

export const forumComments = pgTable(
  'forum_comments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    topicId: uuid('topic_id')
      .notNull()
      .references(() => forumTopics.id, { onDelete: 'cascade' }),
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
    topicCreatedAtIdIdx: index('idx_forum_comments_topic_created_at_id').on(
      table.topicId,
      table.createdAt,
      table.id,
    ),
    parentCommentIdIdx: index('idx_forum_comments_parent_comment_id').on(
      table.parentCommentId,
    ),
  }),
);
