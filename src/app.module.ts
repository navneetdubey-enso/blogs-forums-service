import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { BlogsModule } from './modules/blogs/blogs.module';
import { CommentsModule } from './modules/comments/comments.module';
import { ForumsModule } from './modules/forums/forums.module';
import { GatewayApiKeyModule } from './modules/gateway-api-keys/gateway-api-key.module';
import { LikesModule } from './modules/likes/likes.module';
import { MediaModule } from './modules/media/media.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { RedisModule } from './modules/redis/redis.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    RedisModule,
    GatewayApiKeyModule,
    UsersModule,
    MediaModule,
    BlogsModule,
    CommentsModule,
    LikesModule,
    ForumsModule,
    ProjectsModule,
  ],
})
export class AppModule {}
