import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { InferSelectModel } from 'drizzle-orm';
import { media } from '../../../database/schema/media.schema';

type MediaRow = InferSelectModel<typeof media>;

export class MediaResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  ownerType?: string;

  @ApiPropertyOptional()
  ownerUuid?: string;

  @ApiPropertyOptional()
  documentType?: string;

  @ApiProperty()
  originalName: string;

  @ApiProperty()
  storedName: string;

  @ApiProperty()
  extension: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  visibility: string;

  @ApiPropertyOptional()
  url?: string;

  @ApiPropertyOptional()
  refModule?: string;

  @ApiPropertyOptional()
  refId?: string;

  @ApiPropertyOptional()
  uploadedBy?: string;

  @ApiProperty()
  createdAt: Date;

  static fromEntity(entity: MediaRow, url?: string): MediaResponseDto {
    const dto = new MediaResponseDto();
    dto.id = entity.id;
    dto.ownerType = entity.ownerType ?? undefined;
    dto.ownerUuid = entity.ownerUuid ?? undefined;
    dto.documentType = entity.documentType ?? undefined;
    dto.originalName = entity.originalName ?? '';
    dto.storedName = entity.storedName ?? '';
    dto.extension = entity.extension ?? '';
    dto.mimeType = entity.mimeType ?? '';
    dto.size = entity.size ?? 0;
    dto.visibility = entity.visibility ?? 'PRIVATE';
    dto.url = url;
    dto.refModule = entity.refModule ?? undefined;
    dto.refId = entity.refId ?? undefined;
    dto.uploadedBy = entity.uploadedBy ?? undefined;
    dto.createdAt = entity.createdAt;
    return dto;
  }
}
