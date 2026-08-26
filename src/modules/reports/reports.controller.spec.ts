import {
  INestApplication,
  ValidationPipe,
  type ExecutionContext,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ServiceAuthGuard } from '../../common/guards/service-auth.guard';
import { BlogReportsController } from './blog-reports.controller';
import { ForumReportsController } from './forum-reports.controller';
import { ReportsService } from './reports.service';

const blogId = '11111111-1111-4111-8111-111111111111';
const commentId = '22222222-2222-4222-8222-222222222222';
const forumId = '33333333-3333-4333-8333-333333333333';
const forumCommentId = '44444444-4444-4444-8444-444444444444';

const identityHeaders = {
  'X-App-User-Id': 'app-user-1',
  'X-Universe-User-Id': '1001',
  'X-App-User-Role': 'author',
};

describe('Report API validation', () => {
  let app: INestApplication;
  const reportsService = {
    reportBlog: jest.fn(),
    reportBlogComment: jest.fn(),
    reportForum: jest.fn(),
    reportForumComment: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [BlogReportsController, ForumReportsController],
      providers: [{ provide: ReportsService, useValue: reportsService }],
    })
      .overrideGuard(ServiceAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const httpRequest = context.switchToHttp().getRequest<{
            serviceAuth?: { projectCode: string };
          }>();
          httpRequest.serviceAuth = { projectCode: 'INFOCALLING' };
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 400 for an invalid report reason', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/blogs/${blogId}/report`)
      .set(identityHeaders)
      .send({ reason: 'NOT_A_REASON' })
      .expect(400);
    expect(reportsService.reportBlog).not.toHaveBeenCalled();
  });

  it('returns 400 when reason is missing', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/forums/${forumId}/report`)
      .set(identityHeaders)
      .send({})
      .expect(400);
    expect(reportsService.reportForum).not.toHaveBeenCalled();
  });

  it('accepts a valid blog comment report payload', async () => {
    reportsService.reportBlogComment.mockResolvedValue({ id: 'report-1' });
    await request(app.getHttpServer())
      .post(`/api/v1/blogs/${blogId}/comments/${commentId}/report`)
      .set(identityHeaders)
      .send({ reason: 'ABUSIVE' })
      .expect(201);
    expect(reportsService.reportBlogComment).toHaveBeenCalled();
  });

  it('accepts a valid forum comment report payload', async () => {
    reportsService.reportForumComment.mockResolvedValue({ id: 'report-1' });
    await request(app.getHttpServer())
      .post(`/api/v1/forums/${forumId}/comments/${forumCommentId}/report`)
      .set(identityHeaders)
      .send({ reason: 'COPYRIGHT', description: 'Copied article' })
      .expect(201);
    expect(reportsService.reportForumComment).toHaveBeenCalled();
  });

  it('documents all four report routes in Swagger', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('test').build(),
    );
    expect(document.paths['/api/v1/blogs/{id}/report']?.post).toBeDefined();
    expect(
      document.paths['/api/v1/blogs/{id}/comments/{commentId}/report']?.post,
    ).toBeDefined();
    expect(document.paths['/api/v1/forums/{id}/report']?.post).toBeDefined();
    expect(
      document.paths['/api/v1/forums/{id}/comments/{commentId}/report']?.post,
    ).toBeDefined();
  });
});
