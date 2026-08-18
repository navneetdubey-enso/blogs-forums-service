import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({ description: 'Updated comment text content' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
