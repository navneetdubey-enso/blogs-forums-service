import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateForumCommentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;
}
