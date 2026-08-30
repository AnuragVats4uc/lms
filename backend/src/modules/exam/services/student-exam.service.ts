import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import {
  ExamAttemptStatus,
  ExamNavigationMode,
  ExamResultReleaseMode,
  ExamStatus,
  ExamSubmissionReason,
  Prisma,
  ResourceStatus,
  StudentCourseEnrollmentStatus,
  StudentEnrollmentStatus,
  StudentStatus,
  StudentActivityEventType,
} from '@prisma/client';
import { createHash } from 'node:crypto';

import { CurrentUser } from '../../auth/types/current-user.types';
import { PrismaService } from '../../../prisma';
import { RESOURCE_TYPE_IDS } from '../../resource/constants/resource-type.constants';
import {
  SaveStudentExamAnswerDto,
  UpdateStudentExamProgressDto,
} from '../dto/student-exam.dto';
import { ExamRepository } from '../repositories/exam.repository';
import { QUESTION_TYPE_CODES } from '../constants/question-type.constants';
import { studentExamAnswerValidationError } from '../rules/student-exam-answer.rules';
import { studentExamNavigationError } from '../rules/student-exam-navigation.rules';
import {
  aggregateReportPerformance,
  attainableMaximumScoreByGroup,
  calculateReportOpportunity,
  classifyReportAnswer,
  examReportResultStatus,
  summarizeReportAnswers,
} from '../reporting/exam-report-metrics';
import { buildExamResultNotification } from '../../students/student-notification.rules';

const TERMINAL_STATUSES: ExamAttemptStatus[] = [
  ExamAttemptStatus.SUBMITTED,
  ExamAttemptStatus.AUTO_SUBMITTED,
  ExamAttemptStatus.EVALUATED,
  ExamAttemptStatus.CANCELLED,
];

const attemptInclude = Prisma.validator<Prisma.StudentExamAttemptInclude>()({
  exam: {
    include: {
      templateVersion: { include: { examTemplate: true } },
      courseAssignments: true,
      selectedSlots: {
        orderBy: { sortOrder: 'asc' },
        include: { templateSlot: true },
      },
    },
  },
  sourceResource: { include: { resourceType: true } },
  sessionCourse: { include: { course: true } },
  questions: {
    orderBy: { questionOrder: 'asc' },
    include: {
      slotAttempt: true,
      sectionAttempt: { include: { templateSection: true } },
      templateQuestion: {
        include: {
          sectionSubject: { include: { subject: true } },
          questionVersion: {
            include: {
              question: true,
              questionType: true,
              comprehension: true,
              topic: true,
              options: { orderBy: { sortOrder: 'asc' } },
              acceptedAnswers: { orderBy: { sortOrder: 'asc' } },
            },
          },
        },
      },
    },
  },
  slotProgress: {
    include: {
      selectedSlot: { include: { templateSlot: true } },
      sectionProgress: { include: { templateSection: true } },
    },
  },
  answers: { include: { selectedOptions: true } },
});

type LoadedAttempt = Prisma.StudentExamAttemptGetPayload<{
  include: typeof attemptInclude;
}>;

type AttemptTimeout = {
  scope: 'EXAM' | 'SLOT' | 'SECTION';
  scopeId: number | null;
  reason: ExamSubmissionReason;
  autoSubmitOnTimeout: boolean;
  message: string;
};

@Injectable()
export class StudentExamService {
  private readonly prisma: PrismaService;

  constructor(@Inject(ExamRepository) repository: ExamRepository) {
    this.prisma = repository.client;
  }

  async start(user: CurrentUser, resourceId: number) {
    const { student, resource } = await this.findAccessibleExamResource(
      user,
      resourceId,
    );
    const exam = resource.exam!;
    const now = new Date();
    const userActivitySessionId = await this.findActivitySessionId(
      user.activitySessionUuid,
      student.id,
    );
    this.ensureExamCanStart(exam, now);

    const active = exam.attempts.find(
      (attempt) => attempt.status === ExamAttemptStatus.IN_PROGRESS,
    );
    if (active) {
      if (active.expiresAt <= now && exam.autoSubmitOnTimeout) {
        await this.finishAttempt(
          active.uuid,
          student.id,
          ExamSubmissionReason.EXAM_TIMEOUT,
          true,
          userActivitySessionId,
        );
      } else if (exam.allowResume || active.expiresAt <= now) {
        await this.prisma.studentActivityEvent.create({
          data: {
            organizationId: exam.organizationId,
            studentId: student.id,
            userActivitySessionId,
            sessionCourseId: resource.folder.sessionCourseId,
            resourceId: resource.id,
            examAttemptId: active.id,
            eventType: StudentActivityEventType.EXAM_RESUME,
            occurredAt: now,
            resourceTitleSnapshot: resource.title,
            resourceTypeCodeSnapshot: 'EXAM',
          },
        });
        return {
          attemptId: active.id,
          attemptUuid: active.uuid,
          resumed: true,
        };
      } else {
        throw new ConflictException('This exam attempt cannot be resumed');
      }
    }

    const attemptsUsed = exam.attempts.length;
    if (attemptsUsed >= exam.attemptLimit) {
      throw new ConflictException('No exam attempts are remaining');
    }

    const attemptNumber =
      Math.max(0, ...exam.attempts.map((attempt) => attempt.attemptNumber)) + 1;
    const expiresAt = new Date(
      Math.min(
        exam.availableUntil.getTime(),
        now.getTime() + exam.durationMinutes * 60_000,
      ),
    );

    let created: { id: number; uuid: string };
    try {
      created = await this.prisma.$transaction(async (tx) => {
        const attempt = await tx.studentExamAttempt.create({
          data: {
            studentId: student.id,
            examId: exam.id,
            sessionCourseId: resource.folder.sessionCourseId,
            sourceResourceId: resource.id,
            attemptNumber,
            expiresAt,
            remainingSecondsAtLastSave: Math.max(
              0,
              Math.ceil((expiresAt.getTime() - now.getTime()) / 1000),
            ),
            lastSavedAt: now,
            configurationSnapshot: {
              examId: exam.id,
              templateVersionId: exam.examTemplateVersionId,
              durationMinutes: exam.durationMinutes,
              enforceSlotTimers: exam.templateVersion.enforceSlotTimers,
              enforceSectionTimers: exam.templateVersion.enforceSectionTimers,
              allowResume: exam.allowResume,
            },
          },
        });

        let questionOrder = 0;
        for (const [
          selectedSlotIndex,
          selectedSlot,
        ] of exam.selectedSlots.entries()) {
          const slot = selectedSlot.templateSlot;
          const slotStartsNow = selectedSlotIndex === 0;
          const slotExpiresAt =
            exam.templateVersion.enforceSlotTimers && slotStartsNow
              ? new Date(
                  Math.min(
                    expiresAt.getTime(),
                    now.getTime() +
                      (selectedSlot.durationMinutesOverride ??
                        slot.durationMinutes) *
                        60_000,
                  ),
                )
              : null;
          const slotAttempt = await tx.studentExamSlotAttempt.create({
            data: {
              studentExamAttemptId: attempt.id,
              examSelectedSlotId: selectedSlot.id,
              startedAt: slotStartsNow ? now : null,
              expiresAt: slotExpiresAt,
            },
          });

          for (const [sectionIndex, section] of slot.sections.entries()) {
            const sectionStartsNow = slotStartsNow && sectionIndex === 0;
            const sectionExpiresAt =
              exam.templateVersion.enforceSectionTimers && sectionStartsNow
                ? new Date(
                    Math.min(
                      expiresAt.getTime(),
                      now.getTime() + section.durationMinutes * 60_000,
                    ),
                  )
                : null;
            const sectionAttempt = await tx.studentExamSectionAttempt.create({
              data: {
                studentExamSlotAttemptId: slotAttempt.id,
                examTemplateSectionId: section.id,
                startedAt: sectionStartsNow ? now : null,
                expiresAt: sectionExpiresAt,
              },
            });
            const questions = section.subjects.flatMap(
              (subject) => subject.questions,
            );
            const orderedQuestions = section.randomizeQuestions
              ? this.stableShuffle(
                  questions,
                  `${attempt.uuid}:section:${section.id}`,
                )
              : questions;
            for (const templateQuestion of orderedQuestions) {
              questionOrder += 1;
              const options = templateQuestion.questionVersion.options;
              const optionIds = section.randomizeOptions
                ? this.stableShuffle(
                    options.map((option) => option.id),
                    `${attempt.uuid}:question:${templateQuestion.id}`,
                  )
                : options.map((option) => option.id);
              await tx.studentExamAttemptQuestion.create({
                data: {
                  studentExamAttemptId: attempt.id,
                  studentExamSlotAttemptId: slotAttempt.id,
                  studentExamSectionAttemptId: sectionAttempt.id,
                  examTemplateQuestionId: templateQuestion.id,
                  questionOrder,
                  optionOrder: optionIds,
                },
              });
            }
          }
        }
        await tx.studentActivityEvent.create({
          data: {
            clientEventId: `exam:${attempt.uuid}:start`,
            organizationId: exam.organizationId,
            studentId: student.id,
            userActivitySessionId,
            sessionCourseId: resource.folder.sessionCourseId,
            resourceId: resource.id,
            examAttemptId: attempt.id,
            eventType: StudentActivityEventType.EXAM_START,
            occurredAt: now,
            resourceTitleSnapshot: resource.title,
            resourceTypeCodeSnapshot: 'EXAM',
          },
        });
        return attempt;
      });
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== 'P2002'
      ) {
        throw error;
      }
      const concurrentAttempt = await this.prisma.studentExamAttempt.findFirst({
        where: {
          studentId: student.id,
          examId: exam.id,
          status: ExamAttemptStatus.IN_PROGRESS,
        },
        orderBy: { attemptNumber: 'desc' },
      });
      if (
        concurrentAttempt &&
        concurrentAttempt.expiresAt > new Date() &&
        exam.allowResume
      ) {
        return {
          attemptId: concurrentAttempt.id,
          attemptUuid: concurrentAttempt.uuid,
          resumed: true,
        };
      }
      throw new ConflictException(
        'Another exam attempt was created at the same time. Refresh to continue.',
      );
    }

    return { attemptId: created.id, attemptUuid: created.uuid, resumed: false };
  }

  async getAttempt(user: CurrentUser, attemptId: number, attemptUuid: string) {
    const { student, attempt } = await this.findOwnedAttempt(
      user,
      attemptId,
      attemptUuid,
    );
    const synchronized = await this.synchronizeExpiredScopes(
      attempt,
      student.id,
      user.activitySessionUuid,
    );
    const current = synchronized.attempt;
    if (current.status !== ExamAttemptStatus.IN_PROGRESS) {
      return {
        attemptId: current.id,
        attemptUuid: current.uuid,
        status: current.status,
        submitted: true,
        reportAvailable: this.isResultReleased(current.exam, new Date()),
      };
    }
    return this.toAttemptResponse(current, synchronized.pendingTimeout);
  }

  async saveAnswer(
    user: CurrentUser,
    attemptId: number,
    attemptUuid: string,
    attemptQuestionId: number,
    dto: SaveStudentExamAnswerDto,
  ) {
    const { student, attempt } = await this.findOwnedAttempt(
      user,
      attemptId,
      attemptUuid,
    );
    const synchronized = await this.synchronizeExpiredScopes(
      attempt,
      student.id,
      user.activitySessionUuid,
    );
    if (synchronized.pendingTimeout) {
      throw new ConflictException(synchronized.pendingTimeout.message);
    }
    const current = synchronized.attempt;
    this.ensureAttemptActive(current);
    const attemptQuestion = current.questions.find(
      (question) => question.id === attemptQuestionId,
    );
    if (!attemptQuestion) throw new NotFoundException('Question not found');
    this.ensureQuestionNavigationAllowed(current, attemptQuestion.id);
    await this.activateQuestionScope(current, attemptQuestion);

    const version = attemptQuestion.templateQuestion.questionVersion;
    const typeCode = version.questionType.code;
    const selectedOptionIds = dto.selectedOptionIds ?? [];
    const validOptionIds = new Set(version.options.map((option) => option.id));
    if (selectedOptionIds.some((id) => !validOptionIds.has(id))) {
      throw new BadRequestException('A selected option is invalid');
    }
    const answerValidationError = studentExamAnswerValidationError(typeCode, {
      selectedOptionIds,
      textAnswer: dto.textAnswer,
      numericAnswer: dto.numericAnswer,
    });
    if (answerValidationError) {
      throw new BadRequestException(answerValidationError);
    }
    if (
      dto.markedForReview === true &&
      !attemptQuestion.sectionAttempt.templateSection.allowReview
    ) {
      throw new BadRequestException(
        'Mark for review is not allowed in this section',
      );
    }
    if (
      version.maxAnswerLength &&
      dto.textAnswer &&
      dto.textAnswer.length > version.maxAnswerLength
    ) {
      throw new BadRequestException(
        `Answer must be at most ${version.maxAnswerLength} characters`,
      );
    }

    const hasAnswer =
      selectedOptionIds.length > 0 ||
      (dto.numericAnswer !== null && dto.numericAnswer !== undefined) ||
      Boolean(dto.textAnswer?.trim());
    this.enforceSectionAttemptLimit(current, attemptQuestion, hasAnswer);

    await this.prisma.$transaction(async (tx) => {
      const activeAttempt = await tx.studentExamAttempt.updateMany({
        where: { id: current.id, status: ExamAttemptStatus.IN_PROGRESS },
        data: this.heartbeat(current),
      });
      if (!activeAttempt.count) {
        throw new ConflictException('This exam attempt is no longer active');
      }
      const answer = await tx.studentExamAnswer.upsert({
        where: {
          studentExamAttemptId_examTemplateQuestionId: {
            studentExamAttemptId: current.id,
            examTemplateQuestionId: attemptQuestion.examTemplateQuestionId,
          },
        },
        create: {
          studentExamAttemptId: current.id,
          examTemplateQuestionId: attemptQuestion.examTemplateQuestionId,
          textAnswer: dto.textAnswer?.trim() || null,
          numericAnswer:
            dto.numericAnswer === null || dto.numericAnswer === undefined
              ? null
              : dto.numericAnswer,
          answeredAt: hasAnswer ? new Date() : null,
        },
        update: {
          textAnswer: dto.textAnswer?.trim() || null,
          numericAnswer:
            dto.numericAnswer === null || dto.numericAnswer === undefined
              ? null
              : dto.numericAnswer,
          answeredAt: hasAnswer ? new Date() : null,
          isCorrect: null,
          marksAwarded: null,
        },
      });
      await tx.studentExamAnswerOption.deleteMany({
        where: { studentExamAnswerId: answer.id },
      });
      if (selectedOptionIds.length) {
        await tx.studentExamAnswerOption.createMany({
          data: selectedOptionIds.map((questionOptionId) => ({
            studentExamAnswerId: answer.id,
            questionOptionId,
          })),
        });
      }
      await tx.studentExamAttemptQuestion.update({
        where: { id: attemptQuestion.id },
        data: {
          markedForReview:
            dto.markedForReview ?? attemptQuestion.markedForReview,
          visitedAt: attemptQuestion.visitedAt ?? new Date(),
          lastViewedAt: new Date(),
          timeSpentSeconds: {
            increment: dto.timeSpentSeconds ?? 0,
          },
        },
      });
    });
    return { saved: true, savedAt: new Date() };
  }

  async updateProgress(
    user: CurrentUser,
    attemptId: number,
    attemptUuid: string,
    dto: UpdateStudentExamProgressDto,
  ) {
    const { student, attempt } = await this.findOwnedAttempt(
      user,
      attemptId,
      attemptUuid,
    );
    const synchronized = await this.synchronizeExpiredScopes(
      attempt,
      student.id,
      user.activitySessionUuid,
    );
    if (synchronized.pendingTimeout) {
      throw new ConflictException(synchronized.pendingTimeout.message);
    }
    const current = synchronized.attempt;
    this.ensureAttemptActive(current);
    const question = current.questions.find(
      (item) => item.id === dto.attemptQuestionId,
    );
    if (!question) throw new NotFoundException('Question not found');
    this.ensureQuestionNavigationAllowed(current, question.id);
    await this.activateQuestionScope(current, question);
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      const activeAttempt = await tx.studentExamAttempt.updateMany({
        where: { id: current.id, status: ExamAttemptStatus.IN_PROGRESS },
        data: this.heartbeat(current),
      });
      if (!activeAttempt.count) {
        throw new ConflictException('This exam attempt is no longer active');
      }
      await tx.studentExamAttemptQuestion.update({
        where: { id: question.id },
        data: {
          visitedAt: question.visitedAt ?? now,
          lastViewedAt: now,
          timeSpentSeconds: { increment: dto.timeSpentSeconds ?? 0 },
        },
      });
    });
    return { saved: true, savedAt: now };
  }

  async submit(user: CurrentUser, attemptId: number, attemptUuid: string) {
    const { student, attempt } = await this.findOwnedAttempt(
      user,
      attemptId,
      attemptUuid,
    );
    const synchronized = await this.synchronizeExpiredScopes(
      attempt,
      student.id,
      user.activitySessionUuid,
    );
    const current = synchronized.attempt;
    if (TERMINAL_STATUSES.includes(current.status)) {
      return this.toSubmissionResponse(current);
    }
    return this.finishAttempt(
      current.uuid,
      student.id,
      synchronized.pendingTimeout?.reason ??
        ExamSubmissionReason.STUDENT_SUBMITTED,
      false,
      await this.findActivitySessionId(user.activitySessionUuid, student.id),
    );
  }

  async continueAfterTimeout(
    user: CurrentUser,
    attemptId: number,
    attemptUuid: string,
  ) {
    const { student, attempt } = await this.findOwnedAttempt(
      user,
      attemptId,
      attemptUuid,
    );
    const synchronized = await this.synchronizeExpiredScopes(
      attempt,
      student.id,
      user.activitySessionUuid,
      true,
    );
    const current = synchronized.attempt;
    if (current.status !== ExamAttemptStatus.IN_PROGRESS) {
      return {
        attemptId: current.id,
        attemptUuid: current.uuid,
        status: current.status,
        submitted: true,
        reportAvailable: this.isResultReleased(current.exam, new Date()),
      };
    }
    return this.toAttemptResponse(current, synchronized.pendingTimeout);
  }

  async getReport(user: CurrentUser, attemptId: number, attemptUuid: string) {
    const { student, attempt } = await this.findOwnedAttempt(
      user,
      attemptId,
      attemptUuid,
    );
    const synchronized = await this.synchronizeExpiredScopes(
      attempt,
      student.id,
      user.activitySessionUuid,
    );
    const current = synchronized.attempt;
    if (current.status === ExamAttemptStatus.IN_PROGRESS) {
      throw new ConflictException('Submit the exam before opening its report');
    }
    if (!this.isResultReleased(current.exam, new Date())) {
      return {
        attemptId: current.id,
        attemptUuid: current.uuid,
        status: current.status,
        released: false,
        message: 'Your result has not been released yet.',
      };
    }

    const answerByQuestion = new Map<number, LoadedAttempt['answers'][number]>(
      current.answers.map((answer) => [answer.examTemplateQuestionId, answer]),
    );
    const summary = summarizeReportAnswers(
      current.questions.length,
      current.questions.map(
        (question) =>
          answerByQuestion.get(question.examTemplateQuestionId) ?? null,
      ),
    );
    const metricItems = current.questions.map((question) => {
      const templateQuestion = question.templateQuestion;
      const version = templateQuestion.questionVersion;
      const subject = templateQuestion.sectionSubject.subject;
      const section = question.sectionAttempt.templateSection;
      const answer =
        answerByQuestion.get(question.examTemplateQuestionId) ?? null;
      return {
        question,
        answer,
        subject,
        section,
        topic: version.topic,
        difficulty: version.difficulty,
        marksAwarded: Number(answer?.marksAwarded ?? 0),
        maximumMarks: Number(templateQuestion.marks),
        timeSpentSeconds: question.timeSpentSeconds,
      };
    });
    const sectionPerformance = aggregateReportPerformance(
      metricItems.map((item) => ({
        groupKey: `section:${item.section.id}`,
        groupLabel: item.section.name,
        metadata: {
          sectionId: item.section.id,
          sectionCode: item.section.code,
        },
        marksAwarded: item.marksAwarded,
        maximumMarks: item.maximumMarks,
        timeSpentSeconds: item.timeSpentSeconds,
        answer: item.answer,
      })),
    );
    const sectionMaximumScores = attainableMaximumScoreByGroup(
      metricItems.map((item) => ({
        groupKey: `section:${item.section.id}`,
        marks: item.maximumMarks,
        questionsToAttempt: item.section.questionsToAttempt,
      })),
    );
    const attainableSectionPerformance = sectionPerformance.map((section) => {
      const maximumMarks = sectionMaximumScores.get(section.key) ?? 0;
      return {
        ...section,
        maximumMarks,
        percentage: maximumMarks
          ? Math.round((section.marksAwarded / maximumMarks) * 10_000) / 100
          : 0,
      };
    });
    const subjectPerformance = aggregateReportPerformance(
      metricItems.map((item) => ({
        groupKey: `subject:${item.subject.id}`,
        groupLabel: item.subject.name,
        metadata: {
          subjectId: item.subject.id,
          subjectCode: item.subject.code,
        },
        marksAwarded: item.marksAwarded,
        maximumMarks: item.maximumMarks,
        timeSpentSeconds: item.timeSpentSeconds,
        answer: item.answer,
      })),
    );
    const topicPerformance = aggregateReportPerformance(
      metricItems.map((item) => ({
        groupKey: item.topic
          ? `topic:${item.topic.id}`
          : `subject:${item.subject.id}:uncategorized`,
        groupLabel: item.topic?.name ?? 'Uncategorized',
        metadata: {
          topicId: item.topic?.id ?? null,
          topicCode: item.topic?.code ?? null,
          subjectId: item.subject.id,
          subjectName: item.subject.name,
        },
        marksAwarded: item.marksAwarded,
        maximumMarks: item.maximumMarks,
        timeSpentSeconds: item.timeSpentSeconds,
        answer: item.answer,
      })),
    ).map((topic) => ({
      ...topic,
      classification:
        topic.attempted === 0
          ? 'NOT_ATTEMPTED'
          : topic.total < 3
            ? 'LIMITED_DATA'
            : topic.accuracy >= 75
              ? 'STRONG'
              : topic.accuracy < 50
                ? 'WEAK'
                : 'DEVELOPING',
    }));
    const difficultyPerformance = aggregateReportPerformance(
      metricItems.map((item) => ({
        groupKey: `difficulty:${item.difficulty}`,
        groupLabel:
          item.difficulty.charAt(0) + item.difficulty.slice(1).toLowerCase(),
        metadata: { difficulty: item.difficulty },
        marksAwarded: item.marksAwarded,
        maximumMarks: item.maximumMarks,
        timeSpentSeconds: item.timeSpentSeconds,
        answer: item.answer,
      })),
    );
    const questionTypePerformance = aggregateReportPerformance(
      metricItems.map((item) => ({
        groupKey: `question-type:${item.question.templateQuestion.questionVersion.questionType.id}`,
        groupLabel:
          item.question.templateQuestion.questionVersion.questionType.name,
        metadata: {
          questionTypeId:
            item.question.templateQuestion.questionVersion.questionType.id,
          questionTypeCode:
            item.question.templateQuestion.questionVersion.questionType.code,
        },
        marksAwarded: item.marksAwarded,
        maximumMarks: item.maximumMarks,
        timeSpentSeconds: item.timeSpentSeconds,
        answer: item.answer,
      })),
    );
    const [ranking, trend] = await Promise.all([
      current.exam.showScore ? this.reportRanking(current) : null,
      current.exam.showScore ? this.reportTrend(current) : [],
    ]);
    const trackedQuestionSeconds = metricItems.reduce(
      (total, item) => total + item.timeSpentSeconds,
      0,
    );
    const totalDurationSeconds = current.durationSeconds;
    const averageTimePerQuestion = current.questions.length
      ? Math.round((totalDurationSeconds / current.questions.length) * 100) /
        100
      : 0;
    const averageTimePerAttemptedQuestion = summary.attempted
      ? Math.round((totalDurationSeconds / summary.attempted) * 100) / 100
      : 0;
    const response: Record<string, unknown> = {
      attemptId: current.id,
      attemptUuid: current.uuid,
      status: current.status,
      released: true,
      title: current.exam.title,
      attemptNumber: current.attemptNumber,
      startedAt: current.startedAt,
      submittedAt: current.submittedAt,
      evaluatedAt: current.evaluatedAt,
      submissionReason: current.submissionReason,
      durationSeconds: current.durationSeconds,
      calculationVersion: current.calculationVersion,
      summary,
      performance: {
        sections: attainableSectionPerformance,
        subjects: subjectPerformance,
        topics: topicPerformance,
        difficulties: difficultyPerformance,
        questionTypes: questionTypePerformance,
      },
      timeAnalysis: {
        totalSeconds: totalDurationSeconds,
        trackedQuestionSeconds,
        untrackedSeconds: Math.max(
          0,
          totalDurationSeconds - trackedQuestionSeconds,
        ),
        averageTimePerQuestion,
        averageTimePerAttemptedQuestion,
        isApproximate: true,
        source: 'QUESTION_HEARTBEATS',
      },
    };
    if (current.exam.showScore) {
      response.score = Number(current.score ?? 0);
      response.maximumScore = Number(current.maximumScore ?? 0);
      response.percentage = Number(current.maximumScore ?? 0)
        ? Math.round(
            (Number(current.score ?? 0) / Number(current.maximumScore)) * 10000,
          ) / 100
        : 0;
      response.rank = ranking?.rank ?? null;
      response.percentile = ranking?.percentile ?? null;
      response.cohortSize = ranking?.cohortSize ?? 0;
      response.rankBasis = ranking?.basis ?? 'UNAVAILABLE';
      response.trend = trend;
      const passingPercentage =
        current.exam.passingPercentage === null
          ? null
          : Number(current.exam.passingPercentage);
      response.result = {
        status: examReportResultStatus(
          Number(response.percentage),
          passingPercentage,
        ),
        passingPercentage,
      };
      response.opportunity = calculateReportOpportunity(
        metricItems.map((item) => ({
          answer: item.answer,
          marksAwarded: item.marksAwarded,
          maximumMarks: item.maximumMarks,
        })),
        Number(current.score ?? 0),
        Number(current.maximumScore ?? 0),
        passingPercentage,
      );
    }
    if (current.exam.showQuestionReview) {
      response.questions = current.questions.map((question) => {
        const version = question.templateQuestion.questionVersion;
        const answer = answerByQuestion.get(question.examTemplateQuestionId);
        const selectedOptionIds = new Set(
          answer?.selectedOptions.map((item) => item.questionOptionId) ?? [],
        );
        const selectedOptions = version.options
          .filter((option) => selectedOptionIds.has(option.id))
          .map((option) => ({
            id: option.id,
            code: option.code,
            content: option.content,
          }));
        const correctOptions = version.options
          .filter((option) => option.isCorrect)
          .map((option) => ({
            id: option.id,
            code: option.code,
            content: option.content,
          }));
        return {
          id: question.id,
          order: question.questionOrder,
          code: version.question.code,
          subject: {
            id: question.templateQuestion.sectionSubject.subject.id,
            name: question.templateQuestion.sectionSubject.subject.name,
          },
          topic: version.topic
            ? { id: version.topic.id, name: version.topic.name }
            : null,
          section: {
            id: question.sectionAttempt.templateSection.id,
            name: question.sectionAttempt.templateSection.name,
          },
          content: version.content,
          comprehension: version.comprehension
            ? {
                id: version.comprehension.id,
                code: version.comprehension.code,
                content: version.comprehension.content,
              }
            : null,
          questionType: {
            id: version.questionType.id,
            code: version.questionType.code,
            name: version.questionType.name,
          },
          difficulty: version.difficulty,
          explanation: current.exam.showExplanations
            ? version.explanation
            : undefined,
          isCorrect: answer?.isCorrect ?? null,
          answerState: classifyReportAnswer(answer ?? null),
          marksAwarded: Number(answer?.marksAwarded ?? 0),
          maximumMarks: Number(question.templateQuestion.marks),
          negativeMarks: Number(question.templateQuestion.negativeMarks),
          timeSpentSeconds: question.timeSpentSeconds,
          markedForReview: question.markedForReview,
          visitedAt: question.visitedAt,
          lastViewedAt: question.lastViewedAt,
          studentAnswer: {
            optionIds: [...selectedOptionIds],
            options: selectedOptions,
            text: answer?.textAnswer ?? null,
            numeric:
              answer?.numericAnswer === null ||
              answer?.numericAnswer === undefined
                ? null
                : Number(answer.numericAnswer),
          },
          correctAnswer: current.exam.showCorrectAnswers
            ? {
                optionIds: correctOptions.map((option) => option.id),
                options: correctOptions,
                acceptedAnswers: version.acceptedAnswers
                  .map((item) =>
                    item.numericValue === null
                      ? item.textValue
                      : String(item.numericValue),
                  )
                  .filter((value): value is string => value !== null),
              }
            : undefined,
        };
      });
    }
    return response;
  }

  private async reportRanking(attempt: LoadedAttempt) {
    const rows = await this.prisma.studentExamAttempt.findMany({
      where: {
        examId: attempt.examId,
        sessionCourseId: attempt.sessionCourseId ?? undefined,
        status: {
          in: [
            ExamAttemptStatus.SUBMITTED,
            ExamAttemptStatus.AUTO_SUBMITTED,
            ExamAttemptStatus.EVALUATED,
          ],
        },
        score: { not: null },
      },
      select: { studentId: true, score: true },
    });
    const scoreByStudent = new Map<number, number>();
    for (const row of rows) {
      const score = Number(row.score ?? 0);
      scoreByStudent.set(
        row.studentId,
        Math.max(score, scoreByStudent.get(row.studentId) ?? -Infinity),
      );
    }
    scoreByStudent.set(attempt.studentId, Number(attempt.score ?? 0));
    const scores = [...scoreByStudent.values()];
    const currentScore = Number(attempt.score ?? 0);
    const rank = 1 + scores.filter((score) => score > currentScore).length;
    const cohortSize = scores.length;
    const percentile =
      cohortSize <= 1
        ? 100
        : Math.round(((cohortSize - rank) / (cohortSize - 1)) * 10_000) / 100;
    return {
      rank,
      percentile,
      cohortSize,
      basis: attempt.sessionCourseId
        ? 'COURSE_BEST_ATTEMPT_PER_STUDENT'
        : 'EXAM_BEST_ATTEMPT_PER_STUDENT',
    };
  }

  private async reportTrend(attempt: LoadedAttempt) {
    const rows = await this.prisma.studentExamAttempt.findMany({
      where: {
        studentId: attempt.studentId,
        sessionCourseId: attempt.sessionCourseId ?? undefined,
        exam: attempt.sessionCourseId
          ? undefined
          : { organizationId: attempt.exam.organizationId },
        status: {
          in: [
            ExamAttemptStatus.SUBMITTED,
            ExamAttemptStatus.AUTO_SUBMITTED,
            ExamAttemptStatus.EVALUATED,
          ],
        },
        score: { not: null },
        submittedAt: attempt.submittedAt
          ? { not: null, lte: attempt.submittedAt }
          : { not: null },
      },
      orderBy: { submittedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        uuid: true,
        attemptNumber: true,
        submittedAt: true,
        score: true,
        maximumScore: true,
        exam: { select: { id: true, code: true, title: true } },
      },
    });
    return rows.reverse().map((row) => {
      const score = Number(row.score ?? 0);
      const maximumScore = Number(row.maximumScore ?? 0);
      return {
        attemptId: row.id,
        attemptUuid: row.uuid,
        attemptNumber: row.attemptNumber,
        submittedAt: row.submittedAt,
        exam: row.exam,
        score,
        maximumScore,
        percentage: maximumScore
          ? Math.round((score / maximumScore) * 10_000) / 100
          : 0,
      };
    });
  }

  private async findAccessibleExamResource(
    user: CurrentUser,
    resourceId: number,
  ) {
    this.ensureStudentRole(user);
    const student = await this.prisma.student.findFirst({
      where: {
        userId: user.userId,
        status: StudentStatus.ACTIVE,
        isActive: true,
      },
    });
    if (!student) throw new NotFoundException('Student not found');
    const resource = await this.prisma.resource.findFirst({
      where: {
        id: resourceId,
        resourceTypeId: RESOURCE_TYPE_IDS.EXAM,
        status: ResourceStatus.PUBLISHED,
        isPublished: true,
        isActive: true,
        folder: {
          parentFolderId: null,
          isActive: true,
          sessionCourse: {
            session: { organizationId: student.organizationId ?? -1 },
            studentCourseEnrollments: {
              some: {
                status: StudentCourseEnrollmentStatus.ACTIVE,
                isActive: true,
                enrollment: {
                  studentId: student.id,
                  organizationId: student.organizationId ?? -1,
                  status: StudentEnrollmentStatus.ACTIVE,
                  isActive: true,
                },
              },
            },
          },
        },
      },
      include: {
        folder: true,
        exam: {
          include: {
            attempts: {
              where: { studentId: student.id },
              orderBy: { attemptNumber: 'desc' },
            },
            courseAssignments: true,
            templateVersion: true,
            selectedSlots: {
              orderBy: { sortOrder: 'asc' },
              include: {
                templateSlot: {
                  include: {
                    sections: {
                      where: { isActive: true },
                      orderBy: { sortOrder: 'asc' },
                      include: {
                        subjects: {
                          orderBy: { sortOrder: 'asc' },
                          include: {
                            questions: {
                              orderBy: { sortOrder: 'asc' },
                              include: {
                                questionVersion: {
                                  include: {
                                    options: { orderBy: { sortOrder: 'asc' } },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!resource?.exam) throw new NotFoundException('Exam not found');
    if (
      !resource.exam.courseAssignments.some(
        (assignment) =>
          assignment.sessionCourseId === resource.folder.sessionCourseId,
      )
    ) {
      throw new ForbiddenException(
        'Exam is not assigned to this enrolled course',
      );
    }
    return { resource, student };
  }

  private async findOwnedAttempt(
    user: CurrentUser,
    attemptId: number,
    attemptUuid: string,
  ) {
    this.ensureStudentRole(user);
    const student = await this.prisma.student.findFirst({
      where: {
        userId: user.userId,
        status: StudentStatus.ACTIVE,
        isActive: true,
      },
    });
    if (!student) throw new NotFoundException('Student not found');
    const attempt = await this.prisma.studentExamAttempt.findFirst({
      where: {
        id: attemptId,
        uuid: attemptUuid,
        studentId: student.id,
        exam: {
          organizationId: student.organizationId ?? -1,
          courseAssignments: {
            some: {
              sessionCourse: {
                studentCourseEnrollments: {
                  some: {
                    status: StudentCourseEnrollmentStatus.ACTIVE,
                    isActive: true,
                    enrollment: {
                      studentId: student.id,
                      organizationId: student.organizationId ?? -1,
                      status: StudentEnrollmentStatus.ACTIVE,
                      isActive: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      include: attemptInclude,
    });
    if (!attempt) throw new NotFoundException('Exam attempt not found');
    return { student, attempt };
  }

  private ensureStudentRole(user: CurrentUser) {
    if (!user.roles?.includes('STUDENT')) {
      throw new ForbiddenException('Student exam access is required');
    }
  }

  private ensureExamCanStart(
    exam: {
      status: ExamStatus;
      availableFrom: Date;
      availableUntil: Date;
    },
    now: Date,
  ) {
    if (
      exam.status !== ExamStatus.SCHEDULED &&
      exam.status !== ExamStatus.LIVE
    ) {
      throw new ConflictException('This exam is not open for attempts');
    }
    if (now < exam.availableFrom) {
      throw new ConflictException('This exam is not available yet');
    }
    if (now >= exam.availableUntil) {
      throw new ConflictException('This exam has closed');
    }
  }

  private ensureAttemptActive(attempt: LoadedAttempt) {
    if (attempt.status !== ExamAttemptStatus.IN_PROGRESS) {
      throw new ConflictException('This exam attempt is no longer active');
    }
  }

  private ensureQuestionNavigationAllowed(
    attempt: LoadedAttempt,
    targetQuestionId: number,
  ) {
    const navigationError = studentExamNavigationError(
      attempt.questions.map((question) => ({
        id: question.id,
        order: question.questionOrder,
        slotAttemptId: question.studentExamSlotAttemptId,
        sectionAttemptId: question.studentExamSectionAttemptId,
        slotNavigationMode:
          attempt.slotProgress.find(
            (slot) => slot.id === question.studentExamSlotAttemptId,
          )?.selectedSlot.templateSlot.navigationMode ?? 'FREE',
        sectionNavigationMode:
          question.sectionAttempt.templateSection.navigationMode,
        visitedAt: question.visitedAt,
        lastViewedAt: question.lastViewedAt,
      })),
      targetQuestionId,
    );
    if (navigationError) throw new ConflictException(navigationError);
  }

  private async synchronizeExpiredScopes(
    attempt: LoadedAttempt,
    studentId: number,
    activitySessionUuid?: string,
    forcePendingTimeout = false,
  ) {
    let current = attempt;
    let force = forcePendingTimeout;
    const activitySessionId = await this.findActivitySessionId(
      activitySessionUuid,
      studentId,
    );
    const maximumTransitions =
      current.slotProgress.length +
      current.slotProgress.reduce(
        (total, slot) => total + slot.sectionProgress.length,
        0,
      ) +
      1;

    for (let transition = 0; transition < maximumTransitions; transition += 1) {
      if (current.status !== ExamAttemptStatus.IN_PROGRESS) {
        return { attempt: current, pendingTimeout: null };
      }
      const timeout = this.detectAttemptTimeout(current, new Date());
      if (!timeout) return { attempt: current, pendingTimeout: null };
      if (!timeout.autoSubmitOnTimeout && !force) {
        return { attempt: current, pendingTimeout: timeout };
      }
      current = await this.resolveAttemptTimeout(
        current,
        studentId,
        timeout,
        timeout.autoSubmitOnTimeout,
        activitySessionId,
      );
      force = false;
    }

    return {
      attempt: current,
      pendingTimeout: this.detectAttemptTimeout(current, new Date()),
    };
  }

  private detectAttemptTimeout(attempt: LoadedAttempt, now: Date) {
    if (
      attempt.status === ExamAttemptStatus.IN_PROGRESS &&
      attempt.expiresAt <= now
    ) {
      return {
        scope: 'EXAM',
        scopeId: null,
        reason: ExamSubmissionReason.EXAM_TIMEOUT,
        autoSubmitOnTimeout: attempt.exam.autoSubmitOnTimeout,
        message: 'The exam timer has expired. Submit the exam to continue.',
      } satisfies AttemptTimeout;
    }

    const expiredSlot = attempt.slotProgress.find(
      (slot) =>
        slot.status === ExamAttemptStatus.IN_PROGRESS &&
        slot.expiresAt !== null &&
        slot.expiresAt <= now,
    );
    if (expiredSlot) {
      return {
        scope: 'SLOT',
        scopeId: expiredSlot.id,
        reason: ExamSubmissionReason.SLOT_TIMEOUT,
        autoSubmitOnTimeout:
          expiredSlot.selectedSlot.templateSlot.autoSubmitOnTimeout,
        message: `Time has expired for ${expiredSlot.selectedSlot.templateSlot.name}. Continue to the next available question.`,
      } satisfies AttemptTimeout;
    }

    for (const slot of attempt.slotProgress) {
      const expiredSection = slot.sectionProgress.find(
        (section) =>
          section.status === ExamAttemptStatus.IN_PROGRESS &&
          section.expiresAt !== null &&
          section.expiresAt <= now,
      );
      if (expiredSection) {
        return {
          scope: 'SECTION',
          scopeId: expiredSection.id,
          reason: ExamSubmissionReason.SECTION_TIMEOUT,
          autoSubmitOnTimeout:
            expiredSection.templateSection.autoSubmitOnTimeout,
          message: `Time has expired for ${expiredSection.templateSection.name}. Continue to the next available question.`,
        } satisfies AttemptTimeout;
      }
    }
    return null;
  }

  private async resolveAttemptTimeout(
    attempt: LoadedAttempt,
    studentId: number,
    timeout: AttemptTimeout,
    automatic: boolean,
    userActivitySessionId?: number | null,
  ) {
    if (timeout.scope === 'EXAM') {
      await this.finishAttempt(
        attempt.uuid,
        studentId,
        timeout.reason,
        automatic,
        userActivitySessionId,
      );
      return this.reloadAttempt(attempt.uuid);
    }

    const now = new Date();
    const scopeStatus = automatic
      ? ExamAttemptStatus.AUTO_SUBMITTED
      : ExamAttemptStatus.SUBMITTED;
    await this.prisma.$transaction(async (tx) => {
      const activeAttempt = await tx.studentExamAttempt.updateMany({
        where: { id: attempt.id, status: ExamAttemptStatus.IN_PROGRESS },
        data: this.heartbeat(attempt),
      });
      if (!activeAttempt.count) return;

      if (timeout.scope === 'SLOT') {
        await tx.studentExamSlotAttempt.updateMany({
          where: {
            id: timeout.scopeId ?? -1,
            studentExamAttemptId: attempt.id,
            status: ExamAttemptStatus.IN_PROGRESS,
            expiresAt: { lte: now },
          },
          data: {
            status: scopeStatus,
            submittedAt: now,
            completionReason: timeout.reason,
          },
        });
        await tx.studentExamSectionAttempt.updateMany({
          where: {
            studentExamSlotAttemptId: timeout.scopeId ?? -1,
            submittedAt: null,
          },
          data: {
            status: scopeStatus,
            submittedAt: now,
            completionReason: timeout.reason,
          },
        });
        return;
      }

      await tx.studentExamSectionAttempt.updateMany({
        where: {
          id: timeout.scopeId ?? -1,
          status: ExamAttemptStatus.IN_PROGRESS,
          expiresAt: { lte: now },
        },
        data: {
          status: scopeStatus,
          submittedAt: now,
          completionReason: timeout.reason,
        },
      });
      const section = attempt.slotProgress
        .flatMap((slot) => slot.sectionProgress)
        .find((item) => item.id === timeout.scopeId);
      if (!section) return;
      const remainingSections = await tx.studentExamSectionAttempt.count({
        where: {
          studentExamSlotAttemptId: section.studentExamSlotAttemptId,
          submittedAt: null,
        },
      });
      if (!remainingSections) {
        await tx.studentExamSlotAttempt.update({
          where: { id: section.studentExamSlotAttemptId },
          data: {
            status: scopeStatus,
            submittedAt: now,
            completionReason: timeout.reason,
          },
        });
      }
    });

    let reloaded = await this.reloadAttempt(attempt.uuid);
    const nextQuestion = this.findAvailableQuestion(reloaded);
    if (!nextQuestion) {
      await this.finishAttempt(
        reloaded.uuid,
        studentId,
        timeout.reason,
        automatic,
        userActivitySessionId,
      );
      return this.reloadAttempt(attempt.uuid);
    }
    await this.activateQuestionScope(reloaded, nextQuestion);
    reloaded = await this.reloadAttempt(attempt.uuid);
    return reloaded;
  }

  private findAvailableQuestion(attempt: LoadedAttempt) {
    const openSlotIds = new Set(
      attempt.slotProgress
        .filter((slot) => !slot.submittedAt)
        .map((slot) => slot.id),
    );
    const openSectionIds = new Set(
      attempt.slotProgress.flatMap((slot) =>
        slot.sectionProgress
          .filter((section) => !section.submittedAt)
          .map((section) => section.id),
      ),
    );
    const available = attempt.questions.filter(
      (question) =>
        openSlotIds.has(question.studentExamSlotAttemptId) &&
        openSectionIds.has(question.studentExamSectionAttemptId),
    );
    return (
      [...available]
        .filter((question) => question.lastViewedAt || question.visitedAt)
        .sort(
          (left, right) =>
            Math.max(
              right.lastViewedAt?.getTime() ?? 0,
              right.visitedAt?.getTime() ?? 0,
            ) -
            Math.max(
              left.lastViewedAt?.getTime() ?? 0,
              left.visitedAt?.getTime() ?? 0,
            ),
        )[0] ??
      [...available].sort(
        (left, right) => left.questionOrder - right.questionOrder,
      )[0]
    );
  }

  private async reloadAttempt(attemptUuid: string) {
    const reloaded = await this.prisma.studentExamAttempt.findUnique({
      where: { uuid: attemptUuid },
      include: attemptInclude,
    });
    if (!reloaded) throw new NotFoundException('Exam attempt not found');
    return reloaded;
  }

  private async finishAttempt(
    attemptUuid: string,
    studentId: number,
    reason: ExamSubmissionReason,
    automatic: boolean,
    userActivitySessionId?: number | null,
  ) {
    const attempt = await this.prisma.studentExamAttempt.findFirst({
      where: { uuid: attemptUuid, studentId },
      include: attemptInclude,
    });
    if (!attempt) throw new NotFoundException('Exam attempt not found');
    if (TERMINAL_STATUSES.includes(attempt.status)) {
      return this.toSubmissionResponse(attempt);
    }
    const now = new Date();
    const status = automatic
      ? ExamAttemptStatus.AUTO_SUBMITTED
      : ExamAttemptStatus.EVALUATED;
    const result = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.studentExamAttempt.updateMany({
        where: { id: attempt.id, status: ExamAttemptStatus.IN_PROGRESS },
        data: { status },
      });
      if (!claimed.count) return null;

      const current = await tx.studentExamAttempt.findUnique({
        where: { id: attempt.id },
        include: attemptInclude,
      });
      if (!current) throw new NotFoundException('Exam attempt not found');

      const answerByQuestion = new Map<
        number,
        LoadedAttempt['answers'][number]
      >(
        current.answers.map((answer) => [
          answer.examTemplateQuestionId,
          answer,
        ]),
      );
      let score = 0;
      const maximumScores = attainableMaximumScoreByGroup(
        current.questions.map((question) => ({
          groupKey: `section:${question.studentExamSectionAttemptId}`,
          marks: Number(question.templateQuestion.marks),
          questionsToAttempt:
            question.sectionAttempt.templateSection.questionsToAttempt,
        })),
      );
      const maximumScore = [...maximumScores.values()].reduce(
        (total, value) => total + value,
        0,
      );
      const evaluated = current.questions.map((question) => {
        const templateQuestion = question.templateQuestion;
        const version = templateQuestion.questionVersion;
        const answer = answerByQuestion.get(templateQuestion.id);
        const hasValue = answer ? this.answerHasValue(answer) : false;
        const isCorrect = answer
          ? this.isAnswerCorrect(version, answer)
          : false;
        const marksAwarded = !hasValue
          ? 0
          : isCorrect
            ? Number(templateQuestion.marks)
            : -Number(templateQuestion.negativeMarks);
        score += marksAwarded;
        return { answer, isCorrect, marksAwarded };
      });

      for (const item of evaluated) {
        if (!item.answer) continue;
        await tx.studentExamAnswer.update({
          where: { id: item.answer.id },
          data: {
            isCorrect: item.isCorrect,
            marksAwarded: item.marksAwarded,
          },
        });
      }
      await tx.studentExamAttempt.update({
        where: { id: current.id },
        data: {
          submittedAt: now,
          evaluatedAt: now,
          submissionReason: reason,
          score,
          maximumScore,
          calculationVersion: 2,
          durationSeconds: Math.max(
            0,
            Math.floor(
              (Math.min(now.getTime(), current.expiresAt.getTime()) -
                current.startedAt.getTime()) /
                1000,
            ),
          ),
          remainingSecondsAtLastSave: 0,
          lastSavedAt: now,
        },
      });
      await tx.studentExamSlotAttempt.updateMany({
        where: { studentExamAttemptId: current.id },
        data: { status, submittedAt: now, completionReason: reason },
      });
      await tx.studentExamSectionAttempt.updateMany({
        where: { slotAttempt: { studentExamAttemptId: current.id } },
        data: { status, submittedAt: now, completionReason: reason },
      });
      await tx.studentActivityEvent.create({
        data: {
          clientEventId: `exam:${current.uuid}:${automatic ? 'auto-submit' : 'submit'}`,
          organizationId: current.exam.organizationId,
          studentId: current.studentId,
          userActivitySessionId,
          sessionCourseId: current.sessionCourseId,
          resourceId: current.sourceResourceId,
          examAttemptId: current.id,
          eventType: automatic
            ? StudentActivityEventType.EXAM_AUTO_SUBMIT
            : StudentActivityEventType.EXAM_SUBMIT,
          occurredAt: now,
          metadata: { submissionReason: reason },
          resourceTitleSnapshot: current.sourceResource?.title,
          resourceTypeCodeSnapshot: current.sourceResource?.resourceType.code,
          courseNameSnapshot:
            current.sessionCourse?.displayName ??
            current.sessionCourse?.course.name,
        },
      });
      if (
        current.sourceResourceId &&
        this.isResultReleased(current.exam, now)
      ) {
        const preferences = await tx.studentPreference.findUnique({
          where: { studentId: current.studentId },
          select: { inAppNotifications: true },
        });
        if (preferences?.inAppNotifications ?? true) {
          const notification = buildExamResultNotification({
            title: current.exam.title,
            resourceId: current.sourceResourceId,
            attemptId: current.id,
          });
          await tx.studentNotification.createMany({
            data: [
              {
                ...notification,
                studentId: current.studentId,
                organizationId: current.exam.organizationId,
              },
            ],
            skipDuplicates: true,
          });
        }
      }
      return {
        attemptId: current.id,
        attemptUuid: current.uuid,
        status,
        submittedAt: now,
        reportAvailable: this.isResultReleased(current.exam, now),
      };
    });
    if (result) return result;

    const completed = await this.prisma.studentExamAttempt.findUnique({
      where: { id: attempt.id },
      include: attemptInclude,
    });
    if (!completed) throw new NotFoundException('Exam attempt not found');
    return this.toSubmissionResponse(completed);
  }

  private async findActivitySessionId(
    sessionUuid: string | undefined,
    studentId: number,
  ) {
    if (!sessionUuid) return null;
    const session = await this.prisma.userActivitySession.findFirst({
      where: { uuid: sessionUuid, studentId, endedAt: null },
      select: { id: true },
    });
    return session?.id ?? null;
  }

  private toSubmissionResponse(attempt: LoadedAttempt) {
    return {
      attemptId: attempt.id,
      attemptUuid: attempt.uuid,
      status: attempt.status,
      submittedAt: attempt.submittedAt,
      reportAvailable: this.isResultReleased(attempt.exam, new Date()),
    };
  }

  private toAttemptResponse(
    attempt: LoadedAttempt,
    pendingTimeout: AttemptTimeout | null = null,
  ) {
    const answerByQuestion = new Map<number, LoadedAttempt['answers'][number]>(
      attempt.answers.map((answer) => [answer.examTemplateQuestionId, answer]),
    );
    const availableQuestionIds = new Set(
      attempt.questions
        .filter((question) => {
          const slot = attempt.slotProgress.find(
            (item) => item.id === question.studentExamSlotAttemptId,
          );
          const section = slot?.sectionProgress.find(
            (item) => item.id === question.studentExamSectionAttemptId,
          );
          return Boolean(
            slot && section && !slot.submittedAt && !section.submittedAt,
          );
        })
        .map((question) => question.id),
    );
    const currentQuestionId =
      attempt.questions.reduce<{
        id: number | null;
        viewedAt: number;
      }>(
        (current, question) => {
          if (!availableQuestionIds.has(question.id)) return current;
          const viewedAt = question.lastViewedAt?.getTime() ?? 0;
          return viewedAt > current.viewedAt
            ? { id: question.id, viewedAt }
            : current;
        },
        { id: null, viewedAt: 0 },
      ).id ??
      this.findAvailableQuestion(attempt)?.id ??
      null;
    return {
      attemptId: attempt.id,
      attemptUuid: attempt.uuid,
      attemptNumber: attempt.attemptNumber,
      attemptLimit: attempt.exam.attemptLimit,
      status: attempt.status,
      serverTime: new Date(),
      startedAt: attempt.startedAt,
      expiresAt: attempt.expiresAt,
      lastSavedAt: attempt.lastSavedAt,
      currentQuestionId,
      title: attempt.exam.title,
      code: attempt.exam.code,
      instructions:
        attempt.exam.instructions ?? attempt.exam.templateVersion.instructions,
      durationMinutes: attempt.exam.durationMinutes,
      autoSubmitOnTimeout: attempt.exam.autoSubmitOnTimeout,
      allowResume: attempt.exam.allowResume,
      timeoutState: pendingTimeout
        ? {
            scope: pendingTimeout.scope,
            scopeId: pendingTimeout.scopeId,
            autoSubmitOnTimeout: pendingTimeout.autoSubmitOnTimeout,
            message: pendingTimeout.message,
          }
        : null,
      slots: attempt.slotProgress.map((slot) => ({
        id: slot.id,
        code: slot.selectedSlot.templateSlot.code,
        name: slot.selectedSlot.templateSlot.name,
        instructions: slot.selectedSlot.templateSlot.instructions,
        navigationMode: slot.selectedSlot.templateSlot.navigationMode,
        autoSubmitOnTimeout: slot.selectedSlot.templateSlot.autoSubmitOnTimeout,
        status: slot.status,
        startedAt: slot.startedAt,
        expiresAt: slot.expiresAt,
        submittedAt: slot.submittedAt,
        sections: slot.sectionProgress.map((section) => ({
          id: section.id,
          code: section.templateSection.code,
          name: section.templateSection.name,
          instructions: section.templateSection.instructions,
          navigationMode: section.templateSection.navigationMode,
          allowReview: section.templateSection.allowReview,
          autoSubmitOnTimeout: section.templateSection.autoSubmitOnTimeout,
          questionsToAttempt: section.templateSection.questionsToAttempt,
          status: section.status,
          startedAt: section.startedAt,
          expiresAt: section.expiresAt,
          submittedAt: section.submittedAt,
        })),
      })),
      questions: attempt.questions.map((question) => {
        const templateQuestion = question.templateQuestion;
        const version = templateQuestion.questionVersion;
        const answer = answerByQuestion.get(templateQuestion.id);
        const optionOrder = Array.isArray(question.optionOrder)
          ? (question.optionOrder as number[])
          : version.options.map((option) => option.id);
        const optionById = new Map(
          version.options.map((option) => [option.id, option]),
        );
        return {
          id: question.id,
          order: question.questionOrder,
          code: version.question.code,
          subject: templateQuestion.sectionSubject.subject,
          sectionAttemptId: question.studentExamSectionAttemptId,
          content: version.content,
          comprehension: version.comprehension
            ? {
                id: version.comprehension.id,
                code: version.comprehension.code,
                content: version.comprehension.content,
              }
            : null,
          questionType: {
            id: version.questionType.id,
            code: version.questionType.code,
            name: version.questionType.name,
          },
          difficulty: version.difficulty,
          options: optionOrder
            .map((id) => optionById.get(id))
            .filter((option) => Boolean(option))
            .map((option) => ({
              id: option!.id,
              code: option!.code,
              content: option!.content,
            })),
          marks: Number(templateQuestion.marks),
          negativeMarks: Number(templateQuestion.negativeMarks),
          inputPolicy: {
            virtualKeyboardMode: version.virtualKeyboardMode,
            allowPhysicalKeyboard: version.allowPhysicalKeyboard,
            allowPaste: version.allowPaste,
            maxAnswerLength: version.maxAnswerLength,
          },
          state: {
            visited: Boolean(question.visitedAt),
            markedForReview: question.markedForReview,
            answered: answer ? this.answerHasValue(answer) : false,
            selectedOptionIds:
              answer?.selectedOptions.map((item) => item.questionOptionId) ??
              [],
            textAnswer: answer?.textAnswer ?? '',
            numericAnswer:
              answer?.numericAnswer === null ||
              answer?.numericAnswer === undefined
                ? null
                : Number(answer.numericAnswer),
          },
        };
      }),
    };
  }

  private isAnswerCorrect(
    version: LoadedAttempt['questions'][number]['templateQuestion']['questionVersion'],
    answer: LoadedAttempt['answers'][number],
  ) {
    if (version.questionType.code === QUESTION_TYPE_CODES.SINGLE_CHOICE) {
      const selected = new Set(
        answer.selectedOptions.map((item) => item.questionOptionId),
      );
      const correct = version.options
        .filter((option) => option.isCorrect)
        .map((option) => option.id);
      return (
        selected.size === correct.length &&
        correct.every((optionId) => selected.has(optionId))
      );
    }
    if (version.questionType.code === QUESTION_TYPE_CODES.NUMERIC) {
      if (answer.numericAnswer === null) return false;
      const actual = Number(answer.numericAnswer);
      return version.acceptedAnswers.some((accepted) => {
        if (accepted.numericValue === null) return false;
        return (
          Math.abs(actual - Number(accepted.numericValue)) <=
          Number(accepted.numericTolerance ?? 0)
        );
      });
    }
    if (version.questionType.code === QUESTION_TYPE_CODES.ONE_WORD) {
      const actual = this.normalizeText(
        answer.textAnswer ?? '',
        version.caseSensitive,
        version.normalizeWhitespace,
      );
      return version.acceptedAnswers.some((accepted) => {
        const expected = accepted.textValue ?? accepted.normalizedText ?? '';
        return (
          actual ===
          this.normalizeText(
            expected,
            version.caseSensitive,
            version.normalizeWhitespace,
          )
        );
      });
    }
    return false;
  }

  private answerHasValue(answer: {
    textAnswer: string | null;
    numericAnswer: Prisma.Decimal | null;
    selectedOptions: unknown[];
  }) {
    return (
      answer.selectedOptions.length > 0 ||
      answer.numericAnswer !== null ||
      Boolean(answer.textAnswer?.trim())
    );
  }

  private enforceSectionAttemptLimit(
    attempt: LoadedAttempt,
    question: LoadedAttempt['questions'][number],
    willHaveAnswer: boolean,
  ) {
    const limit = question.sectionAttempt.templateSection.questionsToAttempt;
    if (!limit || !willHaveAnswer) return;
    const existing = attempt.answers.find(
      (answer) =>
        answer.examTemplateQuestionId === question.examTemplateQuestionId,
    );
    if (existing && this.answerHasValue(existing)) return;
    const sectionQuestionIds = new Set(
      attempt.questions
        .filter(
          (item) =>
            item.studentExamSectionAttemptId ===
            question.studentExamSectionAttemptId,
        )
        .map((item) => item.examTemplateQuestionId),
    );
    const count = attempt.answers.filter(
      (answer) =>
        sectionQuestionIds.has(answer.examTemplateQuestionId) &&
        this.answerHasValue(answer),
    ).length;
    if (count >= limit) {
      throw new ConflictException(
        `This section allows answers to ${limit} questions`,
      );
    }
  }

  private async activateQuestionScope(
    attempt: LoadedAttempt,
    question: LoadedAttempt['questions'][number],
  ) {
    const section = question.sectionAttempt;
    const slot = question.slotAttempt;
    if (section.submittedAt || slot.submittedAt) {
      throw new ConflictException('This timed section has already been closed');
    }
    if (section.startedAt && slot.startedAt) return;
    const now = new Date();
    const slotConfig = attempt.slotProgress.find((item) => item.id === slot.id);
    const sectionConfig = slotConfig?.sectionProgress.find(
      (item) => item.id === section.id,
    );
    if (!slotConfig || !sectionConfig) {
      throw new ConflictException('Exam timing scope is invalid');
    }
    await this.prisma.$transaction(async (tx) => {
      const activeAttempt = await tx.studentExamAttempt.updateMany({
        where: { id: attempt.id, status: ExamAttemptStatus.IN_PROGRESS },
        data: this.heartbeat(attempt),
      });
      if (!activeAttempt.count) {
        throw new ConflictException('This exam attempt is no longer active');
      }
      if (!slot.startedAt) {
        await tx.studentExamSlotAttempt.updateMany({
          where: {
            studentExamAttemptId: attempt.id,
            id: { not: slot.id },
            startedAt: { not: null },
            submittedAt: null,
            selectedSlot: {
              templateSlot: {
                navigationMode: { not: ExamNavigationMode.FREE },
              },
            },
          },
          data: {
            status: ExamAttemptStatus.SUBMITTED,
            submittedAt: now,
            completionReason: 'SLOT_CHANGED',
          },
        });
        const slotDuration =
          slotConfig.selectedSlot.durationMinutesOverride ??
          slotConfig.selectedSlot.templateSlot.durationMinutes;
        await tx.studentExamSlotAttempt.update({
          where: { id: slot.id },
          data: {
            startedAt: now,
            expiresAt: attempt.exam.templateVersion.enforceSlotTimers
              ? new Date(
                  Math.min(
                    attempt.expiresAt.getTime(),
                    now.getTime() + slotDuration * 60_000,
                  ),
                )
              : null,
          },
        });
      }
      if (!section.startedAt) {
        await tx.studentExamSectionAttempt.updateMany({
          where: {
            slotAttempt: { studentExamAttemptId: attempt.id },
            id: { not: section.id },
            startedAt: { not: null },
            submittedAt: null,
            templateSection: {
              navigationMode: { not: ExamNavigationMode.FREE },
            },
          },
          data: {
            status: ExamAttemptStatus.SUBMITTED,
            submittedAt: now,
            completionReason: 'SECTION_CHANGED',
          },
        });
        await tx.studentExamSectionAttempt.update({
          where: { id: section.id },
          data: {
            startedAt: now,
            expiresAt: attempt.exam.templateVersion.enforceSectionTimers
              ? new Date(
                  Math.min(
                    attempt.expiresAt.getTime(),
                    now.getTime() +
                      sectionConfig.templateSection.durationMinutes * 60_000,
                  ),
                )
              : null,
          },
        });
      }
    });
  }

  private heartbeat(attempt: LoadedAttempt) {
    const now = new Date();
    return {
      lastSavedAt: now,
      remainingSecondsAtLastSave: Math.max(
        0,
        Math.ceil((attempt.expiresAt.getTime() - now.getTime()) / 1000),
      ),
    };
  }

  private isResultReleased(exam: LoadedAttempt['exam'], now: Date) {
    if (exam.resultReleaseMode === ExamResultReleaseMode.IMMEDIATE) return true;
    if (exam.resultReleaseMode === ExamResultReleaseMode.SCHEDULED) {
      return Boolean(exam.resultPublishAt && exam.resultPublishAt <= now);
    }
    return Boolean(exam.resultsReleasedAt && exam.resultsReleasedAt <= now);
  }

  private normalizeText(
    value: string,
    caseSensitive: boolean,
    normalizeWhitespace: boolean,
  ) {
    const normalized = normalizeWhitespace
      ? value.trim().replace(/\s+/g, ' ')
      : value;
    return caseSensitive ? normalized : normalized.toLocaleLowerCase();
  }

  private stableShuffle<T>(items: T[], seed: string) {
    return [...items]
      .map((item, index) => ({
        item,
        key: createHash('sha256').update(`${seed}:${index}`).digest('hex'),
      }))
      .sort((left, right) => left.key.localeCompare(right.key))
      .map(({ item }) => item);
  }
}
