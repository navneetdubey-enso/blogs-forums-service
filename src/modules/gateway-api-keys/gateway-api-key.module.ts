import { Global, Module } from '@nestjs/common';
import { ServiceAuthGuard } from '../../common/guards/service-auth.guard';
import { GatewayApiKeyRepository } from './gateway-api-key.repository';
import { GatewayApiKeyService } from './gateway-api-key.service';

@Global()
@Module({
  providers: [GatewayApiKeyRepository, GatewayApiKeyService, ServiceAuthGuard],
  exports: [GatewayApiKeyService, ServiceAuthGuard],
})
export class GatewayApiKeyModule {}
