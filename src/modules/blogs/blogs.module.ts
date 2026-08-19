import { Module } from '@nestjs/common';
import { BlogsController } from './blogs.controller';
import { BlogsRepository } from './blogs.repository';
import { BlogsService } from './blogs.service';
import { MediaModule } from '../media/media.module';
import { MyBlogsController } from './my-blogs.controller';

@Module({
  imports: [MediaModule],
  controllers: [BlogsController, MyBlogsController],
  providers: [BlogsRepository, BlogsService],
  exports: [BlogsRepository, BlogsService],
})
export class BlogsModule {}
