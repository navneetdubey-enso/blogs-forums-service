import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  FORUM_TOPIC_STATUSES,
  type ForumTopicStatus,
} from './create-topic.dto';

export class UpdateTopicDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase letters, numbers, and hyphens',
  })
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  @ApiPropertyOptional({ enum: FORUM_TOPIC_STATUSES })
  @IsOptional()
  @IsIn(FORUM_TOPIC_STATUSES)
  status?: ForumTopicStatus;
}
