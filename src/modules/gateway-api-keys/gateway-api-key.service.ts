import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { GatewayApiKeyRepository } from './gateway-api-key.repository';

@Injectable()
export class GatewayApiKeyService {
  constructor(
    @Inject(GatewayApiKeyRepository)
    private readonly repository: GatewayApiKeyRepository,
  ) {}

  normalizeProjectCode(value: string): string {
    const normalized = value.trim().replace(/[\s-]+/g, '_');

    if (!normalized) {
      throw new Error('Project code cannot be empty');
    }

    return normalized.toUpperCase();
  }

  async generateProjectToken(projectCodeInput: string) {
    const projectCode = this.normalizeProjectCode(projectCodeInput);

    const existing = await this.repository.findActiveByProjectCode(projectCode);

    if (existing) {
      throw new ConflictException(
        `${projectCode} already has an active API key.\nUse the token rotation command if you need to generate a new key.`,
      );
    }

    const keyPrefix = `${projectCode.toLowerCase()}_gateway_`;
    const randomSecret = randomBytes(32).toString('hex');
    const token = `${keyPrefix}${randomSecret}`;

    const keyHash = createHash('sha256').update(token).digest('hex');

    await this.repository.create({
      projectCode,
      keyPrefix,
      keyHash,
    });

    return { projectCode, token };
  }

  async rotateProjectToken(projectCodeInput: string) {
    const projectCode = this.normalizeProjectCode(projectCodeInput);

    await this.repository.deactivateByProjectCode(projectCode);

    const keyPrefix = `${projectCode.toLowerCase()}_gateway_`;
    const randomSecret = randomBytes(32).toString('hex');
    const token = `${keyPrefix}${randomSecret}`;

    const keyHash = createHash('sha256').update(token).digest('hex');

    await this.repository.create({
      projectCode,
      keyPrefix,
      keyHash,
    });

    return { projectCode, token };
  }

  async authenticateToken(token: string) {
    const keyHash = createHash('sha256').update(token).digest('hex');

    const record = await this.repository.findActiveValidByHash(keyHash);

    if (!record) {
      throw new UnauthorizedException('Invalid service authentication token');
    }

    await this.repository.updateLastUsed(record.id);

    return record;
  }
}
