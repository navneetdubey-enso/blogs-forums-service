import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueViolation } from '../../common/helpers/postgres.helper';
import { BlogsRepository } from '../blogs/blogs.repository';
import { BlogsService } from '../blogs/blogs.service';
import type { AppUserIdentity } from '../users/users.service';
import { UsersService } from '../users/users.service';
import { LikesRepository } from './likes.repository';

@Injectable()
export class LikesService {
  constructor(
    @Inject(LikesRepository)
    private readonly likesRepository: LikesRepository,
    @Inject(BlogsRepository)
    private readonly blogsRepository: BlogsRepository,
    @Inject(BlogsService)
    private readonly blogsService: BlogsService,
    @Inject(UsersService)
    private readonly usersService: UsersService,
  ) {}

  async likeBlog(blogId: string, identity: AppUserIdentity) {
    await this.requireActiveBlog(blogId);
    const user = await this.usersService.require(identity, true);

    try {
      await this.likesRepository.createLike(blogId, user.id);
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        throw new BadRequestException('Blog already liked by user');
      }
      throw error;
    }

    await this.blogsService.clearBlogCache(blogId);
    return { blogId, liked: true };
  }

  async unlikeBlog(blogId: string, identity: AppUserIdentity) {
    await this.requireActiveBlog(blogId);
    const user = await this.usersService.require(identity);

    const deletedLike = await this.likesRepository.deleteLike(blogId, user.id);
    if (!deletedLike) {
      throw new BadRequestException('Blog is not liked by user');
    }

    await this.blogsService.clearBlogCache(blogId);
    return { blogId, liked: false };
  }

  private async requireActiveBlog(blogId: string) {
    const blog = await this.blogsRepository.findActiveById(blogId);
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }
  }
}
