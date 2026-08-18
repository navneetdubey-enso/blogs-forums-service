import {
  bigint,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    appType: varchar('app_type', { length: 100 }).notNull(),
    appUserId: varchar('app_user_id', { length: 255 }).notNull(),
    universeUserId: bigint('universe_user_id', { mode: 'number' }).notNull(),
    appUserRole: varchar('app_user_role', { length: 100 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    appIdentityUid: uniqueIndex('users_app_type_app_user_id_uidx').on(
      table.appType,
      table.appUserId,
    ),
    universeUserIdIdx: index('users_universe_user_id_idx').on(
      table.universeUserId,
    ),
  }),
);
