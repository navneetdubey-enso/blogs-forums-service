import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import type { Readable } from 'node:stream';
import { AwsS3Service } from './aws-s3.service';
import { MediaResponseDto } from './dto/media-response.dto';
import { UploadMediaDto } from './dto/upload-media.dto';
import {
  MediaRepository,
  type MediaRow,
  type NewMedia,
} from './media.repository';
import type { AppUserIdentity } from '../users/users.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly awsRegion: string;

  constructor(
    @Inject(MediaRepository)
    private readonly mediaRepository: MediaRepository,
    @Inject(AwsS3Service)
    private readonly awsS3Service: AwsS3Service,
    @Inject(UsersService)
    private readonly usersService: UsersService,
    @Inject(ConfigService)
    private readonly config: ConfigService,
  ) {
    this.awsRegion = this.config.get<string>('AWS_REGION', 'us-east-1');
  }

  async uploadOne(
    file: Express.Multer.File,
    dto: UploadMediaDto,
    identity: AppUserIdentity,
  ): Promise<MediaResponseDto> {
    const user = await this.usersService.require(identity, true);
    return this.persistUpload(file, dto, user.id);
  }

  async uploadMany(
    files: Express.Multer.File[],
    dto: UploadMediaDto,
    identity: AppUserIdentity,
  ): Promise<MediaResponseDto[]> {
    const user = await this.usersService.require(identity, true);
    if (!files || files.length === 0) return [];

    const ownerType = dto.ownerType || 'USER';
    const ownerUuid = dto.ownerUuid || user.id;

    const uploadPayloads = files.map((file) => {
      const fileUuid = randomUUID();
      const ext = file.originalname.split('.').pop()?.toLowerCase() || '';
      const storedName = `${fileUuid}.${ext}`;
      const objectKey = this.generateObjectKey(dto, ownerUuid, storedName);
      return { file, fileUuid, ext, storedName, objectKey };
    });

    const objectKeys = uploadPayloads.map((payload) => payload.objectKey);
    const s3Results = await Promise.all(
      uploadPayloads.map((payload) =>
        this.awsS3Service.upload(payload.file, payload.objectKey, {
          isPublic:
            (dto.visibility || this.defaultVisibility(dto)) === 'PUBLIC',
        }),
      ),
    );

    try {
      const records: NewMedia[] = uploadPayloads.map((payload, index) => ({
        id: payload.fileUuid,
        ownerType,
        ownerUuid,
        documentType: dto.documentType,
        originalName: payload.file.originalname,
        storedName: payload.storedName,
        extension: payload.ext,
        mimeType: payload.file.mimetype,
        size: payload.file.size,
        bucketName: s3Results[index].bucket,
        objectKey: s3Results[index].objectKey,
        etag: s3Results[index].etag,
        visibility: dto.visibility || this.defaultVisibility(dto),
        refModule: dto.refModule,
        refId: dto.refId,
        uploadedBy: user.id,
      }));

      const entities = await this.mediaRepository.createMany(records);
      return Promise.all(
        entities.map(async (entity) =>
          MediaResponseDto.fromEntity(entity, await this.resolveUrl(entity)),
        ),
      );
    } catch (dbError) {
      this.logger.error(
        'Batch database insert failed, rolling back S3 uploads',
        dbError,
      );
      await this.awsS3Service.deleteMany(objectKeys).catch((cleanupError) => {
        this.logger.error(
          'Failed S3 cleanup after bulk DB failure',
          cleanupError,
        );
      });
      throw new InternalServerErrorException(
        `Could not save bulk file details: ${(dbError as Error).message}`,
      );
    }
  }

  async findOne(id: string): Promise<MediaResponseDto> {
    const entity = await this.mediaRepository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Media not found with ID: ${id}`);
    }
    return MediaResponseDto.fromEntity(entity, await this.resolveUrl(entity));
  }

  async download(id: string): Promise<{
    stream: Readable;
    mimeType: string;
    filename: string;
    contentLength?: number;
  }> {
    const entity = await this.mediaRepository.findById(id);
    if (!entity || !entity.objectKey) {
      throw new NotFoundException(`Media not found with ID: ${id}`);
    }

    const object = await this.awsS3Service.getObject(entity.objectKey);
    return {
      stream: object.body,
      mimeType:
        entity.mimeType || object.contentType || 'application/octet-stream',
      filename: entity.originalName || entity.storedName || `${entity.id}`,
      contentLength: object.contentLength,
    };
  }

  async resolveStorageUrl(
    bucketName?: string | null,
    objectKey?: string | null,
    visibility?: string | null,
  ): Promise<string | undefined> {
    if (!bucketName || !objectKey) return undefined;
    if (visibility === 'PUBLIC') {
      return `https://${bucketName}.s3.${this.awsRegion}.amazonaws.com/${objectKey}`;
    }
    return this.awsS3Service.getSignedUrl(objectKey);
  }

  private async persistUpload(
    file: Express.Multer.File,
    dto: UploadMediaDto,
    uploadedBy: string,
  ): Promise<MediaResponseDto> {
    const ownerType = dto.ownerType || 'USER';
    const ownerUuid = dto.ownerUuid || uploadedBy;
    const fileUuid = randomUUID();
    const ext = file.originalname.split('.').pop()?.toLowerCase() || '';
    const storedName = `${fileUuid}.${ext}`;
    const objectKey = this.generateObjectKey(dto, ownerUuid, storedName);

    const s3Result = await this.awsS3Service.upload(file, objectKey, {
      isPublic: (dto.visibility || this.defaultVisibility(dto)) === 'PUBLIC',
    });

    try {
      const entity = await this.mediaRepository.create({
        id: fileUuid,
        ownerType,
        ownerUuid,
        documentType: dto.documentType,
        originalName: file.originalname,
        storedName,
        extension: ext,
        mimeType: file.mimetype,
        size: file.size,
        bucketName: s3Result.bucket,
        objectKey: s3Result.objectKey,
        etag: s3Result.etag,
        visibility: dto.visibility || this.defaultVisibility(dto),
        refModule: dto.refModule,
        refId: dto.refId,
        uploadedBy,
      });

      return MediaResponseDto.fromEntity(entity, await this.resolveUrl(entity));
    } catch (dbError) {
      this.logger.error(
        'Database insert failed after S3 upload, cleaning up objectKey',
        dbError,
      );
      await this.awsS3Service.delete(objectKey).catch((cleanupError) => {
        this.logger.error(
          `Failed to delete orphaned S3 object: ${objectKey}`,
          cleanupError,
        );
      });
      throw new InternalServerErrorException(
        `Could not save file metadata: ${(dbError as Error).message}`,
      );
    }
  }

  private generateObjectKey(
    dto: UploadMediaDto,
    ownerUuid: string,
    storedName: string,
  ): string {
    const refModule = dto.refModule?.trim().toUpperCase();

    // Blog/forum media is stored as infocalling/{module}/{media_uuid}.{ext}
    // — never under a resource UUID folder.
    if (refModule === 'BLOG') {
      return `infocalling/blogs/${storedName}`;
    }
    if (refModule === 'FORUM') {
      return `infocalling/forums/${storedName}`;
    }

    return `user/${ownerUuid}/${storedName}`;
  }

  private defaultVisibility(dto: UploadMediaDto): 'PUBLIC' | 'PRIVATE' {
    const refModule = dto.refModule?.trim().toUpperCase();
    if (refModule === 'BLOG' || refModule === 'FORUM') {
      return 'PUBLIC';
    }
    return 'PRIVATE';
  }

  private async resolveUrl(entity: MediaRow): Promise<string> {
    return (
      (await this.resolveStorageUrl(
        entity.bucketName,
        entity.objectKey,
        entity.visibility,
      )) ?? ''
    );
  }
}
