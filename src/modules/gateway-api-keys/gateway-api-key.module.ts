import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { GatewayApiKeyRepository } from './gateway-api-key.repository';
import { GatewayApiKeyService } from './gateway-api-key.service';

@Module({
  imports: [DatabaseModule],
  providers: [GatewayApiKeyRepository, GatewayApiKeyService],
  exports: [GatewayApiKeyService],
})
export class GatewayApiKeyModule {}
