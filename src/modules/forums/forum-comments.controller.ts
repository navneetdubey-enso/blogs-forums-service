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
import { UpdateForumCommentDto } from './dto/update-forum-comment.dto';
import { ForumsService } from './forums.service';

@ApiTags('Forum Comments')
@ApiSecurity('service-auth')
@ApiUnauthorizedResponse({ description: 'Invalid or missing service token' })
@Controller('api/v1/forum-comments')
@UseGuards(ServiceAuthGuard)
export class ForumCommentsController {
  constructor(private readonly forumsService: ForumsService) {}

  @Patch(':id')
  @ApiUserIdentityHeaders()
  @ApiOperation({ summary: 'Update a forum comment (author only)' })
  @ApiNotFoundResponse({ description: 'Comment not found' })
  @ApiForbiddenResponse({ description: 'Not the comment author' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateForumCommentDto,
    @UserIdentity() identity: AppUserIdentity,
  ) {
    return apiSuccess(
      200,
      'Comment updated successfully',
      await this.forumsService.updateComment(id, dto, identity),
    );
  }

  @Delete(':id')
  @ApiUserIdentityHeaders()
  @ApiOperation({
    summary:
      'Soft delete a forum comment and nested replies (comment author or topic owner)',
  })
  @ApiNotFoundResponse({ description: 'Comment not found' })
  @ApiForbiddenResponse({
    description: 'Not the comment author or topic owner',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @UserIdentity() identity: AppUserIdentity,
  ) {
    return apiSuccess(
      200,
      'Comment deleted successfully',
      await this.forumsService.deleteComment(id, identity),
    );
  }
}
