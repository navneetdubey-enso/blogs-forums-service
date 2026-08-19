import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export const FORUM_TOPIC_STATUSES = ['DRAFT', 'PUBLISHED'] as const;
export type ForumTopicStatus = (typeof FORUM_TOPIC_STATUSES)[number];

export class CreateTopicDto {
  @ApiProperty({ example: 'How do I get started?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'how-do-i-get-started' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @ApiProperty({ example: 'I am new to the forum.' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    enum: FORUM_TOPIC_STATUSES,
    example: 'DRAFT',
    description: 'Optional. Defaults to DRAFT when omitted.',
  })
  @IsOptional()
  @IsIn(FORUM_TOPIC_STATUSES)
  status?: ForumTopicStatus;
}
