import { Module } from '@nestjs/common';
import { BlogsModule } from '../blogs/blogs.module';
import { CommentsModule } from '../comments/comments.module';
import { ForumsModule } from '../forums/forums.module';
import { BlogReportsController } from './blog-reports.controller';
import { ForumReportsController } from './forum-reports.controller';
import { ReportsRepository } from './reports.repository';
import { ReportsService } from './reports.service';

@Module({
  imports: [BlogsModule, CommentsModule, ForumsModule],
  controllers: [BlogReportsController, ForumReportsController],
  providers: [ReportsRepository, ReportsService],
})
export class ReportsModule {}
