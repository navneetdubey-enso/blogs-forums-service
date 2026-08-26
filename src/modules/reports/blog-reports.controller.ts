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

@ApiTags('Blog Reports')
@ApiSecurity('service-auth')
@ApiUnauthorizedResponse({ description: 'Invalid or missing service token' })
@Controller('api/v1/blogs/:id')
@UseGuards(ServiceAuthGuard)
export class BlogReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('report')
  @HttpCode(HttpStatus.CREATED)
  @ApiUserIdentityHeaders()
  @ApiOperation({ summary: 'Report a blog' })
  @ApiBadRequestResponse({ description: 'Invalid report reason or payload' })
  @ApiNotFoundResponse({ description: 'Blog not found' })
  @ApiConflictResponse({ description: 'Blog already reported by this user' })
  async reportBlog(
    @Param('id', ParseUUIDPipe) blogId: string,
    @Body() dto: CreateReportDto,
    @UserIdentity() identity: AppUserIdentity,
  ) {
    return apiSuccess(
      201,
      'Blog reported successfully',
      await this.reportsService.reportBlog(blogId, dto, identity),
    );
  }

  @Post('comments/:commentId/report')
  @HttpCode(HttpStatus.CREATED)
  @ApiUserIdentityHeaders()
  @ApiOperation({ summary: 'Report a blog comment' })
  @ApiBadRequestResponse({
    description:
      'Invalid report reason or payload, or comment does not belong to this blog',
  })
  @ApiNotFoundResponse({ description: 'Blog or comment not found' })
  @ApiConflictResponse({
    description: 'Comment already reported by this user',
  })
  async reportBlogComment(
    @Param('id', ParseUUIDPipe) blogId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() dto: CreateReportDto,
    @UserIdentity() identity: AppUserIdentity,
  ) {
    return apiSuccess(
      201,
      'Comment reported successfully',
      await this.reportsService.reportBlogComment(
        blogId,
        commentId,
        dto,
        identity,
      ),
    );
  }
}
