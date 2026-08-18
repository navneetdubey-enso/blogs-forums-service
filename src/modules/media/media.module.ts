import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AwsS3Service } from './aws-s3.service';
import { MediaController } from './media.controller';
import { MediaRepository } from './media.repository';
import { MediaService } from './media.service';

@Module({
  imports: [ConfigModule],
  controllers: [MediaController],
  providers: [MediaRepository, MediaService, AwsS3Service],
  exports: [MediaService],
})
export class MediaModule {}
