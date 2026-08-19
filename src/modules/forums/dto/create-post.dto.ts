import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ description: 'Post text content' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Parent post ID when creating a reply',
  })
  @IsOptional()
  @IsUUID()
  parentPostId?: string;
}
