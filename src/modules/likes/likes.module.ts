import { Module } from '@nestjs/common';
import { BlogsModule } from '../blogs/blogs.module';
import { ForumsModule } from '../forums/forums.module';
import { ForumLikesController } from './forum-likes.controller';
import { LikesController } from './likes.controller';
import { LikesRepository } from './likes.repository';
import { LikesService } from './likes.service';

@Module({
  imports: [BlogsModule, ForumsModule],
  controllers: [LikesController, ForumLikesController],
  providers: [LikesRepository, LikesService],
})
export class LikesModule {}
