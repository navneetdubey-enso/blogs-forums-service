import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, sql, type SQL } from 'drizzle-orm';
import {
  buildCursorCondition,
  type CursorPayload,
} from '../../common/helpers/cursor-pagination.helper';
import { DatabaseService } from '../../database/database.service';
import { forumComments } from '../../database/schema/forums.schema';

@Injectable()
export class ForumCommentsRepository {
  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
  ) {}

  async create(data: {
    topicId: string;
    userId: string;
    content: string;
    parentCommentId?: string | null;
    isReply: boolean;
  }) {
    const [record] = await this.database.db
      .insert(forumComments)
      .values({
        topicId: data.topicId,
        userId: data.userId,
        content: data.content,
        parentCommentId: data.parentCommentId,
        isReply: data.isReply,
        isActive: true,
      })
      .returning();
    return record;
  }

  async findActiveById(id: string) {
    const [record] = await this.database.db
      .select()
      .from(forumComments)
      .where(and(eq(forumComments.id, id), eq(forumComments.isActive, true)))
      .limit(1);
    return record;
  }

  async listActiveByTopicId(params: {
    topicId: string;
    limit: number;
    cursor?: CursorPayload;
  }) {
    const conditions: SQL[] = [
      eq(forumComments.topicId, params.topicId),
      eq(forumComments.isActive, true),
    ];

    if (params.cursor) {
      const cursorFilter = buildCursorCondition(
        forumComments.createdAt,
        forumComments.id,
        params.cursor,
      );
      if (cursorFilter) {
        conditions.push(cursorFilter);
      }
    }

    return this.database.db
      .select()
      .from(forumComments)
      .where(and(...conditions))
      .orderBy(desc(forumComments.createdAt), desc(forumComments.id))
      .limit(params.limit + 1);
  }

  async updateContent(id: string, content: string) {
    const [record] = await this.database.db
      .update(forumComments)
      .set({
        content,
        updatedAt: new Date(),
      })
      .where(eq(forumComments.id, id))
      .returning();
    return record;
  }

  async softDelete(id: string) {
    const result = await this.database.db.execute(sql`
      WITH RECURSIVE comment_tree AS (
        SELECT id FROM forum_comments WHERE id = ${id}::uuid
        UNION ALL
        SELECT c.id
        FROM forum_comments c
        INNER JOIN comment_tree t ON c.parent_comment_id = t.id
      )
      UPDATE forum_comments
      SET is_active = false,
          updated_at = now()
      WHERE id IN (SELECT id FROM comment_tree)
        AND is_active = true
      RETURNING id
    `);

    return (result as unknown as { rows?: { id: string }[] }).rows ?? [];
  }

  async findActiveByParentId(parentCommentId: string) {
    return this.database.db
      .select()
      .from(forumComments)
      .where(
        and(
          eq(forumComments.parentCommentId, parentCommentId),
          eq(forumComments.isActive, true),
        ),
      );
  }
}
