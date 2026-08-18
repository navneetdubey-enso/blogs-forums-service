import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, ilike, lt, ne, or, type SQL } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import { blogs } from '../../database/schema/blogs.schema';
import type { BlogStatus } from './dto/create-blog.dto';

export type BlogCursor = {
  createdAt: Date;
  id: string;
};

export type ListBlogsParams = {
  limit: number;
  cursor?: BlogCursor;
  status?: BlogStatus;
  userId?: string;
  search?: string;
};

@Injectable()
export class BlogsRepository {
  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
  ) {}

  async create(data: {
    userId: string;
    title: string;
    slug: string;
    content: string;
    thumbnailMediaId?: string;
    tags?: string[];
    status: BlogStatus;
    readingTime: number;
  }) {
    const [record] = await this.database.db
      .insert(blogs)
      .values(data)
      .returning();
    return record;
  }

  async findActiveById(id: string) {
    return this.database.db.query.blogs.findFirst({
      where: and(eq(blogs.id, id), eq(blogs.isActive, true)),
    });
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

  async listActive(params: ListBlogsParams) {
    const conditions: SQL[] = [eq(blogs.isActive, true)];

    if (params.status) {
      conditions.push(eq(blogs.status, params.status));
    }

    if (params.userId) {
      conditions.push(eq(blogs.userId, params.userId));
    }

    if (params.search) {
      const term = `%${params.search.replace(/[%_]/g, '\\$&')}%`;
      const searchFilter = or(
        ilike(blogs.title, term),
        ilike(blogs.content, term),
      );
      if (searchFilter) {
        conditions.push(searchFilter);
      }
    }

    if (params.cursor) {
      const cursorFilter = or(
        lt(blogs.createdAt, params.cursor.createdAt),
        and(
          eq(blogs.createdAt, params.cursor.createdAt),
          lt(blogs.id, params.cursor.id),
        ),
      );
      if (cursorFilter) {
        conditions.push(cursorFilter);
      }
    }

    return this.database.db
      .select()
      .from(blogs)
      .where(and(...conditions))
      .orderBy(desc(blogs.createdAt), desc(blogs.id))
      .limit(params.limit + 1);
  }

  async update(
    id: string,
    data: {
      title?: string;
      slug?: string;
      content?: string;
      thumbnailMediaId?: string | null;
      tags?: string[] | null;
      status?: BlogStatus;
      readingTime?: number;
    },
  ) {
    const [record] = await this.database.db
      .update(blogs)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(blogs.id, id), eq(blogs.isActive, true)))
      .returning();

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
}
