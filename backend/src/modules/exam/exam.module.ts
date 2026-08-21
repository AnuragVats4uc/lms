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

@Module({
  imports: [PrismaModule],
  controllers: [
    ExamSubjectController,
    ExamQuestionController,
    ExamQuestionTypeController,
    ExamTemplateController,
    ExamController,
    ExamImportController,
  ],
  providers: [ExamService, ExamRepository],
  exports: [ExamService, ExamRepository],
})
export class ExamModule {}
