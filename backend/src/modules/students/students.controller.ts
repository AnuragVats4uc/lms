import { Controller, Get, UseGuards } from '@nestjs/common';
import { StudentsService } from './students.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentStudent } from '../auth/decorators/current-student.decorator';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  // 👇 Protected route (only logged-in users)
  @Get('me')
  getMe(@CurrentStudent() student: any) {
    return this.studentsService.findById(student.studentId);
  }

  // 👇 ADMIN ONLY ROUTE
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin-only')
  getAdminData() {
    return {
      message: 'Only admin can see this',
    };
  }
}
