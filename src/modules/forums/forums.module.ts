import { Module } from '@nestjs/common';
import { ForumPostsController } from './forum-posts.controller';
import { ForumPostsRepository } from './forum-posts.repository';
import { ForumTopicsController } from './forum-topics.controller';
import { ForumTopicsRepository } from './forum-topics.repository';
import { ForumsController } from './forums.controller';
import { ForumsRepository } from './forums.repository';
import { ForumsService } from './forums.service';
import { MyTopicsController } from './my-topics.controller';

@Module({
  controllers: [
    ForumsController,
    ForumTopicsController,
    ForumPostsController,
    MyTopicsController,
  ],
  providers: [
    ForumsRepository,
    ForumTopicsRepository,
    ForumPostsRepository,
    ForumsService,
  ],
})
export class ForumsModule {}
