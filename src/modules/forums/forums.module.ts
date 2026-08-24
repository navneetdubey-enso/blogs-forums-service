import { Module } from '@nestjs/common';
import { ForumCommentsController } from './forum-comments.controller';
import { ForumCommentsRepository } from './forum-comments.repository';
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
    ForumCommentsController,
    MyTopicsController,
  ],
  providers: [
    ForumsRepository,
    ForumTopicsRepository,
    ForumCommentsRepository,
    ForumsService,
  ],
  exports: [ForumsRepository],
})
export class ForumsModule {}
