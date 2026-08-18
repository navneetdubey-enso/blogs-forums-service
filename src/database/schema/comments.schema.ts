import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { blogs } from './blogs.schema';
import { users } from './users.schema';

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    blogId: uuid('blog_id')
      .notNull()
      .references(() => blogs.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    parentCommentId: uuid('parent_comment_id').references(
      (): AnyPgColumn => comments.id,
      { onDelete: 'set null' },
    ),
    isReply: boolean('is_reply').notNull().default(false),
  },
  (table) => ({
    blogCreatedAtIdIdx: index('idx_comments_blog_created_at_id').on(
      table.blogId,
      table.createdAt,
      table.id,
    ),
    activeCreatedAtIdIdx: index('idx_comments_active_created_at_id').on(
      table.isActive,
      table.createdAt,
      table.id,
    ),
    parentCommentIdIdx: index('idx_comments_parent_comment_id').on(
      table.parentCommentId,
    ),
  }),
);
