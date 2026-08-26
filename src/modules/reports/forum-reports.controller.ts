import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
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
import { CreateReportDto } from './dto/create-report.dto';
import { ReportsService } from './reports.service';

@ApiTags('Forum Reports')
@ApiSecurity('service-auth')
@ApiUnauthorizedResponse({ description: 'Invalid or missing service token' })
@Controller('api/v1/forums/:id')
@UseGuards(ServiceAuthGuard)
export class ForumReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('report')
  @HttpCode(HttpStatus.CREATED)
  @ApiUserIdentityHeaders()
  @ApiOperation({ summary: 'Report a forum' })
  @ApiBadRequestResponse({ description: 'Invalid report reason or payload' })
  @ApiNotFoundResponse({ description: 'Forum not found' })
  @ApiConflictResponse({ description: 'Forum already reported by this user' })
  async reportForum(
    @Param('id', ParseUUIDPipe) forumId: string,
    @Body() dto: CreateReportDto,
    @UserIdentity() identity: AppUserIdentity,
  ) {
    return apiSuccess(
      201,
      'Forum reported successfully',
      await this.reportsService.reportForum(forumId, dto, identity),
    );
  }

  @Post('comments/:commentId/report')
  @HttpCode(HttpStatus.CREATED)
  @ApiUserIdentityHeaders()
  @ApiOperation({
    summary: 'Report a forum comment',
    description:
      'The comment must belong to a topic in the specified forum. Forum comments are created under topics; this route groups reporting under the parent forum.',
  })
  @ApiBadRequestResponse({
    description:
      'Invalid report reason or payload, or comment does not belong to this forum',
  })
  @ApiNotFoundResponse({ description: 'Forum or comment not found' })
  @ApiConflictResponse({
    description: 'Comment already reported by this user',
  })
  async reportForumComment(
    @Param('id', ParseUUIDPipe) forumId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() dto: CreateReportDto,
    @UserIdentity() identity: AppUserIdentity,
  ) {
    return apiSuccess(
      201,
      'Comment reported successfully',
      await this.reportsService.reportForumComment(
        forumId,
        commentId,
        dto,
        identity,
      ),
    );
  }
}
