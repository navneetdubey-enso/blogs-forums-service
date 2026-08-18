import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  ApiUserIdentityHeaders,
  UserIdentity,
} from '../../common/decorators/user-identity.decorator';
import { ServiceAuthGuard } from '../../common/guards/service-auth.guard';
import { apiSuccess } from '../../common/helpers/api-response.helper';
import type { AppUserIdentity } from '../users/users.service';
import { CommentsService } from './comments.service';
import { CommentFilterDto } from './dto/comment-filter.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@ApiTags('Comments')
@ApiSecurity('service-auth')
@ApiUnauthorizedResponse({ description: 'Invalid or missing service token' })
@Controller('api/v1')
@UseGuards(ServiceAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('blogs/:id/comments')
  @HttpCode(HttpStatus.CREATED)
  @ApiUserIdentityHeaders()
  @ApiOperation({ summary: 'Add a comment to a blog' })
  @ApiNotFoundResponse({ description: 'Blog or parent comment not found' })
  async create(
    @Param('id', ParseUUIDPipe) blogId: string,
    @Body() dto: CreateCommentDto,
    @UserIdentity() identity: AppUserIdentity,
  ) {
    return apiSuccess(
      201,
      'Comment created successfully',
      await this.commentsService.create(blogId, dto, identity),
    );
  }

  @Get('blogs/:id/comments')
  @ApiOperation({ summary: 'List blog comments with cursor pagination' })
  @ApiNotFoundResponse({ description: 'Blog not found' })
  async findAll(
    @Param('id', ParseUUIDPipe) blogId: string,
    @Query() filters: CommentFilterDto,
  ) {
    const result = await this.commentsService.findByBlogId(blogId, filters);
    return apiSuccess(200, 'Comments fetched successfully', result.items, {
      pagination: result.pagination,
    });
  }

  @Patch('comments/:commentId')
  @ApiUserIdentityHeaders()
  @ApiOperation({ summary: 'Update a comment (author only)' })
  @ApiNotFoundResponse({ description: 'Comment not found' })
  @ApiForbiddenResponse({ description: 'Not the comment author' })
  async update(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() dto: UpdateCommentDto,
    @UserIdentity() identity: AppUserIdentity,
  ) {
    return apiSuccess(
      200,
      'Comment updated successfully',
      await this.commentsService.update(commentId, dto, identity),
    );
  }

  @Delete('comments/:commentId')
  @ApiUserIdentityHeaders()
  @ApiOperation({
    summary: 'Soft delete a comment (comment author or blog owner)',
  })
  @ApiNotFoundResponse({ description: 'Comment not found' })
  @ApiForbiddenResponse({
    description: 'Not the comment author or blog owner',
  })
  async remove(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @UserIdentity() identity: AppUserIdentity,
  ) {
    return apiSuccess(
      200,
      'Comment deleted successfully',
      await this.commentsService.remove(commentId, identity),
    );
  }
}
