import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, ilike, ne, or, type SQL } from 'drizzle-orm';
import {
  buildCursorCondition,
  type CursorPayload,
} from '../../common/helpers/cursor-pagination.helper';
import { DatabaseService } from '../../database/database.service';
import { forumLikes } from '../../database/schema/forum-likes.schema';
import { forums } from '../../database/schema/forums.schema';

@Injectable()
export class ForumsRepository {
  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
  ) {}

  async create(data: { name: string; slug: string; description?: string }) {
    const [record] = await this.database.db
      .insert(forums)
      .values(data)
      .returning();
    return record;
  }

  async findActiveById(id: string) {
    return this.database.db.query.forums.findFirst({
      where: and(eq(forums.id, id), eq(forums.isActive, true)),
    });
  }

  async findBySlug(slug: string) {
    return this.database.db.query.forums.findFirst({
      where: eq(forums.slug, slug),
    });
  }

  async findBySlugExcludingId(slug: string, id: string) {
    return this.database.db.query.forums.findFirst({
      where: and(eq(forums.slug, slug), ne(forums.id, id)),
    });
  }

  async findLikeByForumAndUser(forumId: string, userId: string) {
    const [record] = await this.database.db
      .select({ id: forumLikes.id })
      .from(forumLikes)
      .where(and(eq(forumLikes.forumId, forumId), eq(forumLikes.userId, userId)))
      .limit(1);
    return record;
  }

  async listActive(params: {
    limit: number;
    cursor?: CursorPayload;
    search?: string;
  }) {
    const conditions: SQL[] = [eq(forums.isActive, true)];

    if (params.search) {
      const term = `%${params.search.replace(/[%_]/g, '\\$&')}%`;
      const searchFilter = or(
        ilike(forums.name, term),
        ilike(forums.description, term),
      );
      if (searchFilter) {
        conditions.push(searchFilter);
      }
    }

    if (params.cursor) {
      const cursorFilter = buildCursorCondition(
        forums.createdAt,
        forums.id,
        params.cursor,
      );
      if (cursorFilter) {
        conditions.push(cursorFilter);
      }
    }

    return this.database.db
      .select()
      .from(forums)
      .where(and(...conditions))
      .orderBy(desc(forums.createdAt), desc(forums.id))
      .limit(params.limit + 1);
  }

  async update(
    id: string,
    data: { name?: string; slug?: string; description?: string | null },
  ) {
    const [record] = await this.database.db
      .update(forums)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(forums.id, id), eq(forums.isActive, true)))
      .returning();
    return record;
  }

  async softDelete(id: string) {
    const [record] = await this.database.db
      .update(forums)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(and(eq(forums.id, id), eq(forums.isActive, true)))
      .returning();
    return record;
  }
}
