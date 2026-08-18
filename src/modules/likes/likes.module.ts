import { Module } from '@nestjs/common';
import { BlogsModule } from '../blogs/blogs.module';
import { LikesController } from './likes.controller';
import { LikesRepository } from './likes.repository';
import { LikesService } from './likes.service';

@Module({
  imports: [BlogsModule],
  controllers: [LikesController],
  providers: [LikesRepository, LikesService],
})
export class LikesModule {}
