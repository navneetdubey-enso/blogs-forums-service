import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import {
  ApiUserIdentityHeaders,
  UserIdentity,
} from '../../common/decorators/user-identity.decorator';
import { ServiceAuthGuard } from '../../common/guards/service-auth.guard';
import { apiSuccess } from '../../common/helpers/api-response.helper';
import type { AppUserIdentity } from '../users/users.service';
import { MediaResponseDto } from './dto/media-response.dto';
import { UploadMediaDto } from './dto/upload-media.dto';
import { MediaService } from './media.service';
import { MediaValidationPipe } from './validators/media-validation.pipe';

const mediaMetadataProperties = {
  ownerType: { type: 'string', example: 'USER' },
  ownerUuid: { type: 'string', format: 'uuid' },
  documentType: { type: 'string', example: 'BLOG' },
  visibility: {
    type: 'string',
    enum: ['PUBLIC', 'PRIVATE'],
    example: 'PUBLIC',
  },
  refModule: { type: 'string', example: 'BLOG' },
  refId: { type: 'string', example: 'blog-uuid' },
};

@ApiTags('Media')
@ApiSecurity('service-auth')
@ApiUnauthorizedResponse({ description: 'Invalid or missing service token' })
@Controller('api/v1/media')
@UseGuards(ServiceAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiUserIdentityHeaders()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a single media file' })
  @ApiForbiddenResponse({ description: 'Unable to resolve application user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        ...mediaMetadataProperties,
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, type: MediaResponseDto })
  async upload(
    @UploadedFile(new MediaValidationPipe()) file: Express.Multer.File,
    @Body() dto: UploadMediaDto,
    @UserIdentity() identity: AppUserIdentity,
  ) {
    const data = await this.mediaService.uploadOne(file, dto, identity);
    return apiSuccess(201, 'Media uploaded successfully', data);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiUserIdentityHeaders()
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload multiple media files' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        ...mediaMetadataProperties,
      },
      required: ['files'],
    },
  })
  @ApiResponse({ status: 201, type: [MediaResponseDto] })
  async uploadBulk(
    @UploadedFiles(new MediaValidationPipe()) files: Express.Multer.File[],
    @Body() dto: UploadMediaDto,
    @UserIdentity() identity: AppUserIdentity,
  ) {
    const data = await this.mediaService.uploadMany(files, dto, identity);
    return apiSuccess(201, 'Media uploaded successfully', data);
  }

  @Get(':uuid/download')
  @ApiOperation({
    summary: 'Download a media file by UUID',
    description:
      'Authenticated media download. Returns the original file with its MIME type and filename.',
  })
  @ApiResponse({ status: 200, description: 'Binary file stream' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  async download(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.mediaService.download(uuid);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(file.filename)}"`,
    );
    if (file.contentLength !== undefined) {
      res.setHeader('Content-Length', String(file.contentLength));
    }
    return new StreamableFile(file.stream);
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Get media file details by UUID' })
  @ApiResponse({ status: 200, type: MediaResponseDto })
  async findOne(@Param('uuid', ParseUUIDPipe) uuid: string) {
    const data = await this.mediaService.findOne(uuid);
    return apiSuccess(200, 'Media retrieved successfully', data);
  }
}
