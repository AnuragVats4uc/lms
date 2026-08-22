import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma';
import {
  ExamController,
  ExamImportController,
  ExamQuestionController,
  ExamQuestionTypeController,
  ExamSubjectController,
  ExamTemplateController,
} from './controllers/exam.controller';
import { ExamService } from './services/exam.service';
import { ExamRepository } from './repositories/exam.repository';
import { StudentExamController } from './controllers/student-exam.controller';
import { StudentExamService } from './services/student-exam.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    ExamSubjectController,
    ExamQuestionController,
    ExamQuestionTypeController,
    ExamTemplateController,
    ExamController,
    ExamImportController,
    StudentExamController,
  ],
  providers: [ExamService, StudentExamService, ExamRepository],
  exports: [ExamService, ExamRepository],
})
export class ExamModule {}
