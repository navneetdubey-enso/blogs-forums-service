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
import { CreateForumCommentDto } from './dto/create-forum-comment.dto';
import { CreateForumDto } from './dto/create-forum.dto';
import { ListForumCommentsQueryDto } from './dto/list-forum-comments.query.dto';
import { ListForumsQueryDto } from './dto/list-forums.query.dto';
import { UpdateForumDto } from './dto/update-forum.dto';
import { ForumsService } from './forums.service';

@ApiTags('Forums')
@ApiSecurity('service-auth')
@ApiUnauthorizedResponse({ description: 'Invalid or missing service token' })
@Controller('api/v1/forums')
@UseGuards(ServiceAuthGuard)
export class ForumsController {
  constructor(private readonly forumsService: ForumsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiUserIdentityHeaders()
  @ApiOperation({ summary: 'Create a forum post' })
  async create(
    @Body() dto: CreateForumDto,
    @UserIdentity() identity: AppUserIdentity,
  ) {
    return apiSuccess(
      201,
      'Forum created successfully',
      await this.forumsService.createForum(dto, identity),
    );
  }

  @Get()
  @ApiOperation({ summary: 'List forums' })
  async list(@Query() query: ListForumsQueryDto) {
    return apiSuccess(
      200,
      'Forums retrieved successfully',
      await this.forumsService.listForums(query),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an active forum by id' })
  @ApiNotFoundResponse({ description: 'Forum not found' })
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    return apiSuccess(
      200,
      'Forum retrieved successfully',
      await this.forumsService.getForum(id),
    );
  }

  @Patch(':id')
  @ApiUserIdentityHeaders()
  @ApiOperation({ summary: 'Update an owned forum' })
  @ApiNotFoundResponse({ description: 'Forum not found' })
  @ApiForbiddenResponse({ description: 'Not the forum owner' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateForumDto,
    @UserIdentity() identity: AppUserIdentity,
  ) {
    return apiSuccess(
      200,
      'Forum updated successfully',
      await this.forumsService.updateForum(id, dto, identity),
    );
  }

  @Delete(':id')
  @ApiUserIdentityHeaders()
  @ApiOperation({ summary: 'Soft delete an owned forum and its comments' })
  @ApiNotFoundResponse({ description: 'Forum not found' })
  @ApiForbiddenResponse({ description: 'Not the forum owner' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @UserIdentity() identity: AppUserIdentity,
  ) {
    return apiSuccess(
      200,
      'Forum deleted successfully',
      await this.forumsService.deleteForum(id, identity),
    );
  }

  @Post(':id/comments')
  @ApiUserIdentityHeaders()
  @ApiOperation({ summary: 'Add a comment or reply to a forum' })
  @ApiNotFoundResponse({ description: 'Forum or parent comment not found' })
  async createComment(
    @Param('id', ParseUUIDPipe) forumId: string,
    @Body() dto: CreateForumCommentDto,
    @UserIdentity() identity: AppUserIdentity,
  ) {
    return apiSuccess(
      201,
      'Comment created successfully',
      await this.forumsService.createComment(forumId, dto, identity),
    );
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'List forum comments with cursor pagination' })
  @ApiNotFoundResponse({ description: 'Forum not found' })
  async listComments(
    @Param('id', ParseUUIDPipe) forumId: string,
    @Query() query: ListForumCommentsQueryDto,
  ) {
    const result = await this.forumsService.listComments(forumId, query);
    return apiSuccess(200, 'Comments fetched successfully', result.items, {
      pagination: result.pagination,
    });
  }
}
