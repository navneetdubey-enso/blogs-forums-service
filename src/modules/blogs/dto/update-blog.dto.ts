import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import {
  BLOG_STATUSES,
  requiresCompleteBlogFields,
} from '../blog-fields.helper';
import { BlogStatus } from '../enums/blog.enum';

function emptyToUndefined(value: unknown) {
  if (value === null) {
    return null;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }
  return typeof value === 'string' ? value.trim() : value;
}

export class UpdateBlogDto {
  @ApiPropertyOptional({
    example: 'Updated blog title',
    description:
      'Optional for DRAFT. Required in the request body when status is PENDING_REVIEW or PUBLISHED.',
  })
  @Transform(({ value }) => emptyToUndefined(value))
  @ValidateIf(
    (o: UpdateBlogDto) =>
      requiresCompleteBlogFields(o.status) || o.title !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    example: 'updated-blog-title',
    description:
      'Optional for DRAFT. Required and must be a valid slug when status is PENDING_REVIEW or PUBLISHED.',
  })
  @Transform(({ value }) => emptyToUndefined(value))
  @ValidateIf(
    (o: UpdateBlogDto) =>
      requiresCompleteBlogFields(o.status) || o.slug !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase letters, numbers, and hyphens',
  })
  slug?: string;

  @ApiPropertyOptional({
    description:
      'Optional for DRAFT. Required when status is PENDING_REVIEW or PUBLISHED.',
  })
  @Transform(({ value }) => emptyToUndefined(value))
  @ValidateIf(
    (o: UpdateBlogDto) =>
      requiresCompleteBlogFields(o.status) || o.content !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  content?: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  thumbnailMediaId?: string | null;

  @ApiPropertyOptional({ type: [String], nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[] | null;

  @ApiPropertyOptional({
    type: [String],
    nullable: true,
    description: 'Optional external links. Never required for PENDING_REVIEW.',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(2048, { each: true })
  links?: string[] | null;

  @ApiPropertyOptional({
    type: [String],
    nullable: true,
    description: 'Optional media urls.',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[] | null;

  @ApiPropertyOptional({
    enum: BLOG_STATUSES,
    description:
      'DRAFT allows incomplete fields. PENDING_REVIEW and PUBLISHED require title, slug, and content in this request.',
  })
  @IsOptional()
  @IsIn(BLOG_STATUSES)
  status?: BlogStatus;
}
