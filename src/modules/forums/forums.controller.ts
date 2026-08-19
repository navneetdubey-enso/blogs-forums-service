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
  ApiConflictResponse,
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
import { CreateForumDto } from './dto/create-forum.dto';
import { CreateTopicDto } from './dto/create-topic.dto';
import { ListForumsQueryDto } from './dto/list-forums.query.dto';
import { ListTopicsQueryDto } from './dto/list-topics.query.dto';
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
  @ApiOperation({ summary: 'Create a forum' })
  @ApiConflictResponse({ description: 'Duplicate slug' })
  async create(@Body() dto: CreateForumDto) {
    return apiSuccess(
      201,
      'Forum created successfully',
      await this.forumsService.createForum(dto),
    );
  }

  @Get()
  @ApiOperation({ summary: 'List active forums' })
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
  @ApiOperation({ summary: 'Update a forum' })
  @ApiNotFoundResponse({ description: 'Forum not found' })
  @ApiConflictResponse({ description: 'Duplicate slug' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateForumDto,
  ) {
    return apiSuccess(
      200,
      'Forum updated successfully',
      await this.forumsService.updateForum(id, dto),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a forum' })
  @ApiNotFoundResponse({ description: 'Forum not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return apiSuccess(
      200,
      'Forum deleted successfully',
      await this.forumsService.deleteForum(id),
    );
  }

  @Post(':id/topics')
  @HttpCode(HttpStatus.CREATED)
  @ApiUserIdentityHeaders()
  @ApiOperation({ summary: 'Create a topic in a forum' })
  @ApiNotFoundResponse({ description: 'Forum not found' })
  @ApiConflictResponse({ description: 'Duplicate slug' })
  async createTopic(
    @Param('id', ParseUUIDPipe) forumId: string,
    @Body() dto: CreateTopicDto,
    @UserIdentity() identity: AppUserIdentity,
  ) {
    return apiSuccess(
      201,
      'Topic created successfully',
      await this.forumsService.createTopic(forumId, dto, identity),
    );
  }

  @Get(':id/topics')
  @ApiOperation({ summary: 'List topics in a forum' })
  @ApiNotFoundResponse({ description: 'Forum not found' })
  async listTopics(
    @Param('id', ParseUUIDPipe) forumId: string,
    @Query() query: ListTopicsQueryDto,
  ) {
    return apiSuccess(
      200,
      'Topics retrieved successfully',
      await this.forumsService.listTopics(forumId, query),
    );
  }
}
