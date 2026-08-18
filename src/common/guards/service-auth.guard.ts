import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { GatewayApiKeyService } from '../../modules/gateway-api-keys/gateway-api-key.service';

@Injectable()
export class ServiceAuthGuard implements CanActivate {
  constructor(private readonly gatewayApiKeyService: GatewayApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.header('X-Service-Auth-Token');

    if (!token) {
      throw new UnauthorizedException('Service authentication token required');
    }

    const record = await this.gatewayApiKeyService.authenticateToken(token);
    Object.assign(request, { serviceAuth: record });

    return true;
  }
}
