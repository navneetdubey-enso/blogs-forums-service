import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const reportTargetTypeEnum = pgEnum('report_target_type', [
  'BLOG',
  'BLOG_COMMENT',
  'FORUM',
  'FORUM_COMMENT',
]);

export const reportReasonEnum = pgEnum('report_reason', [
  'SPAM',
  'ABUSIVE',
  'INAPPROPRIATE',
  'MISINFORMATION',
  'COPYRIGHT',
  'OTHER',
]);

export const reportStatusEnum = pgEnum('report_status', [
  'PENDING',
  'REVIEWED',
  'RESOLVED',
  'REJECTED',
]);

export const reports = pgTable(
  'reports',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    reporterUserId: uuid('reporter_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    targetType: reportTargetTypeEnum('target_type').notNull(),
    targetId: uuid('target_id').notNull(),
    reason: reportReasonEnum('reason').notNull(),
    description: text('description'),
    status: reportStatusEnum('status').notNull().default('PENDING'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uniqueReporterTarget: uniqueIndex('unique_reporter_target_report').on(
      table.reporterUserId,
      table.targetType,
      table.targetId,
    ),
    targetIdx: index('reports_target_idx').on(table.targetType, table.targetId),
    reporterUserIdIdx: index('reports_reporter_user_id_idx').on(
      table.reporterUserId,
    ),
    statusIdx: index('reports_status_idx').on(table.status),
    createdAtIdx: index('reports_created_at_idx').on(table.createdAt),
  }),
);
