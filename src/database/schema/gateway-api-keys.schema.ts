import {
  boolean,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const gatewayApiKeys = pgTable(
  'gateway_api_keys',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectCode: varchar('project_code', { length: 100 }).notNull(),
    keyPrefix: varchar('key_prefix', { length: 100 }).notNull(),
    keyHash: varchar('key_hash', { length: 64 }).notNull().unique(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  },
  (table) => ({
    projectCodeIdx: index('gateway_api_keys_project_code_idx').on(
      table.projectCode,
    ),
    activeProjectIdx: uniqueIndex('gateway_api_keys_one_active_project_idx')
      .on(table.projectCode)
      .where(sql`${table.isActive} = true`),
    activeHashIdx: index('gateway_api_keys_active_hash_idx').on(
      table.keyHash,
      table.isActive,
    ),
  }),
);
