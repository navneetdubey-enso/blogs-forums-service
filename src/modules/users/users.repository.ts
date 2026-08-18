import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import { users } from '../../database/schema/users.schema';

@Injectable()
export class UsersRepository {
  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
  ) {}

  async findByAppIdentity(appType: string, appUserId: string) {
    return this.database.db.query.users.findFirst({
      where: and(eq(users.appType, appType), eq(users.appUserId, appUserId)),
    });
  }

  async create(data: {
    appType: string;
    appUserId: string;
    universeUserId: number;
    appUserRole: string;
  }) {
    const [record] = await this.database.db
      .insert(users)
      .values(data)
      .returning();
    return record;
  }

  async updateRole(id: string, appUserRole: string) {
    const [record] = await this.database.db
      .update(users)
      .set({
        appUserRole,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return record;
  }
}
