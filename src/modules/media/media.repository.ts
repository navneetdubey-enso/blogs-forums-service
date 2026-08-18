import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import { media } from '../../database/schema/media.schema';

export type MediaRow = InferSelectModel<typeof media>;
export type NewMedia = InferInsertModel<typeof media>;

@Injectable()
export class MediaRepository {
  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
  ) {}

  async create(data: NewMedia): Promise<MediaRow> {
    const [record] = await this.database.db
      .insert(media)
      .values(data)
      .returning();
    return record;
  }

  async createMany(data: NewMedia[]): Promise<MediaRow[]> {
    return this.database.db.insert(media).values(data).returning();
  }

  async findById(id: string): Promise<MediaRow | null> {
    const [record] = await this.database.db
      .select()
      .from(media)
      .where(and(eq(media.id, id), eq(media.isDeleted, false)))
      .limit(1);
    return record || null;
  }
}
