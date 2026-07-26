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
import { CreateStudentDto } from '../dto/create-student.dto';
import { StudentQueryDto } from '../dto/student-query.dto';
import { UpdateStudentDto } from '../dto/update-student.dto';
import { StudentsService } from '../services/students.service';

@ApiTags('Students')
@ApiBearerAuth('access-token')
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Permissions('students.create')
  @ApiOperation({ summary: 'Create student user' })
  @ApiBody({ type: CreateStudentDto })
  @ApiCreatedResponse({ description: 'Student created successfully' })
  @ApiConflictResponse({ description: 'Email or phone already exists' })
  create(@Body() dto: CreateStudentDto) {
    return this.studentsService.create(dto);
  }

  @Get()
  @Permissions('students.read')
  @ApiOperation({ summary: 'Get paginated student list' })
  @ApiOkResponse({ description: 'Student list fetched successfully' })
  findAll(@Query() query: StudentQueryDto) {
    return this.studentsService.findAll(query);
  }

  @Get(':id')
  @Permissions('students.read')
  @ApiOperation({ summary: 'Get student details' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Student details fetched successfully' })
  @ApiNotFoundResponse({ description: 'Student not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('students.update')
  @ApiOperation({ summary: 'Update student user' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateStudentDto })
  @ApiOkResponse({ description: 'Student updated successfully' })
  @ApiConflictResponse({ description: 'Email or phone already exists' })
  @ApiNotFoundResponse({ description: 'Student not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStudentDto,
  ) {
    return this.studentsService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('students.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete student user' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Student soft deleted successfully' })
  @ApiNotFoundResponse({ description: 'Student not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.remove(id);
  }
}
