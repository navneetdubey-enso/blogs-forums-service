import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateForumDto {
  @ApiProperty({ example: 'How do I get started?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'I am new to the forum.' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: 'Technology' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  category: string;

  @ApiPropertyOptional({ example: ['Programming', 'Node.js'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subCategory?: string[];

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID()
  mediaId?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}
