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

@ApiTags('Blog Likes')
@ApiSecurity('service-auth')
@ApiUnauthorizedResponse({ description: 'Invalid or missing service token' })
@Controller('api/v1/blogs/:id/likes')
@UseGuards(ServiceAuthGuard)
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiUserIdentityHeaders()
  @ApiOperation({ summary: 'Like a blog' })
  @ApiNotFoundResponse({ description: 'Blog not found' })
  async like(
    @Param('id', ParseUUIDPipe) blogId: string,
    @UserIdentity() identity: AppUserIdentity,
  ) {
    return apiSuccess(
      200,
      'Blog liked successfully',
      await this.likesService.likeBlog(blogId, identity),
    );
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiUserIdentityHeaders()
  @ApiOperation({ summary: 'Unlike a blog' })
  @ApiNotFoundResponse({ description: 'Blog not found' })
  async unlike(
    @Param('id', ParseUUIDPipe) blogId: string,
    @UserIdentity() identity: AppUserIdentity,
  ) {
    return apiSuccess(
      200,
      'Blog unliked successfully',
      await this.likesService.unlikeBlog(blogId, identity),
    );
  }
}
