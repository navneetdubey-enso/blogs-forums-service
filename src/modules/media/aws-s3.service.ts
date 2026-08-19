import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Readable } from 'node:stream';

@Injectable()
export class AwsS3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly logger = new Logger(AwsS3Service.name);

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {
    const accessKeyId = this.config.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('AWS_SECRET_ACCESS_KEY');
    const region = this.config.get<string>('AWS_REGION', 'us-east-1');
    this.bucketName = this.config.get<string>(
      'AWS_S3_BUCKET_NAME',
      'blogs-enso',
    );

    if (!accessKeyId || !secretAccessKey) {
      this.logger.warn('AWS credentials not fully configured in environment.');
    }

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId: accessKeyId || 'dummy',
        secretAccessKey: secretAccessKey || 'dummy',
      },
    });
  }

  async upload(
    file: Express.Multer.File,
    key: string,
    options?: { isPublic?: boolean },
  ): Promise<{ objectKey: string; etag?: string; bucket: string }> {
    try {
      return await this.putObject(file, key, options?.isPublic === true);
    } catch (error) {
      if (options?.isPublic) {
        this.logger.warn(
          `Public ACL rejected for key ${key}; retrying without ACL. Ensure the bucket policy allows public reads.`,
        );
        try {
          return await this.putObject(file, key, false);
        } catch (retryError) {
          this.logger.error(`S3 upload failed for key: ${key}`, retryError);
          throw new InternalServerErrorException(
            `File upload failed: ${(retryError as Error).message}`,
          );
        }
      }

      this.logger.error(`S3 upload failed for key: ${key}`, error);
      throw new InternalServerErrorException(
        `File upload failed: ${(error as Error).message}`,
      );
    }
  }

  private async putObject(
    file: Express.Multer.File,
    key: string,
    isPublic: boolean,
  ) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ...(isPublic ? { ACL: 'public-read' as const } : {}),
    });

    const response = await this.s3Client.send(command);
    return {
      objectKey: key,
      etag: response.ETag,
      bucket: this.bucketName,
    };
  }

  async delete(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      this.logger.error(`S3 deletion failed for key: ${key}`, error);
      throw new InternalServerErrorException(
        `File deletion failed: ${(error as Error).message}`,
      );
    }
  }

  async deleteMany(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    try {
      const command = new DeleteObjectsCommand({
        Bucket: this.bucketName,
        Delete: {
          Objects: keys.map((key) => ({ Key: key })),
          Quiet: true,
        },
      });

      await this.s3Client.send(command);
    } catch (error) {
      this.logger.error('S3 bulk deletion failed', error);
      throw new InternalServerErrorException(
        `Bulk file deletion failed: ${(error as Error).message}`,
      );
    }
  }

  async getSignedUrl(key: string, expiresIn?: number): Promise<string> {
    try {
      const expiration =
        expiresIn ??
        this.config.get<number>('AWS_S3_SIGNED_URL_EXPIRES_IN', 3600);
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, {
        expiresIn: Number(expiration),
      });
    } catch (error) {
      this.logger.error(
        `Generating pre-signed URL failed for key: ${key}`,
        error,
      );
      throw new InternalServerErrorException(
        `Could not generate download link: ${(error as Error).message}`,
      );
    }
  }

  async getObject(key: string): Promise<{
    body: Readable;
    contentType?: string;
    contentLength?: number;
  }> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      const response = await this.s3Client.send(command);

      if (!response.Body) {
        throw new NotFoundException(`S3 object not found for key: ${key}`);
      }

      return {
        body: response.Body as Readable,
        contentType: response.ContentType,
        contentLength: response.ContentLength,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      const name = (error as { name?: string }).name;
      if (name === 'NoSuchKey' || name === 'NotFound') {
        throw new NotFoundException(`S3 object not found for key: ${key}`);
      }

      this.logger.error(`S3 getObject failed for key: ${key}`, error);
      throw new InternalServerErrorException(
        `File download failed: ${(error as Error).message}`,
      );
    }
  }
}
