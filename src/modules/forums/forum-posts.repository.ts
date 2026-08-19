import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, sql, type SQL } from 'drizzle-orm';
import {
  buildCursorCondition,
  type CursorPayload,
} from '../../common/helpers/cursor-pagination.helper';
import { DatabaseService } from '../../database/database.service';
import { forumPosts } from '../../database/schema/forums.schema';

@Injectable()
export class ForumPostsRepository {
  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
  ) {}

  async create(data: {
    topicId: string;
    userId: string;
    content: string;
    parentPostId?: string | null;
    isReply: boolean;
  }) {
    const [record] = await this.database.db
      .insert(forumPosts)
      .values({
        topicId: data.topicId,
        userId: data.userId,
        content: data.content,
        parentPostId: data.parentPostId,
        isReply: data.isReply,
        isActive: true,
      })
      .returning();
    return record;
  }

  async findActiveById(id: string) {
    const [record] = await this.database.db
      .select()
      .from(forumPosts)
      .where(and(eq(forumPosts.id, id), eq(forumPosts.isActive, true)))
      .limit(1);
    return record;
  }

  async listActiveByTopicId(params: {
    topicId: string;
    limit: number;
    cursor?: CursorPayload;
  }) {
    const conditions: SQL[] = [
      eq(forumPosts.topicId, params.topicId),
      eq(forumPosts.isActive, true),
    ];

    if (params.cursor) {
      const cursorFilter = buildCursorCondition(
        forumPosts.createdAt,
        forumPosts.id,
        params.cursor,
      );
      if (cursorFilter) {
        conditions.push(cursorFilter);
      }
    }

    return this.database.db
      .select()
      .from(forumPosts)
      .where(and(...conditions))
      .orderBy(desc(forumPosts.createdAt), desc(forumPosts.id))
      .limit(params.limit + 1);
  }

  async updateContent(id: string, content: string) {
    const [record] = await this.database.db
      .update(forumPosts)
      .set({
        content,
        updatedAt: new Date(),
      })
      .where(eq(forumPosts.id, id))
      .returning();
    return record;
  }

  async softDelete(id: string) {
    const result = await this.database.db.execute(sql`
      WITH RECURSIVE post_tree AS (
        SELECT id FROM forum_posts WHERE id = ${id}::uuid
        UNION ALL
        SELECT p.id
        FROM forum_posts p
        INNER JOIN post_tree t ON p.parent_post_id = t.id
      )
      UPDATE forum_posts
      SET is_active = false,
          updated_at = now()
      WHERE id IN (SELECT id FROM post_tree)
        AND is_active = true
      RETURNING id
    `);

    return (result as unknown as { rows?: { id: string }[] }).rows ?? [];
  }

  async findActiveByParentId(parentPostId: string) {
    return this.database.db
      .select()
      .from(forumPosts)
      .where(
        and(
          eq(forumPosts.parentPostId, parentPostId),
          eq(forumPosts.isActive, true),
        ),
      );
  }
}
