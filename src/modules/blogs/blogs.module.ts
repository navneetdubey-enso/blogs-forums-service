import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { GatewayApiKeyModule } from '../gateway-api-keys/gateway-api-key.module';
import { RedisModule } from '../redis/redis.module';
import { UsersModule } from '../users/users.module';
import { BlogsController } from './blogs.controller';
import { BlogsRepository } from './blogs.repository';
import { BlogsService } from './blogs.service';

@Module({
  imports: [DatabaseModule, UsersModule, RedisModule, GatewayApiKeyModule],
  controllers: [BlogsController],
  providers: [BlogsRepository, BlogsService],
})
export class BlogsModule {}
