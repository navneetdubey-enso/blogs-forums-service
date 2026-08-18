import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class UploadMediaDto {
  @ApiPropertyOptional({ enum: ['USER'], default: 'USER' })
  @IsEnum(['USER'])
  @IsOptional()
  ownerType?: 'USER';

  @ApiPropertyOptional({ description: 'UUID of the resource owner' })
  @IsUUID()
  @IsOptional()
  ownerUuid?: string;

  @ApiPropertyOptional({ description: 'Category/type of the document' })
  @IsString()
  @IsOptional()
  documentType?: string;

  @ApiPropertyOptional({ enum: ['PUBLIC', 'PRIVATE'], default: 'PRIVATE' })
  @IsEnum(['PUBLIC', 'PRIVATE'])
  @IsOptional()
  visibility?: 'PUBLIC' | 'PRIVATE';

  @ApiPropertyOptional({ description: 'Reference module name' })
  @IsString()
  @IsOptional()
  refModule?: string;

  @ApiPropertyOptional({ description: 'Reference ID' })
  @IsString()
  @IsOptional()
  refId?: string;
}
