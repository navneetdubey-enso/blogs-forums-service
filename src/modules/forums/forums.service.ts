import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  decodeCursor,
  sliceCursorPage,
} from '../../common/helpers/cursor-pagination.helper';
import { isUniqueViolation } from '../../common/helpers/postgres.helper';
import type { AppUserIdentity } from '../users/users.service';
import { UsersService } from '../users/users.service';
import { CreateForumDto } from './dto/create-forum.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateTopicDto } from './dto/create-topic.dto';
import { ListForumsQueryDto } from './dto/list-forums.query.dto';
import { ListMyTopicsQueryDto } from './dto/list-my-topics.query.dto';
import { ListPostsQueryDto } from './dto/list-posts.query.dto';
import { ListTopicsQueryDto } from './dto/list-topics.query.dto';
import { UpdateForumDto } from './dto/update-forum.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { ForumPostsRepository } from './forum-posts.repository';
import { ForumTopicsRepository } from './forum-topics.repository';
import { ForumsRepository } from './forums.repository';

@Injectable()
export class ForumsService {
  constructor(
    @Inject(ForumsRepository)
    private readonly forumsRepository: ForumsRepository,
    @Inject(ForumTopicsRepository)
    private readonly topicsRepository: ForumTopicsRepository,
    @Inject(ForumPostsRepository)
    private readonly postsRepository: ForumPostsRepository,
    @Inject(UsersService)
    private readonly usersService: UsersService,
  ) {}

  async createForum(dto: CreateForumDto) {
    const slug = dto.slug.trim();
    const existingSlug = await this.forumsRepository.findBySlug(slug);
    if (existingSlug) {
      throw new ConflictException('Forum slug already exists');
    }

    try {
      return await this.forumsRepository.create({
        name: dto.name.trim(),
        slug,
        description: dto.description,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Forum slug already exists');
      }
      throw error;
    }
  }

  async listForums(query: ListForumsQueryDto) {
    const limit = query.limit ?? 20;
    const cursor = query.cursor ? decodeCursor(query.cursor) : undefined;
    const rows = await this.forumsRepository.listActive({
      limit,
      cursor,
      search: query.search?.trim() || undefined,
    });
    const page = sliceCursorPage(rows, limit);
    return { items: page.items, nextCursor: page.nextCursor };
  }

  async getForum(id: string) {
    const forum = await this.forumsRepository.findActiveById(id);
    if (!forum) {
      throw new NotFoundException('Forum not found');
    }
    return forum;
  }

  async updateForum(id: string, dto: UpdateForumDto) {
    const hasUpdate = [dto.name, dto.slug, dto.description].some(
      (value) => value !== undefined,
    );
    if (!hasUpdate) {
      throw new BadRequestException('No fields to update');
    }

    const forum = await this.forumsRepository.findActiveById(id);
    if (!forum) {
      throw new NotFoundException('Forum not found');
    }

    if (dto.slug && dto.slug !== forum.slug) {
      const existingSlug = await this.forumsRepository.findBySlugExcludingId(
        dto.slug,
        id,
      );
      if (existingSlug) {
        throw new ConflictException('Forum slug already exists');
      }
    }

    try {
      const record = await this.forumsRepository.update(id, {
        name: dto.name?.trim(),
        slug: dto.slug,
        description: dto.description,
      });
      if (!record) {
        throw new NotFoundException('Forum not found');
      }
      return record;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Forum slug already exists');
      }
      throw error;
    }
  }

  async deleteForum(id: string) {
    const record = await this.forumsRepository.softDelete(id);
    if (!record) {
      throw new NotFoundException('Forum not found');
    }
    return { id: record.id, isActive: record.isActive };
  }

  async createTopic(
    forumId: string,
    dto: CreateTopicDto,
    identity: AppUserIdentity,
  ) {
    await this.getForum(forumId);
    const user = await this.usersService.require(identity, true);
    const slug = dto.slug.trim();

    const existingSlug = await this.topicsRepository.findBySlug(slug);
    if (existingSlug) {
      throw new ConflictException('Topic slug already exists');
    }

    try {
      return await this.topicsRepository.create({
        forumId,
        userId: user.id,
        title: dto.title.trim(),
        slug,
        content: dto.content,
        status: dto.status ?? 'DRAFT',
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Topic slug already exists');
      }
      throw error;
    }
  }

  async listTopics(forumId: string, query: ListTopicsQueryDto) {
    await this.getForum(forumId);
    return this.pageTopics({
      ...query,
      forumId,
    });
  }

  async listMyTopics(identity: AppUserIdentity, query: ListMyTopicsQueryDto) {
    const requestedUserId = query.userId ?? query.user_id;
    if (!requestedUserId) {
      throw new BadRequestException('user_id is required');
    }

    const user = await this.usersService.require(identity);
    if (user.id !== requestedUserId) {
      throw new ForbiddenException(
        'user_id must match the authenticated application user',
      );
    }

    return this.pageTopics({
      ...query,
      userId: requestedUserId,
    });
  }

  async getTopic(id: string) {
    const topic = await this.topicsRepository.findActiveById(id);
    if (!topic) {
      throw new NotFoundException('Topic not found');
    }
    return topic;
  }

  async updateTopic(
    id: string,
    dto: UpdateTopicDto,
    identity: AppUserIdentity,
  ) {
    const hasUpdate = [dto.title, dto.slug, dto.content, dto.status].some(
      (value) => value !== undefined,
    );
    if (!hasUpdate) {
      throw new BadRequestException('No fields to update');
    }

    const topic = await this.requireOwnedTopic(
      id,
      identity,
      'You are not allowed to modify this topic',
    );

    if (dto.slug && dto.slug !== topic.slug) {
      const existingSlug = await this.topicsRepository.findBySlugExcludingId(
        dto.slug,
        id,
      );
      if (existingSlug) {
        throw new ConflictException('Topic slug already exists');
      }
    }

    try {
      const record = await this.topicsRepository.update(id, {
        title: dto.title?.trim(),
        slug: dto.slug,
        content: dto.content,
        status: dto.status,
      });
      if (!record) {
        throw new NotFoundException('Topic not found');
      }
      return record;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Topic slug already exists');
      }
      throw error;
    }
  }

  async deleteTopic(id: string, identity: AppUserIdentity) {
    await this.requireOwnedTopic(
      id,
      identity,
      'You are not allowed to delete this topic',
    );
    const record = await this.topicsRepository.softDelete(id);
    if (!record) {
      throw new NotFoundException('Topic not found');
    }
    return { id: record.id, isActive: record.isActive };
  }

  async createPost(
    topicId: string,
    dto: CreatePostDto,
    identity: AppUserIdentity,
  ) {
    await this.getTopic(topicId);
    const user = await this.usersService.require(identity, true);

    let parentPostId: string | null = null;
    let isReply = false;

    if (dto.parentPostId) {
      const parent = await this.postsRepository.findActiveById(
        dto.parentPostId,
      );
      if (!parent) {
        throw new NotFoundException('Parent post not found');
      }
      if (parent.topicId !== topicId) {
        throw new BadRequestException(
          'Parent post does not belong to this topic',
        );
      }
      parentPostId = parent.id;
      isReply = true;
    }

    return this.postsRepository.create({
      topicId,
      userId: user.id,
      content: dto.content,
      parentPostId,
      isReply,
    });
  }

  async listPosts(topicId: string, query: ListPostsQueryDto) {
    await this.getTopic(topicId);
    const limit = query.limit ?? 10;
    const cursor = query.cursor ? decodeCursor(query.cursor) : undefined;
    const rows = await this.postsRepository.listActiveByTopicId({
      topicId,
      limit,
      cursor,
    });
    const page = sliceCursorPage(rows, limit);
    return {
      items: page.items,
      pagination: {
        limit,
        nextCursor: page.nextCursor,
        hasNextPage: page.hasNextPage,
      },
    };
  }

  async updatePost(id: string, dto: UpdatePostDto, identity: AppUserIdentity) {
    const existing = await this.postsRepository.findActiveById(id);
    if (!existing) {
      throw new NotFoundException('Post not found');
    }

    const user = await this.usersService.resolve(identity);
    if (!user || existing.userId !== user.id) {
      throw new ForbiddenException(
        'You are not authorized to update this post',
      );
    }

    return this.postsRepository.updateContent(id, dto.content);
  }

  async deletePost(id: string, identity: AppUserIdentity) {
    const existing = await this.postsRepository.findActiveById(id);
    if (!existing) {
      throw new NotFoundException('Post not found');
    }

    const user = await this.usersService.resolve(identity);
    const topic = await this.topicsRepository.findActiveById(existing.topicId);
    const isPostAuthor = !!user && existing.userId === user.id;
    const isTopicOwner = !!user && topic?.userId === user.id;

    if (!isPostAuthor && !isTopicOwner) {
      throw new ForbiddenException(
        'You are not authorized to delete this post',
      );
    }

    await this.postsRepository.softDelete(id);
    return { id, isActive: false };
  }

  private async pageTopics(params: {
    limit?: number;
    cursor?: string;
    status?: ListTopicsQueryDto['status'];
    search?: string;
    forumId?: string;
    userId?: string;
  }) {
    const limit = params.limit ?? 20;
    const cursor = params.cursor ? decodeCursor(params.cursor) : undefined;
    const rows = await this.topicsRepository.listActive({
      limit,
      cursor,
      forumId: params.forumId,
      userId: params.userId,
      status: params.status,
      search: params.search?.trim() || undefined,
    });
    const page = sliceCursorPage(rows, limit);
    return { items: page.items, nextCursor: page.nextCursor };
  }

  private async requireOwnedTopic(
    id: string,
    identity: AppUserIdentity,
    forbiddenMessage: string,
  ) {
    const topic = await this.topicsRepository.findActiveById(id);
    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    const user = await this.usersService.resolve(identity);
    if (!user || topic.userId !== user.id) {
      throw new ForbiddenException(forbiddenMessage);
    }

    return topic;
  }
}
