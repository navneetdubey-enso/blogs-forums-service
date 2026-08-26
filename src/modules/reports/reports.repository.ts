import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { reports } from '../../database/schema/reports.schema';
import {
  ReportStatus,
  type ReportReason,
  type ReportTargetType,
} from './enums/report.enum';

@Injectable()
export class ReportsRepository {
  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
  ) {}

  async create(data: {
    reporterUserId: string;
    targetType: ReportTargetType;
    targetId: string;
    reason: ReportReason;
    description?: string | null;
  }) {
    const [record] = await this.database.db
      .insert(reports)
      .values({
        reporterUserId: data.reporterUserId,
        targetType: data.targetType,
        targetId: data.targetId,
        reason: data.reason,
        description: data.description ?? null,
        status: ReportStatus.PENDING,
      })
      .returning();
    return record;
  }
}
