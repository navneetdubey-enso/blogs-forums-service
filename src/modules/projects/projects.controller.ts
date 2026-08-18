import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ServiceAuthGuard } from '../../common/guards/service-auth.guard';
import { apiSuccess } from '../../common/helpers/api-response.helper';
import { RegisterProjectDto } from './dto/register-project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('Projects')
@ApiSecurity('service-auth')
@ApiUnauthorizedResponse({ description: 'Invalid or missing service token' })
@Controller('api/v1/projects')
@UseGuards(ServiceAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a consuming project and issue a service token',
  })
  @ApiConflictResponse({
    description: 'The project already has an active service token',
  })
  async register(@Body() dto: RegisterProjectDto) {
    const { projectCode, token } = await this.projectsService.register(
      dto.projectCode,
    );

    return apiSuccess(201, 'Project registered successfully', {
      projectCode,
      token,
    });
  }
}
