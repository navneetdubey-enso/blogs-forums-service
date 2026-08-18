import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { BlogsModule } from './modules/blogs/blogs.module';
import { GatewayApiKeyModule } from './modules/gateway-api-keys/gateway-api-key.module';
import { HealthModule } from './modules/health/health.module';
import { RedisModule } from './modules/redis/redis.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    RedisModule,
    GatewayApiKeyModule,
    HealthModule,
    UsersModule,
    BlogsModule,
  ],
})
export class AppModule {}
