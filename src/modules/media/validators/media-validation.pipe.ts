import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class MediaValidationPipe implements PipeTransform {
  private readonly maxSizeBytes = 10 * 1024 * 1024;
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'audio/mpeg',
    'audio/wav',
    'audio/x-wav',
    'audio/mp4',
    'audio/x-m4a',
    'audio/m4a',
    'audio/ogg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ];

  transform(value: Express.Multer.File | Express.Multer.File[]) {
    if (!value) {
      throw new BadRequestException('File is required');
    }

    const files = Array.isArray(value) ? value : [value];

    for (const file of files) {
      if (file.size > this.maxSizeBytes) {
        throw new BadRequestException(
          `File ${file.originalname} exceeds max size limit of 10MB`,
        );
      }
      if (!this.allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `File ${file.originalname} has unsupported mime type: ${file.mimetype}`,
        );
      }
    }

    return value;
  }
}
