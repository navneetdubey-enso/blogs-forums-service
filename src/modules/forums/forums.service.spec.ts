import { ForbiddenException } from '@nestjs/common';
import { ForumPostsRepository } from './forum-posts.repository';
import { ForumTopicsRepository } from './forum-topics.repository';
import { ForumsRepository } from './forums.repository';
import { ForumsService } from './forums.service';
import type { AppUserIdentity } from '../users/users.service';
import { UsersService } from '../users/users.service';

const identity: AppUserIdentity = {
  appType: 'INFOCALLING',
  appUserId: 'app-user-1',
  universeUserId: 1001,
  appUserRole: 'author',
};

describe('ForumsService', () => {
  const userId = 'user-1';
  const forumId = 'forum-1';

  const forumsRepository = {
    findActiveById: jest.fn(),
    findBySlug: jest.fn(),
    create: jest.fn(),
    listActive: jest.fn(),
    findBySlugExcludingId: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const topicsRepository = {
    findBySlug: jest.fn(),
    create: jest.fn(),
    listActive: jest.fn(),
    findActiveById: jest.fn(),
    findBySlugExcludingId: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const postsRepository = {
    create: jest.fn(),
    findActiveById: jest.fn(),
    listActiveByTopicId: jest.fn(),
    updateContent: jest.fn(),
    softDelete: jest.fn(),
  };

  const usersService = {
    require: jest.fn(),
    resolve: jest.fn(),
  };

  let service: ForumsService;

  beforeEach(() => {
    jest.clearAllMocks();
    forumsRepository.findActiveById.mockResolvedValue({
      id: forumId,
      isActive: true,
    });
    forumsRepository.findBySlug.mockResolvedValue(undefined);
    topicsRepository.findBySlug.mockResolvedValue(undefined);
    topicsRepository.create.mockImplementation((data: unknown) =>
      Promise.resolve(data),
    );
    usersService.require.mockResolvedValue({ id: userId });
    usersService.resolve.mockResolvedValue({ id: userId });

    service = new ForumsService(
      forumsRepository as unknown as ForumsRepository,
      topicsRepository as unknown as ForumTopicsRepository,
      postsRepository as unknown as ForumPostsRepository,
      usersService as unknown as UsersService,
    );
  });

  it('creates a topic without client user_id and defaults status to DRAFT', async () => {
    await service.createTopic(
      forumId,
      {
        title: 'Hello',
        slug: 'hello',
        content: 'body',
      },
      identity,
    );

    expect(topicsRepository.create).toHaveBeenCalledWith({
      forumId,
      userId,
      title: 'Hello',
      slug: 'hello',
      content: 'body',
      status: 'DRAFT',
    });
  });

  it('rejects my-topics listing when user_id does not match the mapped user', async () => {
    await expect(
      service.listMyTopics(identity, { userId: 'someone-else' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
