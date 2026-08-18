import { pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { blogs } from './blogs.schema';
import { users } from './users.schema';

export const blogLikes = pgTable(
  'blog_likes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    blogId: uuid('blog_id')
      .notNull()
      .references(() => blogs.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uniqueBlogUserLike: uniqueIndex('unique_blog_user_like').on(
      table.blogId,
      table.userId,
    ),
  }),
);
