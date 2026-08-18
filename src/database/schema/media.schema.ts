import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const ownerTypeEnum = pgEnum('owner_type', ['USER']);
export const visibilityEnum = pgEnum('visibility', ['PUBLIC', 'PRIVATE']);

export const media = pgTable('media', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerType: ownerTypeEnum('owner_type'),
  ownerUuid: uuid('owner_uuid'),
  documentType: varchar('document_type', { length: 100 }),
  originalName: varchar('original_name', { length: 255 }),
  storedName: varchar('stored_name', { length: 255 }),
  extension: varchar('extension', { length: 10 }),
  mimeType: varchar('mime_type', { length: 100 }),
  size: integer('size'),
  bucketName: varchar('bucket_name', { length: 255 }),
  objectKey: varchar('object_key', { length: 1024 }),
  etag: varchar('etag', { length: 255 }),
  visibility: visibilityEnum('visibility'),
  refModule: varchar('ref_module', { length: 100 }),
  refId: varchar('ref_id', { length: 255 }),
  uploadedBy: uuid('uploaded_by').references(() => users.id, {
    onDelete: 'set null',
  }),
  isDeleted: boolean('is_deleted').notNull().default(false),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
