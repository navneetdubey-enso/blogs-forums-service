import { Module } from '@nestjs/common';
import { GatewayApiKeyModule } from '../gateway-api-keys/gateway-api-key.module';
import { HealthController } from './health.controller';

@Module({
  imports: [GatewayApiKeyModule],
  controllers: [HealthController],
})
export class HealthModule {}
