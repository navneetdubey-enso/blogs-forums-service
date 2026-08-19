import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { ListTopicsQueryDto } from './list-topics.query.dto';

export class ListMyTopicsQueryDto extends ListTopicsQueryDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Internal user id whose topics should be returned',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({
    name: 'user_id',
    format: 'uuid',
    description: 'Internal user id whose topics should be returned',
  })
  @IsOptional()
  @IsUUID()
  user_id?: string;
}
