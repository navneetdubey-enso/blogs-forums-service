import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  FORUM_TOPIC_STATUSES,
  type ForumTopicStatus,
} from './create-topic.dto';

export class ListTopicsQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ enum: FORUM_TOPIC_STATUSES })
  @IsOptional()
  @IsIn(FORUM_TOPIC_STATUSES)
  status?: ForumTopicStatus;

  @ApiPropertyOptional({ description: 'Search in topic title and content' })
  @IsOptional()
  @IsString()
  search?: string;
}
