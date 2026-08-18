import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ServiceAuthGuard } from '../../common/guards/service-auth.guard';
import {
  ApiUserIdentityHeaders,
  UserIdentity,
} from '../users/user-identity.decorator';
import type { AppUserIdentity } from '../users/users.service';
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { ListBlogsQueryDto } from './dto/list-blogs.query.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

@ApiTags('Blogs')
@ApiSecurity('service-auth')
@ApiUnauthorizedResponse({ description: 'Invalid or missing service token' })
@Controller('api/v1/blogs')
@UseGuards(ServiceAuthGuard)
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiUserIdentityHeaders()
  @ApiOperation({ summary: 'Create a blog' })
  @ApiConflictResponse({ description: 'Duplicate slug' })
  async create(
    @UserIdentity() identity: AppUserIdentity,
    @Body() dto: CreateBlogDto,
  ) {
    const data = await this.blogsService.create(identity, dto);
    return {
      statusCode: 201,
      success: true,
      message: 'Blog created successfully',
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List active blogs' })
  async list(@Query() query: ListBlogsQueryDto) {
    const data = await this.blogsService.list(query);
    return {
      statusCode: 200,
      success: true,
      message: 'Blogs retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an active blog by id' })
  @ApiNotFoundResponse({ description: 'Blog not found' })
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.blogsService.getById(id);
    return {
      statusCode: 200,
      success: true,
      message: 'Blog retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @ApiUserIdentityHeaders()
  @ApiOperation({ summary: 'Update an owned blog' })
  @ApiNotFoundResponse({ description: 'Blog not found' })
  @ApiForbiddenResponse({ description: 'Not the blog owner' })
  @ApiConflictResponse({ description: 'Duplicate slug' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @UserIdentity() identity: AppUserIdentity,
    @Body() dto: UpdateBlogDto,
  ) {
    const data = await this.blogsService.update(id, identity, dto);
    return {
      statusCode: 200,
      success: true,
      message: 'Blog updated successfully',
      data,
    };
  }

  @Delete(':id')
  @ApiUserIdentityHeaders()
  @ApiOperation({ summary: 'Soft delete an owned blog' })
  @ApiNotFoundResponse({ description: 'Blog not found' })
  @ApiForbiddenResponse({ description: 'Not the blog owner' })
  async softDelete(
    @Param('id', ParseUUIDPipe) id: string,
    @UserIdentity() identity: AppUserIdentity,
  ) {
    const data = await this.blogsService.softDelete(id, identity);
    return {
      statusCode: 200,
      success: true,
      message: 'Blog deleted successfully',
      data,
    };
  }
}
