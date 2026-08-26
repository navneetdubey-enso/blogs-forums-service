import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { ForumCommentsController } from './forum-comments.controller';
import { ForumCommentsRepository } from './forum-comments.repository';
import { ForumsController } from './forums.controller';
import { ForumsRepository } from './forums.repository';
import { ForumsService } from './forums.service';
import { MyForumsController } from './my-forums.controller';

@Module({
  imports: [MediaModule],
  controllers: [ForumsController, ForumCommentsController, MyForumsController],
  providers: [ForumsRepository, ForumCommentsRepository, ForumsService],
  exports: [ForumsRepository, ForumCommentsRepository],
})
export class ForumsModule {}
