import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { UpdatePostDto } from './dto/update-post.dto';
import { ForumsService } from './forums.service';

@ApiTags('Forum Posts')
@ApiSecurity('service-auth')
@ApiUnauthorizedResponse({ description: 'Invalid or missing service token' })
@Controller('api/v1/posts')
@UseGuards(ServiceAuthGuard)
export class ForumPostsController {
  constructor(private readonly forumsService: ForumsService) {}

  @Patch(':id')
  @ApiUserIdentityHeaders()
  @ApiOperation({ summary: 'Update a post (author only)' })
  @ApiNotFoundResponse({ description: 'Post not found' })
  @ApiForbiddenResponse({ description: 'Not the post author' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePostDto,
    @UserIdentity() identity: AppUserIdentity,
  ) {
    return apiSuccess(
      200,
      'Post updated successfully',
      await this.forumsService.updatePost(id, dto, identity),
    );
  }

  @Delete(':id')
  @ApiUserIdentityHeaders()
  @ApiOperation({
    summary:
      'Soft delete a post and nested replies (post author or topic owner)',
  })
  @ApiNotFoundResponse({ description: 'Post not found' })
  @ApiForbiddenResponse({
    description: 'Not the post author or topic owner',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @UserIdentity() identity: AppUserIdentity,
  ) {
    return apiSuccess(
      200,
      'Post deleted successfully',
      await this.forumsService.deletePost(id, identity),
    );
  }
}
