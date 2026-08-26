import { Module } from '@nestjs/common';
import { BlogsModule } from '../blogs/blogs.module';
import { CommentsController } from './comments.controller';
import { CommentsRepository } from './comments.repository';
import { CommentsService } from './comments.service';

@Module({
  imports: [BlogsModule],
  controllers: [CommentsController],
  providers: [CommentsRepository, CommentsService],
  exports: [CommentsRepository],
})
export class CommentsModule {}
