import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { isUUID } from 'class-validator';
import { calculateReadingTime } from '../../common/helpers/reading-time.helper';
import { RedisService } from '../redis/redis.service';
import type { AppUserIdentity } from '../users/users.service';
import { UsersService } from '../users/users.service';
import { BlogsRepository } from './blogs.repository';
import { BlogResponseDto } from './dto/blog-response.dto';
import { CreateBlogDto } from './dto/create-blog.dto';
import { ListBlogsQueryDto } from './dto/list-blogs.query.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

const BLOG_CACHE_TTL_SECONDS = 300;
const BLOG_LIST_CACHE_TTL_SECONDS = 60;

@Injectable()
export class BlogsService {
  constructor(
    @Inject(BlogsRepository)
    private readonly repository: BlogsRepository,
    @Inject(UsersService)
    private readonly usersService: UsersService,
    @Inject(RedisService)
    private readonly redis: RedisService,
  ) {}

  async create(identity: AppUserIdentity, dto: CreateBlogDto) {
    const user = await this.usersService.resolve(identity, true);
    if (!user) {
      throw new ForbiddenException(
        'Unable to resolve application user identity',
      );
    }
    const slug = dto.slug.trim();

    const existingSlug = await this.repository.findBySlug(slug);
    if (existingSlug) {
      throw new ConflictException('Blog slug already exists');
    }

    try {
      const record = await this.repository.create({
        userId: user.id,
        title: dto.title.trim(),
        slug,
        content: dto.content,
        thumbnailMediaId: dto.thumbnailMediaId,
        tags: dto.tags,
        status: dto.status,
        readingTime: calculateReadingTime(dto.content),
      });

      await this.invalidateListCaches();
      return BlogResponseDto.fromEntity(record);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Blog slug already exists');
      }
      throw error;
    }
  }

  async list(query: ListBlogsQueryDto) {
    const limit = query.limit ?? 20;
    const cursor = query.cursor ? this.decodeCursor(query.cursor) : undefined;
    const search = query.search?.trim() || undefined;
    const cacheKey = this.listCacheKey({
      limit,
      cursor: query.cursor ?? null,
      status: query.status ?? null,
      userId: query.userId ?? null,
      search: search ?? null,
    });

    const cached = await this.redis.getJson<{
      items: BlogResponseDto[];
      nextCursor: string | null;
    }>(cacheKey);

    if (cached) {
      return cached;
    }

    const rows = await this.repository.listActive({
      limit,
      cursor,
      status: query.status,
      userId: query.userId,
      search,
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];
    const result = {
      items: page.map((row) => BlogResponseDto.fromEntity(row)),
      nextCursor:
        hasMore && last ? this.encodeCursor(last.createdAt, last.id) : null,
    };

    await this.redis.setJson(cacheKey, result, BLOG_LIST_CACHE_TTL_SECONDS);
    return result;
  }

  async getById(id: string) {
    const cacheKey = `blog:${id}`;
    const cached = await this.redis.getJson<BlogResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const record = await this.repository.findActiveById(id);
    if (!record) {
      throw new NotFoundException('Blog not found');
    }

    const result = BlogResponseDto.fromEntity(record);
    await this.redis.setJson(cacheKey, result, BLOG_CACHE_TTL_SECONDS);
    return result;
  }

  async update(id: string, identity: AppUserIdentity, dto: UpdateBlogDto) {
    const hasUpdate = [
      dto.title,
      dto.slug,
      dto.content,
      dto.thumbnailMediaId,
      dto.tags,
      dto.status,
    ].some((value) => value !== undefined);

    if (!hasUpdate) {
      throw new BadRequestException('No fields to update');
    }

    const blog = await this.repository.findActiveById(id);
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    const user = await this.usersService.resolve(identity);
    if (!user || blog.userId !== user.id) {
      throw new ForbiddenException('You are not allowed to modify this blog');
    }

    if (dto.slug && dto.slug !== blog.slug) {
      const existingSlug = await this.repository.findBySlugExcludingId(
        dto.slug,
        id,
      );
      if (existingSlug) {
        throw new ConflictException('Blog slug already exists');
      }
    }

    try {
      const record = await this.repository.update(id, {
        title: dto.title?.trim(),
        slug: dto.slug,
        content: dto.content,
        thumbnailMediaId: dto.thumbnailMediaId,
        tags: dto.tags,
        status: dto.status,
        readingTime:
          dto.content !== undefined
            ? calculateReadingTime(dto.content)
            : undefined,
      });

      if (!record) {
        throw new NotFoundException('Blog not found');
      }

      await this.invalidateBlogCaches(id);
      return BlogResponseDto.fromEntity(record);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Blog slug already exists');
      }
      throw error;
    }
  }

  async softDelete(id: string, identity: AppUserIdentity) {
    const blog = await this.repository.findActiveById(id);
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    const user = await this.usersService.resolve(identity);
    if (!user || blog.userId !== user.id) {
      throw new ForbiddenException('You are not allowed to delete this blog');
    }

    const record = await this.repository.softDelete(id);
    if (!record) {
      throw new NotFoundException('Blog not found');
    }

    await this.invalidateBlogCaches(id);
    return {
      id: record.id,
      isActive: record.isActive,
    };
  }

  private encodeCursor(createdAt: Date, id: string) {
    return Buffer.from(
      JSON.stringify({ createdAt: createdAt.toISOString(), id }),
    ).toString('base64url');
  }

  private decodeCursor(cursor: string) {
    try {
      const parsed = JSON.parse(
        Buffer.from(cursor, 'base64url').toString('utf8'),
      ) as { createdAt?: string; id?: string };

      if (!parsed.createdAt || !parsed.id || !isUUID(parsed.id)) {
        throw new Error('invalid');
      }

      const createdAt = new Date(parsed.createdAt);
      if (Number.isNaN(createdAt.getTime())) {
        throw new Error('invalid');
      }

      return { createdAt, id: parsed.id };
    } catch {
      throw new BadRequestException('Invalid cursor');
    }
  }

  private listCacheKey(query: {
    limit: number;
    cursor: string | null;
    status: string | null;
    userId: string | null;
    search: string | null;
  }) {
    const hash = createHash('sha256')
      .update(JSON.stringify(query))
      .digest('hex');
    return `blogs:list:${hash}`;
  }

  private async invalidateBlogCaches(blogId: string) {
    await this.redis.del(`blog:${blogId}`);
    await this.invalidateListCaches();
  }

  private async invalidateListCaches() {
    await this.redis.delByPattern('blogs:list:*');
  }

  private isUniqueViolation(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === '23505'
    );
  }
}
