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

export { BLOG_STATUSES };
export { BlogStatus };

function emptyToUndefined(value: unknown) {
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateBlogDto {
  @ApiPropertyOptional({
    example: 'Getting started with blogs',
    description:
      'Optional for DRAFT. Required when status is PENDING_REVIEW or PUBLISHED.',
  })
  @Transform(({ value }) => emptyToUndefined(value))
  @ValidateIf(
    (o: CreateBlogDto) =>
      requiresCompleteBlogFields(o.status) || o.title !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    example: 'getting-started-with-blogs',
    description:
      'Optional for DRAFT. Required and must be a valid slug when status is PENDING_REVIEW or PUBLISHED.',
  })
  @Transform(({ value }) => emptyToUndefined(value))
  @ValidateIf(
    (o: CreateBlogDto) =>
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
    example: 'This is the blog content.',
    description:
      'Optional for DRAFT. Required when status is PENDING_REVIEW or PUBLISHED.',
  })
  @Transform(({ value }) => emptyToUndefined(value))
  @ValidateIf(
    (o: CreateBlogDto) =>
      requiresCompleteBlogFields(o.status) || o.content !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  content?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Media ID for the blog thumbnail',
  })
  @IsOptional()
  @IsUUID()
  thumbnailMediaId?: string;

  @ApiPropertyOptional({ type: [String], example: ['nestjs', 'postgres'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['https://example.com/docs'],
    description: 'Optional external links. Never required for PENDING_REVIEW.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(2048, { each: true })
  links?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['https://example.com/image.png'],
    description: 'Optional media urls.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];

  @ApiPropertyOptional({
    enum: BLOG_STATUSES,
    example: 'DRAFT',
    description:
      'Optional. Defaults to DRAFT. DRAFT allows incomplete title/slug/content. PENDING_REVIEW and PUBLISHED require title, slug, and content.',
  })
  @IsOptional()
  @IsIn(BLOG_STATUSES)
  status?: BlogStatus;
}
