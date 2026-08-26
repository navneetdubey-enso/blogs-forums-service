import { pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { forums } from './forums.schema';
import { users } from './users.schema';

export const forumLikes = pgTable(
    'forum_likes',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        forumId: uuid('forum_id')
            .notNull()
            .references(() => forums.id, { onDelete: 'cascade' }),
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        createdAt: timestamp('created_at', { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    (table) => ({
        uniqueCategoryUserLike: uniqueIndex('unique_category_user_like').on(
            table.forumId,
            table.userId,
        ),
    }),
);
