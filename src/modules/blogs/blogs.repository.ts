import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, ne, sql, type SQL } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import {
  buildCursorCondition,
  type CursorPayload,
} from '../../common/helpers/cursor-pagination.helper';
import { DatabaseService } from '../../database/database.service';
import { blogLikes } from '../../database/schema/blog-likes.schema';
import { blogs } from '../../database/schema/blogs.schema';
import { media } from '../../database/schema/media.schema';
import { BlogStatus } from './dto/create-blog.dto';

export type ListBlogsParams = {
  limit: number;
  cursor?: CursorPayload;
  status?: BlogStatus;
  userId?: string;
  search?: string;
};

export type BlogRow = InferSelectModel<typeof blogs>;

export type BlogWithThumbnail = BlogRow & {
  thumbnailBucketName: string | null;
  thumbnailObjectKey: string | null;
  thumbnailVisibility: string | null;
};

@Injectable()
export class BlogsRepository {
  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
  ) {}

  async create(data: {
    userId: string;
    title: string | null;
    slug: string | null;
    content: string | null;
    thumbnailMediaId?: string;
    thumbnailUrl?: string | null;
    tags?: string[];
    links?: string[];
    mediaUrls?: string[];
    status: BlogStatus;
    readingTime: number | null;
  }) {
    const [record] = await this.database.db
      .insert(blogs)
      .values({
        ...data,
        status: data.status as 'DRAFT' | 'PUBLISHED',
      })
      .returning();

    await this.refreshSearchVector(record.id);
    return record;
  }

  async refreshSearchVector(id: string) {
    await this.database.db.execute(sql`
      UPDATE blogs
      SET search_vector = to_tsvector(
        'english',
        coalesce(title, '') || ' ' || coalesce(content, '')
      )
      WHERE id = ${id}::uuid
    `);
  }

  async findActiveById(id: string) {
    return this.database.db.query.blogs.findFirst({
      where: and(eq(blogs.id, id), eq(blogs.isActive, true)),
    });
  }

  async findActiveWithThumbnail(
    id: string,
  ): Promise<BlogWithThumbnail | undefined> {
    const [row] = await this.database.db
      .select({
        blog: blogs,
        thumbnailBucketName: media.bucketName,
        thumbnailObjectKey: media.objectKey,
        thumbnailVisibility: media.visibility,
      })
      .from(blogs)
      .leftJoin(
        media,
        and(eq(blogs.thumbnailMediaId, media.id), eq(media.isDeleted, false)),
      )
      .where(and(eq(blogs.id, id), eq(blogs.isActive, true)))
      .limit(1);

    return row ? this.toBlogWithThumbnail(row) : undefined;
  }

  async findBySlug(slug: string) {
    return this.database.db.query.blogs.findFirst({
      where: eq(blogs.slug, slug),
    });
  }

  async findBySlugExcludingId(slug: string, id: string) {
    return this.database.db.query.blogs.findFirst({
      where: and(eq(blogs.slug, slug), ne(blogs.id, id)),
    });
  }

  async findLikeByBlogAndUser(blogId: string, userId: string) {
    const [record] = await this.database.db
      .select({ id: blogLikes.id })
      .from(blogLikes)
      .where(and(eq(blogLikes.blogId, blogId), eq(blogLikes.userId, userId)))
      .limit(1);
    return record;
  }

  async listActive(params: ListBlogsParams): Promise<BlogWithThumbnail[]> {
    const conditions: SQL[] = [eq(blogs.isActive, true)];

    if (params.status) {
      if (
        params.status === BlogStatus.DRAFT ||
        params.status === BlogStatus.PUBLISHED
      ) {
        conditions.push(
          eq(blogs.status, params.status as 'DRAFT' | 'PUBLISHED'),
        );
      } else {
        return [];
      }
    }

    if (params.userId) {
      conditions.push(eq(blogs.userId, params.userId));
    }

    if (params.search) {
      conditions.push(
        sql`${blogs.searchVector} @@ websearch_to_tsquery('english', ${params.search})`,
      );
    }

    if (params.cursor) {
      const cursorFilter = buildCursorCondition(
        blogs.createdAt,
        blogs.id,
        params.cursor,
      );
      if (cursorFilter) {
        conditions.push(cursorFilter);
      }
    }

    const rows = await this.database.db
      .select({
        blog: blogs,
        thumbnailBucketName: media.bucketName,
        thumbnailObjectKey: media.objectKey,
        thumbnailVisibility: media.visibility,
      })
      .from(blogs)
      .leftJoin(
        media,
        and(eq(blogs.thumbnailMediaId, media.id), eq(media.isDeleted, false)),
      )
      .where(and(...conditions))
      .orderBy(desc(blogs.createdAt), desc(blogs.id))
      .limit(params.limit + 1);

    return rows.map((row) => this.toBlogWithThumbnail(row));
  }

  async update(
    id: string,
    data: {
      title?: string | null;
      slug?: string | null;
      content?: string | null;
      thumbnailMediaId?: string | null;
      thumbnailUrl?: string | null;
      tags?: string[] | null;
      links?: string[] | null;
      mediaUrls?: string[] | null;
      status?: BlogStatus;
      readingTime?: number | null;
    },
  ) {
    const shouldRefreshSearchVector =
      data.title !== undefined || data.content !== undefined;

    const [record] = await this.database.db
      .update(blogs)
      .set({
        ...data,
        status: data.status as 'DRAFT' | 'PUBLISHED' | undefined,
        updatedAt: new Date(),
      })
      .where(and(eq(blogs.id, id), eq(blogs.isActive, true)))
      .returning();

    if (record && shouldRefreshSearchVector) {
      await this.refreshSearchVector(id);
    }

    return record;
  }

  async softDelete(id: string) {
    const [record] = await this.database.db
      .update(blogs)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(and(eq(blogs.id, id), eq(blogs.isActive, true)))
      .returning();

    return record;
  }

  private toBlogWithThumbnail(row: {
    blog: BlogRow;
    thumbnailBucketName: string | null;
    thumbnailObjectKey: string | null;
    thumbnailVisibility: string | null;
  }): BlogWithThumbnail {
    return {
      ...row.blog,
      thumbnailBucketName: row.thumbnailBucketName,
      thumbnailObjectKey: row.thumbnailObjectKey,
      thumbnailVisibility: row.thumbnailVisibility,
    };
  }
}
