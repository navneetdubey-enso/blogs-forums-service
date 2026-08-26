import { ForbiddenException } from '@nestjs/common';
import type { AppUserIdentity } from '../users/users.service';
import { UsersService } from '../users/users.service';
import { ForumCommentsRepository } from './forum-comments.repository';
import { ForumTopicsRepository } from './forum-topics.repository';
import { ForumsRepository } from './forums.repository';
import { ForumsService } from './forums.service';

const identity: AppUserIdentity = {
  appType: 'INFOCALLING',
  appUserId: 'app-user-1',
  universeUserId: 1001,
  appUserRole: 'author',
};

describe('ForumsService', () => {
  const userId = 'user-1';
  const categoryId = 'category-1';
  const topicId = 'topic-1';
  const commentId = 'comment-1';

  const forumsRepository = {
    findActiveById: jest.fn(),
    findBySlug: jest.fn(),
    create: jest.fn(),
    listActive: jest.fn(),
    findBySlugExcludingId: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    findLikeByCategoryAndUser: jest.fn(),
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

  const commentsRepository = {
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
      id: categoryId,
      isActive: true,
      likeCount: 0,
    });
    forumsRepository.findBySlug.mockResolvedValue(undefined);
    forumsRepository.create.mockImplementation((data: unknown) =>
      Promise.resolve({ id: categoryId, ...(data as object), likeCount: 0 }),
    );
    topicsRepository.findBySlug.mockResolvedValue(undefined);
    topicsRepository.create.mockImplementation((data: unknown) =>
      Promise.resolve({ id: topicId, ...(data as object) }),
    );
    topicsRepository.findActiveById.mockResolvedValue({
      id: topicId,
      forumId: categoryId,
      userId,
      isActive: true,
    });
    commentsRepository.create.mockImplementation((data: unknown) =>
      Promise.resolve({ id: commentId, ...(data as object) }),
    );
    commentsRepository.listActiveByTopicId.mockResolvedValue([]);
    usersService.require.mockResolvedValue({ id: userId });
    usersService.resolve.mockResolvedValue({ id: userId });

    service = new ForumsService(
      forumsRepository as unknown as ForumsRepository,
      topicsRepository as unknown as ForumTopicsRepository,
      commentsRepository as unknown as ForumCommentsRepository,
      usersService as unknown as UsersService,
    );
  });

  it('creates a forum', async () => {
    const forum = await service.createForum({
      name: 'General',
      slug: 'general',
    });
    expect(forumsRepository.create).toHaveBeenCalledWith({
      name: 'General',
      slug: 'general',
      description: undefined,
    });
    expect(forum.id).toBe(categoryId);
  });

  it('creates a topic without client user_id and defaults status to DRAFT', async () => {
    await service.createTopic(
      categoryId,
      {
        title: 'Hello',
        slug: 'hello',
        content: 'body',
      },
      identity,
    );

    expect(topicsRepository.create).toHaveBeenCalledWith({
      categoryId,
      userId,
      title: 'Hello',
      slug: 'hello',
      content: 'body',
      status: 'DRAFT',
    });
  });

  it('creates a comment in a topic', async () => {
    const comment = await service.createComment(
      topicId,
      { content: 'First comment' },
      identity,
    );
    expect(commentsRepository.create).toHaveBeenCalledWith({
      topicId,
      userId,
      content: 'First comment',
      parentCommentId: null,
      isReply: false,
    });
    expect(comment.id).toBe(commentId);
  });

  it('creates a reply using parentCommentId', async () => {
    commentsRepository.findActiveById.mockResolvedValue({
      id: 'parent-1',
      topicId,
      isActive: true,
    });

    await service.createComment(
      topicId,
      { content: 'Reply', parentCommentId: 'parent-1' },
      identity,
    );

    expect(commentsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        parentCommentId: 'parent-1',
        isReply: true,
      }),
    );
  });

  it('lists comments in a topic', async () => {
    commentsRepository.listActiveByTopicId.mockResolvedValue([
      { id: commentId, content: 'First comment' },
    ]);
    const result = await service.listComments(topicId, {});
    expect(result.items).toHaveLength(1);
    expect(commentsRepository.listActiveByTopicId).toHaveBeenCalled();
  });

  it('updates a comment', async () => {
    commentsRepository.findActiveById.mockResolvedValue({
      id: commentId,
      userId,
      topicId,
    });
    commentsRepository.updateContent.mockResolvedValue({
      id: commentId,
      content: 'Edited',
    });

    await service.updateComment(commentId, { content: 'Edited' }, identity);
    expect(commentsRepository.updateContent).toHaveBeenCalledWith(
      commentId,
      'Edited',
    );
  });

  it('soft-deletes a comment', async () => {
    commentsRepository.findActiveById.mockResolvedValue({
      id: commentId,
      userId,
      topicId,
    });
    commentsRepository.softDelete.mockResolvedValue([{ id: commentId }]);

    const result = await service.deleteComment(commentId, identity);
    expect(commentsRepository.softDelete).toHaveBeenCalledWith(commentId);
    expect(result).toEqual({ id: commentId, isActive: false });
  });

  it('rejects my-topics listing when user_id does not match the mapped user', async () => {
    await expect(
      service.listMyTopics(identity, { userId: 'someone-else' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
