import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ServiceAuthGuard } from '../../common/guards/service-auth.guard';

@ApiTags('Health')
@ApiSecurity('service-auth')
@Controller('health')
@UseGuards(ServiceAuthGuard)
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check' })
  health() {
    return {
      statusCode: 200,
      success: true,
      message: 'Content Service is healthy',
      data: {
        status: 'ok',
      },
    };
  }
}
