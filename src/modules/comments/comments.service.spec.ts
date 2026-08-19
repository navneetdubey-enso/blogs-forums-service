import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { BlogsRepository } from '../blogs/blogs.repository';
import type { AppUserIdentity } from '../users/users.service';
import { UsersService } from '../users/users.service';
import { CommentsRepository } from './comments.repository';
import { CommentsService } from './comments.service';

const identity: AppUserIdentity = {
  appType: 'INFOCALLING',
  appUserId: 'app-user-1',
  universeUserId: 1001,
  appUserRole: 'author',
};

describe('CommentsService parent/child deletion', () => {
  const blogId = 'blog-1';
  const parentId = 'parent-1';
  const childId = 'child-1';
  const grandchildId = 'grandchild-1';
  const otherChildId = 'child-2';
  const userId = 'user-1';

  let comments: Array<{
    id: string;
    blogId: string;
    userId: string;
    content: string;
    parentCommentId: string | null;
    isActive: boolean;
  }>;
  let service: CommentsService;
  let repository: {
    create: jest.Mock;
    findActiveById: jest.Mock;
    findActiveWithBlogOwner: jest.Mock;
    listActiveByBlogId: jest.Mock;
    updateContent: jest.Mock;
    softDelete: jest.Mock;
  };

  beforeEach(() => {
    comments = [
      {
        id: parentId,
        blogId,
        userId,
        content: 'parent',
        parentCommentId: null,
        isActive: true,
      },
      {
        id: childId,
        blogId,
        userId,
        content: 'child',
        parentCommentId: parentId,
        isActive: true,
      },
      {
        id: grandchildId,
        blogId,
        userId,
        content: 'grandchild',
        parentCommentId: childId,
        isActive: true,
      },
      {
        id: otherChildId,
        blogId,
        userId,
        content: 'other-child',
        parentCommentId: parentId,
        isActive: true,
      },
    ];

    repository = {
      create: jest.fn(),
      findActiveById: jest.fn((id: string) =>
        Promise.resolve(
          comments.find((comment) => comment.id === id && comment.isActive),
        ),
      ),
      findActiveWithBlogOwner: jest.fn((id: string) => {
        const comment = comments.find(
          (item) => item.id === id && item.isActive,
        );
        if (!comment) return Promise.resolve(undefined);
        return Promise.resolve({ comment, blogUserId: 'blog-owner' });
      }),
      listActiveByBlogId: jest.fn(),
      updateContent: jest.fn(),
      softDelete: jest.fn((id: string) => {
        const collect = (rootId: string): string[] => {
          const ids = [rootId];
          for (const comment of comments) {
            if (comment.parentCommentId === rootId) {
              ids.push(...collect(comment.id));
            }
          }
          return ids;
        };

        const ids = collect(id);
        for (const comment of comments) {
          if (ids.includes(comment.id)) {
            comment.isActive = false;
          }
        }
        return Promise.resolve(ids.map((deletedId) => ({ id: deletedId })));
      }),
    };

    const blogsRepository = {
      findActiveById: jest.fn().mockResolvedValue({ id: blogId, userId }),
    };

    const usersService = {
      require: jest.fn().mockResolvedValue({ id: userId }),
      resolve: jest.fn().mockResolvedValue({ id: userId }),
    };

    service = new CommentsService(
      repository as unknown as CommentsRepository,
      blogsRepository as unknown as BlogsRepository,
      usersService as unknown as UsersService,
    );
  });

  it('deletes a parent comment and all nested children', async () => {
    await service.remove(parentId, identity);

    expect(repository.softDelete).toHaveBeenCalledWith(parentId);
    expect(comments.find((comment) => comment.id === parentId)?.isActive).toBe(
      false,
    );
    expect(comments.find((comment) => comment.id === childId)?.isActive).toBe(
      false,
    );
    expect(
      comments.find((comment) => comment.id === grandchildId)?.isActive,
    ).toBe(false);
    expect(
      comments.find((comment) => comment.id === otherChildId)?.isActive,
    ).toBe(false);
  });

  it('deletes a child independently without deleting the parent or siblings', async () => {
    await service.remove(childId, identity);

    expect(repository.softDelete).toHaveBeenCalledWith(childId);
    expect(comments.find((comment) => comment.id === parentId)?.isActive).toBe(
      true,
    );
    expect(comments.find((comment) => comment.id === childId)?.isActive).toBe(
      false,
    );
    expect(
      comments.find((comment) => comment.id === grandchildId)?.isActive,
    ).toBe(false);
    expect(
      comments.find((comment) => comment.id === otherChildId)?.isActive,
    ).toBe(true);
  });

  it('returns 404 when the comment does not exist', async () => {
    await expect(service.remove('missing', identity)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('forbids deletion by a non-author who is not the blog owner', async () => {
    const usersService = {
      require: jest.fn(),
      resolve: jest.fn().mockResolvedValue({ id: 'someone-else' }),
    };
    service = new CommentsService(
      repository as unknown as CommentsRepository,
      {
        findActiveById: jest.fn().mockResolvedValue({ id: blogId }),
      } as unknown as BlogsRepository,
      usersService as unknown as UsersService,
    );

    await expect(service.remove(parentId, identity)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(repository.softDelete).not.toHaveBeenCalled();
  });
});
