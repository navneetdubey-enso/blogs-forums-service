import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ServiceAuthGuard } from '../../common/guards/service-auth.guard';
import { apiSuccess } from '../../common/helpers/api-response.helper';

@ApiTags('Health')
@ApiSecurity('service-auth')
@Controller('health')
@UseGuards(ServiceAuthGuard)
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check' })
  health() {
    return apiSuccess(200, 'Content Service is healthy', {
      status: 'ok',
    });
  }
}
