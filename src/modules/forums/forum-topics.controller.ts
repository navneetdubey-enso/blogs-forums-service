import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiConflictResponse,
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
import { CreatePostDto } from './dto/create-post.dto';
import { ListPostsQueryDto } from './dto/list-posts.query.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { ForumsService } from './forums.service';

@ApiTags('Forum Topics')
@ApiSecurity('service-auth')
@ApiUnauthorizedResponse({ description: 'Invalid or missing service token' })
@Controller('api/v1/topics')
@UseGuards(ServiceAuthGuard)
export class ForumTopicsController {
  constructor(private readonly forumsService: ForumsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get an active topic by id' })
  @ApiNotFoundResponse({ description: 'Topic not found' })
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    return apiSuccess(
      200,
      'Topic retrieved successfully',
      await this.forumsService.getTopic(id),
    );
  }

  @Patch(':id')
  @ApiUserIdentityHeaders()
  @ApiOperation({ summary: 'Update an owned topic' })
  @ApiNotFoundResponse({ description: 'Topic not found' })
  @ApiForbiddenResponse({ description: 'Not the topic owner' })
  @ApiConflictResponse({ description: 'Duplicate slug' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTopicDto,
    @UserIdentity() identity: AppUserIdentity,
  ) {
    return apiSuccess(
      200,
      'Topic updated successfully',
      await this.forumsService.updateTopic(id, dto, identity),
    );
  }

  @Delete(':id')
  @ApiUserIdentityHeaders()
  @ApiOperation({ summary: 'Soft delete an owned topic and its posts' })
  @ApiNotFoundResponse({ description: 'Topic not found' })
  @ApiForbiddenResponse({ description: 'Not the topic owner' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @UserIdentity() identity: AppUserIdentity,
  ) {
    return apiSuccess(
      200,
      'Topic deleted successfully',
      await this.forumsService.deleteTopic(id, identity),
    );
  }

  @Post(':id/posts')
  @ApiUserIdentityHeaders()
  @ApiOperation({ summary: 'Add a post or reply to a topic' })
  @ApiNotFoundResponse({ description: 'Topic or parent post not found' })
  async createPost(
    @Param('id', ParseUUIDPipe) topicId: string,
    @Body() dto: CreatePostDto,
    @UserIdentity() identity: AppUserIdentity,
  ) {
    return apiSuccess(
      201,
      'Post created successfully',
      await this.forumsService.createPost(topicId, dto, identity),
    );
  }

  @Get(':id/posts')
  @ApiOperation({ summary: 'List topic posts with cursor pagination' })
  @ApiNotFoundResponse({ description: 'Topic not found' })
  async listPosts(
    @Param('id', ParseUUIDPipe) topicId: string,
    @Query() query: ListPostsQueryDto,
  ) {
    const result = await this.forumsService.listPosts(topicId, query);
    return apiSuccess(200, 'Posts fetched successfully', result.items, {
      pagination: result.pagination,
    });
  }
}
