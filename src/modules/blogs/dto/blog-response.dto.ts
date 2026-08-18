import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { InferSelectModel } from 'drizzle-orm';
import { blogs } from '../../../database/schema/blogs.schema';
import type { BlogStatus } from './create-blog.dto';

type BlogRow = InferSelectModel<typeof blogs>;

export class BlogResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  content: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  thumbnailMediaId: string | null;

  @ApiPropertyOptional({ type: [String], nullable: true })
  tags: string[] | null;

  @ApiProperty({ enum: ['DRAFT', 'PUBLISHED'] })
  status: BlogStatus;

  @ApiPropertyOptional({ nullable: true })
  readingTime: number | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  static fromEntity(row: BlogRow): BlogResponseDto {
    return {
      id: row.id,
      userId: row.userId,
      title: row.title,
      slug: row.slug,
      content: row.content,
      thumbnailMediaId: row.thumbnailMediaId,
      tags: row.tags,
      status: row.status,
      readingTime: row.readingTime,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
