import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { ListForumsQueryDto } from './list-forums.query.dto';

export class ListMyForumsQueryDto extends ListForumsQueryDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Internal user id whose forums should be returned',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({
    name: 'user_id',
    format: 'uuid',
    description: 'Internal user id whose forums should be returned',
  })
  @IsOptional()
  @IsUUID()
  user_id?: string;
}
