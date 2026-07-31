import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { Permissions } from '../../auth/permissions/permissions.decorator';
import { CourseQueryDto } from '../dto/course-query.dto';
import {
  CourseListResponseDto,
  CourseResponseDto,
} from '../dto/course-response.dto';
import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';
import { CourseService } from '../services/course.service';

@ApiTags('Courses')
@ApiBearerAuth('access-token')
@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @Permissions('course.create')
  @ApiOperation({ summary: 'Create course' })
  @ApiBody({ type: CreateCourseDto })
  @ApiCreatedResponse({
    description: 'Course created successfully',
    type: CourseResponseDto,
  })
  @ApiConflictResponse({
    description: 'Course name or code already exists',
  })
  create(@Body() dto: CreateCourseDto) {
    return this.courseService.create(dto);
  }

  @Get()
  @Permissions('course.read')
  @ApiOperation({ summary: 'Get paginated course list' })
  @ApiOkResponse({
    description: 'Course list fetched successfully',
    type: CourseListResponseDto,
  })
  findAll(@Query() query: CourseQueryDto) {
    return this.courseService.findAll(query);
  }

  @Get(':courseId')
  @Permissions('course.read')
  @ApiOperation({ summary: 'Get course details' })
  @ApiParam({
    name: 'courseId',
    type: Number,
    example: 1,
  })
  @ApiOkResponse({
    description: 'Course details fetched successfully',
    type: CourseResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Course not found',
  })
  findOne(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.courseService.findOne(courseId);
  }

  @Patch(':courseId')
  @Permissions('course.update')
  @ApiOperation({ summary: 'Update course' })
  @ApiParam({
    name: 'courseId',
    type: Number,
    example: 1,
  })
  @ApiBody({ type: UpdateCourseDto })
  @ApiOkResponse({
    description: 'Course updated successfully',
    type: CourseResponseDto,
  })
  @ApiConflictResponse({
    description: 'Course name or code already exists',
  })
  @ApiNotFoundResponse({
    description: 'Course not found',
  })
  update(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.courseService.update(courseId, dto);
  }

  @Delete(':courseId')
  @Permissions('course.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete course' })
  @ApiParam({
    name: 'courseId',
    type: Number,
    example: 1,
  })
  @ApiOkResponse({
    description: 'Course soft deleted successfully',
    type: CourseResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Course not found',
  })
  remove(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.courseService.remove(courseId);
  }
}
