import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, type SQL } from 'drizzle-orm';
import {
  buildCursorCondition,
  type CursorPayload,
} from '../../common/helpers/cursor-pagination.helper';
import { DatabaseService } from '../../database/database.service';
import { blogs } from '../../database/schema/blogs.schema';
import { comments } from '../../database/schema/comments.schema';

@Injectable()
export class CommentsRepository {
  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
  ) {}

  async create(data: {
    blogId: string;
    userId: string;
    content: string;
    parentCommentId?: string | null;
    isReply: boolean;
  }) {
    const [record] = await this.database.db
      .insert(comments)
      .values({
        blogId: data.blogId,
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
      .from(comments)
      .where(and(eq(comments.id, id), eq(comments.isActive, true)))
      .limit(1);
    return record;
  }

  async findActiveWithBlogOwner(commentId: string) {
    const [record] = await this.database.db
      .select({
        comment: comments,
        blogUserId: blogs.userId,
      })
      .from(comments)
      .leftJoin(blogs, eq(comments.blogId, blogs.id))
      .where(and(eq(comments.id, commentId), eq(comments.isActive, true)))
      .limit(1);
    return record;
  }

  async listActiveByBlogId(params: {
    blogId: string;
    limit: number;
    cursor?: CursorPayload;
  }) {
    const conditions: SQL[] = [
      eq(comments.blogId, params.blogId),
      eq(comments.isActive, true),
    ];

    if (params.cursor) {
      const cursorFilter = buildCursorCondition(
        comments.createdAt,
        comments.id,
        params.cursor,
      );
      if (cursorFilter) {
        conditions.push(cursorFilter);
      }
    }

    return this.database.db
      .select()
      .from(comments)
      .where(and(...conditions))
      .orderBy(desc(comments.createdAt), desc(comments.id))
      .limit(params.limit + 1);
  }

  async updateContent(id: string, content: string) {
    const [record] = await this.database.db
      .update(comments)
      .set({
        content,
        updatedAt: new Date(),
      })
      .where(eq(comments.id, id))
      .returning();
    return record;
  }

  async softDelete(id: string) {
    const [record] = await this.database.db
      .update(comments)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(comments.id, id))
      .returning();
    return record;
  }
}
