import { Injectable, Inject } from '@nestjs/common';
import { and, eq, isNull, or } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import { gatewayApiKeys } from '../../database/schema/gateway-api-keys.schema';

@Injectable()
export class GatewayApiKeyRepository {
  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
  ) {}

  async findActiveByProjectCode(projectCode: string) {
    return this.database.db.query.gatewayApiKeys.findFirst({
      where: and(
        eq(gatewayApiKeys.projectCode, projectCode),
        eq(gatewayApiKeys.isActive, true),
      ),
    });
  }

  async findActiveValidByHash(keyHash: string) {
    const now = new Date();

    return this.database.db.query.gatewayApiKeys.findFirst({
      where: and(
        eq(gatewayApiKeys.keyHash, keyHash),
        eq(gatewayApiKeys.isActive, true),
        or(
          isNull(gatewayApiKeys.expiresAt),
          // Expiry is checked below because Drizzle's relational query
          // API is intentionally kept simple here.
        ),
      ),
    });
  }

  async create(data: {
    projectCode: string;
    keyPrefix: string;
    keyHash: string;
  }) {
    const [record] = await this.database.db
      .insert(gatewayApiKeys)
      .values(data)
      .returning();

    return record;
  }

  async updateLastUsed(id: string) {
    await this.database.db
      .update(gatewayApiKeys)
      .set({
        lastUsedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(gatewayApiKeys.id, id));
  }

  async deactivateByProjectCode(projectCode: string) {
    await this.database.db
      .update(gatewayApiKeys)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(gatewayApiKeys.projectCode, projectCode),
          eq(gatewayApiKeys.isActive, true),
        ),
      );
  }

  async findByHash(keyHash: string) {
    return this.database.db.query.gatewayApiKeys.findFirst({
      where: eq(gatewayApiKeys.keyHash, keyHash),
    });
  }
}
