import { Inject, Injectable } from '@nestjs/common';
import { GatewayApiKeyService } from '../gateway-api-keys/gateway-api-key.service';

@Injectable()
export class ProjectsService {
  constructor(
    @Inject(GatewayApiKeyService)
    private readonly gatewayApiKeyService: GatewayApiKeyService,
  ) {}

  register(projectCode: string) {
    return this.gatewayApiKeyService.generateProjectToken(projectCode);
  }
}
