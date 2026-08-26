import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueViolation } from '../../common/helpers/postgres.helper';
import { BlogsRepository } from '../blogs/blogs.repository';
import { CommentsRepository } from '../comments/comments.repository';
import { ForumCommentsRepository } from '../forums/forum-comments.repository';
import { ForumTopicsRepository } from '../forums/forum-topics.repository';
import { ForumsRepository } from '../forums/forums.repository';
import type { AppUserIdentity } from '../users/users.service';
import { UsersService } from '../users/users.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportTargetType } from './enums/report.enum';
import { ReportsRepository } from './reports.repository';

@Injectable()
export class ReportsService {
  constructor(
    @Inject(ReportsRepository)
    private readonly reportsRepository: ReportsRepository,
    @Inject(BlogsRepository)
    private readonly blogsRepository: BlogsRepository,
    @Inject(CommentsRepository)
    private readonly commentsRepository: CommentsRepository,
    @Inject(ForumsRepository)
    private readonly forumsRepository: ForumsRepository,
    @Inject(ForumTopicsRepository)
    private readonly forumTopicsRepository: ForumTopicsRepository,
    @Inject(ForumCommentsRepository)
    private readonly forumCommentsRepository: ForumCommentsRepository,
    @Inject(UsersService)
    private readonly usersService: UsersService,
  ) {}

  async reportBlog(
    blogId: string,
    dto: CreateReportDto,
    identity: AppUserIdentity,
  ) {
    await this.requireActiveBlog(blogId);
    return this.createReport(ReportTargetType.BLOG, blogId, dto, identity);
  }

  async reportBlogComment(
    blogId: string,
    commentId: string,
    dto: CreateReportDto,
    identity: AppUserIdentity,
  ) {
    await this.requireActiveBlog(blogId);
    const comment = await this.commentsRepository.findActiveById(commentId);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.blogId !== blogId) {
      throw new BadRequestException('Comment does not belong to this blog');
    }
    return this.createReport(
      ReportTargetType.BLOG_COMMENT,
      commentId,
      dto,
      identity,
    );
  }

  async reportForum(
    forumId: string,
    dto: CreateReportDto,
    identity: AppUserIdentity,
  ) {
    await this.requireActiveForum(forumId);
    return this.createReport(ReportTargetType.FORUM, forumId, dto, identity);
  }

  async reportForumComment(
    forumId: string,
    commentId: string,
    dto: CreateReportDto,
    identity: AppUserIdentity,
  ) {
    await this.requireActiveForum(forumId);
    const comment =
      await this.forumCommentsRepository.findActiveById(commentId);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    const topic = await this.forumTopicsRepository.findActiveById(
      comment.topicId,
    );
    if (!topic) {
      throw new NotFoundException('Comment not found');
    }
    if (topic.forumId !== forumId) {
      throw new BadRequestException('Comment does not belong to this forum');
    }
    return this.createReport(
      ReportTargetType.FORUM_COMMENT,
      commentId,
      dto,
      identity,
    );
  }

  private async createReport(
    targetType: ReportTargetType,
    targetId: string,
    dto: CreateReportDto,
    identity: AppUserIdentity,
  ) {
    const user = await this.usersService.require(identity, true);

    try {
      return await this.reportsRepository.create({
        reporterUserId: user.id,
        targetType,
        targetId,
        reason: dto.reason,
        description: dto.description,
      });
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Content already reported by user');
      }
      throw error;
    }
  }

  private async requireActiveBlog(blogId: string) {
    const blog = await this.blogsRepository.findActiveById(blogId);
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }
  }

  private async requireActiveForum(forumId: string) {
    const forum = await this.forumsRepository.findActiveById(forumId);
    if (!forum) {
      throw new NotFoundException('Forum not found');
    }
  }
}
