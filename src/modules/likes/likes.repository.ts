import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import { blogLikes } from '../../database/schema/blog-likes.schema';
import { blogs } from '../../database/schema/blogs.schema';
import { forumLikes } from '../../database/schema/forum-likes.schema';
import { forums } from '../../database/schema/forums.schema';

@Injectable()
export class LikesRepository {
  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
  ) {}

  async createLike(blogId: string, userId: string) {
    await this.database.db.transaction(async (tx) => {
      await tx.insert(blogLikes).values({
        blogId,
        userId,
      });

      await tx
        .update(blogs)
        .set({
          likeCount: sql`${blogs.likeCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(blogs.id, blogId));
    });
  }

  async deleteLike(blogId: string, userId: string) {
    const [deletedLike] = await this.database.db
      .delete(blogLikes)
      .where(and(eq(blogLikes.blogId, blogId), eq(blogLikes.userId, userId)))
      .returning();

    if (!deletedLike) {
      return null;
    }

    await this.database.db
      .update(blogs)
      .set({
        likeCount: sql`GREATEST(0, ${blogs.likeCount} - 1)`,
        updatedAt: new Date(),
      })
      .where(eq(blogs.id, blogId));

    return deletedLike;
  }

  async createForumLike(categoryId: string, userId: string) {
    await this.database.db.transaction(async (tx) => {
      await tx.insert(forumLikes).values({
        categoryId,
        userId,
      });

      await tx
        .update(forums)
        .set({
          likeCount: sql`${forums.likeCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(forums.id, categoryId));
    });
  }

  async deleteForumLike(categoryId: string, userId: string) {
    const [deletedLike] = await this.database.db
      .delete(forumLikes)
      .where(
        and(eq(forumLikes.categoryId, categoryId), eq(forumLikes.userId, userId)),
      )
      .returning();

    if (!deletedLike) {
      return null;
    }

    await this.database.db
      .update(forums)
      .set({
        likeCount: sql`GREATEST(0, ${forums.likeCount} - 1)`,
        updatedAt: new Date(),
      })
      .where(eq(forums.id, categoryId));

    return deletedLike;
  }
}
