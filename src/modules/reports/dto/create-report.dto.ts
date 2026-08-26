import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { REPORT_REASONS, type ReportReason } from '../enums/report.enum';

export class CreateReportDto {
  @ApiProperty({
    enum: REPORT_REASONS,
    example: 'SPAM',
    description: 'Predefined reason for the report',
  })
  @IsIn(REPORT_REASONS, {
    message: `reason must be one of: ${REPORT_REASONS.join(', ')}`,
  })
  reason: ReportReason;

  @ApiPropertyOptional({
    example: 'This content is promotional and repeated across posts.',
    description: 'Optional additional context for the report',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
