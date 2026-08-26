import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
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
import { LikesService } from './likes.service';

@ApiTags('Forum Likes')
@ApiSecurity('service-auth')
@ApiUnauthorizedResponse({ description: 'Invalid or missing service token' })
@Controller('api/v1/forums/:id/likes')
@UseGuards(ServiceAuthGuard)
export class ForumLikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiUserIdentityHeaders()
  @ApiOperation({ summary: 'Like a forum' })
  @ApiNotFoundResponse({ description: 'Forum not found' })
  async like(
    @Param('id', ParseUUIDPipe) forumId: string,
    @UserIdentity() identity: AppUserIdentity,
  ) {
    return apiSuccess(
      200,
      'Forum liked successfully',
      await this.likesService.likeForum(forumId, identity),
    );
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiUserIdentityHeaders()
  @ApiOperation({ summary: 'Unlike a forum' })
  @ApiNotFoundResponse({ description: 'Forum not found' })
  async unlike(
    @Param('id', ParseUUIDPipe) forumId: string,
    @UserIdentity() identity: AppUserIdentity,
  ) {
    return apiSuccess(
      200,
      'Forum unliked successfully',
      await this.likesService.unlikeForum(forumId, identity),
    );
  }
}
