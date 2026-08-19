import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AwsS3Service } from './aws-s3.service';
import { MediaRepository } from './media.repository';
import { MediaService } from './media.service';
import { UsersService } from '../users/users.service';

describe('MediaService.download', () => {
  it('returns 404 when the media record does not exist', async () => {
    const service = new MediaService(
      {
        findById: jest.fn().mockResolvedValue(null),
      } as unknown as MediaRepository,
      {} as AwsS3Service,
      {} as UsersService,
      {
        get: jest.fn().mockReturnValue('us-east-1'),
      } as unknown as ConfigService,
    );

    await expect(
      service.download('11111111-1111-1111-1111-111111111111'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('loads the S3 object with the stored key', async () => {
    const getObject = jest.fn().mockResolvedValue({
      body: { pipe: jest.fn() },
      contentType: 'image/png',
      contentLength: 12,
    });

    const service = new MediaService(
      {
        findById: jest.fn().mockResolvedValue({
          id: 'media-1',
          objectKey: 'infocalling/blogs/media-1.png',
          mimeType: 'image/png',
          originalName: 'cover.png',
          storedName: 'media-1.png',
        }),
      } as unknown as MediaRepository,
      { getObject } as unknown as AwsS3Service,
      {} as UsersService,
      {
        get: jest.fn().mockReturnValue('us-east-1'),
      } as unknown as ConfigService,
    );

    const result = await service.download('media-1');

    expect(getObject).toHaveBeenCalledWith('infocalling/blogs/media-1.png');
    expect(result.filename).toBe('cover.png');
    expect(result.mimeType).toBe('image/png');
  });
});
