import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { MediaService } from '../media/media.service';
import { RedisService } from '../redis/redis.service';
import type { AppUserIdentity } from '../users/users.service';
import { UsersService } from '../users/users.service';
import { BlogsRepository } from './blogs.repository';
import { BlogsService } from './blogs.service';

const identity: AppUserIdentity = {
  appType: 'INFOCALLING',
  appUserId: 'app-user-1',
  universeUserId: 1001,
  appUserRole: 'author',
};

describe('BlogsService', () => {
  const userId = 'user-1';

  const blogsRepository = {
    findBySlug: jest.fn(),
    create: jest.fn(),
    listActive: jest.fn(),
    findActiveWithThumbnail: jest.fn(),
    findLikeByBlogAndUser: jest.fn(),
    findActiveById: jest.fn(),
    findBySlugExcludingId: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const usersService = {
    require: jest.fn(),
    resolve: jest.fn(),
  };

  const redis = {
    getJson: jest.fn(),
    setJson: jest.fn(),
    del: jest.fn(),
    delByPattern: jest.fn(),
  };

  const mediaService = {
    resolveStorageUrl: jest.fn(),
    findOne: jest.fn(),
  };

  let service: BlogsService;

  beforeEach(() => {
    jest.clearAllMocks();
    blogsRepository.findBySlug.mockResolvedValue(undefined);
    blogsRepository.create.mockImplementation((data: Record<string, unknown>) =>
      Promise.resolve({
        ...data,
        id: 'blog-1',
        thumbnailMediaId: (data.thumbnailMediaId as string | null) ?? null,
        thumbnailUrl: (data.thumbnailUrl as string | null) ?? null,
        likeCount: 0,
        isActive: true,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    );
    usersService.require.mockResolvedValue({ id: userId });
    usersService.resolve.mockResolvedValue({ id: userId });
    redis.delByPattern.mockResolvedValue(undefined);

    service = new BlogsService(
      blogsRepository as unknown as BlogsRepository,
      usersService as unknown as UsersService,
      redis as unknown as RedisService,
      mediaService as unknown as MediaService,
    );
  });

  it('creates a blog without client user_id or status and defaults to DRAFT', async () => {
    await service.create(identity, {
      title: 'Hello',
      slug: 'hello',
      content: 'word '.repeat(250),
    });

    expect(blogsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        status: 'DRAFT',
        title: 'Hello',
        slug: 'hello',
      }),
    );
  });

  it('rejects my-blogs listing when user_id does not match the mapped user', async () => {
    await expect(
      service.listMine(identity, { userId: 'someone-else' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.listMine(identity, {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
