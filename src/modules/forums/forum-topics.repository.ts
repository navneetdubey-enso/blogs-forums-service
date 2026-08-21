import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, ilike, ne, or, sql, type SQL } from 'drizzle-orm';
import {
  buildCursorCondition,
  type CursorPayload,
} from '../../common/helpers/cursor-pagination.helper';
import { DatabaseService } from '../../database/database.service';
import { forumTopics } from '../../database/schema/forums.schema';
import type { ForumTopicStatus } from './dto/create-topic.dto';

@Injectable()
export class ForumTopicsRepository {
  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
  ) {}

  async create(data: {
    forumId: string;
    userId: string;
    title: string;
    slug: string;
    content: string;
    status: ForumTopicStatus;
  }) {
    const [record] = await this.database.db
      .insert(forumTopics)
      .values(data)
      .returning();
    return record;
  }

  async findActiveById(id: string) {
    return this.database.db.query.forumTopics.findFirst({
      where: and(eq(forumTopics.id, id), eq(forumTopics.isActive, true)),
    });
  }

  async findBySlug(slug: string) {
    return this.database.db.query.forumTopics.findFirst({
      where: eq(forumTopics.slug, slug),
    });
  }

  async findBySlugExcludingId(slug: string, id: string) {
    return this.database.db.query.forumTopics.findFirst({
      where: and(eq(forumTopics.slug, slug), ne(forumTopics.id, id)),
    });
  }

  async listActive(params: {
    limit: number;
    cursor?: CursorPayload;
    forumId?: string;
    userId?: string;
    status?: ForumTopicStatus;
    search?: string;
  }) {
    const conditions: SQL[] = [eq(forumTopics.isActive, true)];

    if (params.forumId) {
      conditions.push(eq(forumTopics.forumId, params.forumId));
    }
    if (params.userId) {
      conditions.push(eq(forumTopics.userId, params.userId));
    }
    if (params.status) {
      conditions.push(eq(forumTopics.status, params.status));
    }
    if (params.search) {
      const term = `%${params.search.replace(/[%_]/g, '\\$&')}%`;
      const searchFilter = or(
        ilike(forumTopics.title, term),
        ilike(forumTopics.content, term),
      );
      if (searchFilter) {
        conditions.push(searchFilter);
      }
    }
    if (params.cursor) {
      const cursorFilter = buildCursorCondition(
        forumTopics.createdAt,
        forumTopics.id,
        params.cursor,
      );
      if (cursorFilter) {
        conditions.push(cursorFilter);
      }
    }

    return this.database.db
      .select()
      .from(forumTopics)
      .where(and(...conditions))
      .orderBy(desc(forumTopics.createdAt), desc(forumTopics.id))
      .limit(params.limit + 1);
  }

  async update(
    id: string,
    data: {
      title?: string;
      slug?: string;
      content?: string;
      status?: ForumTopicStatus;
    },
  ) {
    const [record] = await this.database.db
      .update(forumTopics)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(forumTopics.id, id), eq(forumTopics.isActive, true)))
      .returning();
    return record;
  }

  async softDelete(id: string) {
    const [record] = await this.database.db
      .update(forumTopics)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(and(eq(forumTopics.id, id), eq(forumTopics.isActive, true)))
      .returning();

    if (record) {
      await this.database.db.execute(sql`
        UPDATE forum_comments
        SET is_active = false,
            updated_at = now()
        WHERE topic_id = ${id}::uuid
          AND is_active = true
      `);
    }

    return record;
  }
}
