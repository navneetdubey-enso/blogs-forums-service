import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ description: 'Comment text content' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Parent comment ID when creating a reply',
  })
  @IsOptional()
  @IsUUID()
  parentCommentId?: string;
}
