import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiForbiddenResponse,
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
import { BlogsService } from './blogs.service';
import { ListMyBlogsQueryDto } from './dto/list-my-blogs.query.dto';

@ApiTags('Blogs')
@ApiSecurity('service-auth')
@ApiUnauthorizedResponse({ description: 'Invalid or missing service token' })
@Controller('api/v1/my/blogs')
@UseGuards(ServiceAuthGuard)
export class MyBlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Get()
  @ApiUserIdentityHeaders()
  @ApiOperation({
    summary: "List the authenticated user's blogs",
    description:
      'Requires user_id. Returns only blogs owned by that user after identity validation.',
  })
  @ApiForbiddenResponse({
    description: 'user_id does not match the authenticated user',
  })
  async listMine(
    @UserIdentity() identity: AppUserIdentity,
    @Query() query: ListMyBlogsQueryDto,
  ) {
    return apiSuccess(
      200,
      'Blogs retrieved successfully',
      await this.blogsService.listMine(identity, query),
    );
  }
}
