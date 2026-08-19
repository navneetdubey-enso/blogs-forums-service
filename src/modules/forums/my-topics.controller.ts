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
import { ListMyTopicsQueryDto } from './dto/list-my-topics.query.dto';
import { ForumsService } from './forums.service';

@ApiTags('Forum Topics')
@ApiSecurity('service-auth')
@ApiUnauthorizedResponse({ description: 'Invalid or missing service token' })
@Controller('api/v1/my/topics')
@UseGuards(ServiceAuthGuard)
export class MyTopicsController {
  constructor(private readonly forumsService: ForumsService) {}

  @Get()
  @ApiUserIdentityHeaders()
  @ApiOperation({
    summary: "List the authenticated user's forum topics",
    description:
      'Requires user_id. Returns only topics owned by that user after identity validation.',
  })
  @ApiForbiddenResponse({
    description: 'user_id does not match the authenticated user',
  })
  async listMine(
    @UserIdentity() identity: AppUserIdentity,
    @Query() query: ListMyTopicsQueryDto,
  ) {
    return apiSuccess(
      200,
      'Topics retrieved successfully',
      await this.forumsService.listMyTopics(identity, query),
    );
  }
}
