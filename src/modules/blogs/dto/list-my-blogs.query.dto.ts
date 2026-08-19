import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { ListBlogsQueryDto } from './list-blogs.query.dto';

export class ListMyBlogsQueryDto extends ListBlogsQueryDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Internal user id whose blogs should be returned',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({
    name: 'user_id',
    format: 'uuid',
    description: 'Internal user id whose blogs should be returned',
  })
  @IsOptional()
  @IsUUID()
  user_id?: string;
}
