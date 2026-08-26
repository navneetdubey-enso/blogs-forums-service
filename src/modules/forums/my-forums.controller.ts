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
import { ListMyForumsQueryDto } from './dto/list-my-forums.query.dto';
import { ForumsService } from './forums.service';

@ApiTags('Forums')
@ApiSecurity('service-auth')
@ApiUnauthorizedResponse({ description: 'Invalid or missing service token' })
@Controller('api/v1/my/forums')
@UseGuards(ServiceAuthGuard)
export class MyForumsController {
  constructor(private readonly forumsService: ForumsService) {}

  @Get()
  @ApiUserIdentityHeaders()
  @ApiOperation({
    summary: "List the authenticated user's forums",
    description:
      'Requires user_id. Returns only forums owned by that user after identity validation.',
  })
  @ApiForbiddenResponse({
    description: 'user_id does not match the authenticated user',
  })
  async listMine(
    @UserIdentity() identity: AppUserIdentity,
    @Query() query: ListMyForumsQueryDto,
  ) {
    return apiSuccess(
      200,
      'Forums retrieved successfully',
      await this.forumsService.listMyForums(identity, query),
    );
  }
}
