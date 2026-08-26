import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BlogsRepository } from '../blogs/blogs.repository';
import { BlogsService } from '../blogs/blogs.service';
import { ForumsRepository } from '../forums/forums.repository';
import type { AppUserIdentity } from '../users/users.service';
import { UsersService } from '../users/users.service';
import { LikesRepository } from './likes.repository';
import { LikesService } from './likes.service';

const identity: AppUserIdentity = {
  appType: 'INFOCALLING',
  appUserId: 'app-user-1',
  universeUserId: 1001,
  appUserRole: 'author',
};

describe('LikesService forum likes', () => {
  const categoryId = 'category-1';
  const userId = 'user-1';

  const likesRepository = {
    createLike: jest.fn(),
    deleteLike: jest.fn(),
    createForumLike: jest.fn(),
    deleteForumLike: jest.fn(),
  };
  const blogsRepository = {
    findActiveById: jest.fn(),
  };
  const blogsService = {
    clearBlogCache: jest.fn(),
  };
  const forumsRepository = {
    findActiveById: jest.fn(),
  };
  const usersService = {
    require: jest.fn(),
  };

  let service: LikesService;

  beforeEach(() => {
    jest.clearAllMocks();
    forumsRepository.findActiveById.mockResolvedValue({
      id: categoryId,
      likeCount: 1,
      isActive: true,
    });
    usersService.require.mockResolvedValue({ id: userId });
    service = new LikesService(
      likesRepository as unknown as LikesRepository,
      blogsRepository as unknown as BlogsRepository,
      blogsService as unknown as BlogsService,
      forumsRepository as unknown as ForumsRepository,
      usersService as unknown as UsersService,
    );
  });

  it('likes a forum and returns likeCount', async () => {
    likesRepository.createForumLike.mockResolvedValue(undefined);
    const result = await service.likeForum(categoryId, identity);
    expect(likesRepository.createForumLike).toHaveBeenCalledWith(
      categoryId,
      userId,
    );
    expect(result).toEqual({ categoryId, liked: true, likeCount: 1 });
  });

  it('prevents duplicate forum likes', async () => {
    likesRepository.createForumLike.mockRejectedValue(
      Object.assign(new Error('duplicate'), { code: '23505' }),
    );
    await expect(service.likeForum(categoryId, identity)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('unlikes a forum and returns likeCount', async () => {
    likesRepository.deleteForumLike.mockResolvedValue({ id: 'like-1' });
    forumsRepository.findActiveById.mockResolvedValue({
      id: categoryId,
      likeCount: 0,
      isActive: true,
    });
    const result = await service.unlikeForum(categoryId, identity);
    expect(result).toEqual({ categoryId, liked: false, likeCount: 0 });
  });

  it('rejects unlike when the forum was not liked', async () => {
    likesRepository.deleteForumLike.mockResolvedValue(null);
    await expect(service.unlikeForum(categoryId, identity)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('does not expose comment likes', () => {
    expect(service).not.toHaveProperty('likeComment');
    expect(service).not.toHaveProperty('unlikeComment');
    expect(service).not.toHaveProperty('likeForumComment');
  });
});
