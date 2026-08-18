import { ConflictException, Inject, Injectable } from '@nestjs/common';
import type { InferSelectModel } from 'drizzle-orm';
import { users } from '../../database/schema/users.schema';
import { UsersRepository } from './users.repository';

export type AppUserIdentity = {
  appType: string;
  appUserId: string;
  universeUserId: number;
  appUserRole: string;
};

type UserRow = InferSelectModel<typeof users>;

@Injectable()
export class UsersService {
  constructor(
    @Inject(UsersRepository)
    private readonly repository: UsersRepository,
  ) {}

  async resolve(identity: AppUserIdentity, createIfMissing = false) {
    const existing = await this.repository.findByAppIdentity(
      identity.appType,
      identity.appUserId,
    );

    if (existing) {
      return this.syncMappedUser(existing, identity);
    }

    if (!createIfMissing) {
      return null;
    }

    try {
      return await this.repository.create(identity);
    } catch (error) {
      if (!this.isUniqueViolation(error)) {
        throw error;
      }

      const raced = await this.repository.findByAppIdentity(
        identity.appType,
        identity.appUserId,
      );

      if (!raced) {
        return null;
      }

      return this.syncMappedUser(raced, identity);
    }
  }

  private syncMappedUser(existing: UserRow, identity: AppUserIdentity) {
    if (existing.universeUserId !== identity.universeUserId) {
      throw new ConflictException(
        'Application user is already mapped to a different Universe identity',
      );
    }

    if (existing.appUserRole !== identity.appUserRole) {
      return this.repository.updateRole(existing.id, identity.appUserRole);
    }

    return existing;
  }

  private isUniqueViolation(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === '23505'
    );
  }
}
