import { ExamAttemptStatus, PrismaClient } from '@prisma/client';

export async function seedDemoExamAttemptDetails(
  prisma: PrismaClient,
  examId: number,
  attemptIds: number[],
) {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
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
                              questionType: true,
                              options: { orderBy: { sortOrder: 'asc' } },
                              acceptedAnswers: {
                                orderBy: { sortOrder: 'asc' },
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
  if (!exam) throw new Error('Demo exam not found');
  const selectedSlot = exam.selectedSlots[0];
  const section = selectedSlot?.templateSlot.sections[0];
  const questions = section?.subjects.flatMap((subject) => subject.questions);
  if (!selectedSlot || !section || !questions?.length) {
    throw new Error('Demo exam structure is incomplete');
  }

  const attempts = await prisma.studentExamAttempt.findMany({
    where: { id: { in: attemptIds }, examId },
    orderBy: { attemptNumber: 'asc' },
  });
  const reportFixtureStatuses: ExamAttemptStatus[] = [
    ExamAttemptStatus.SUBMITTED,
    ExamAttemptStatus.AUTO_SUBMITTED,
    ExamAttemptStatus.EVALUATED,
  ];
  for (const attempt of attempts) {
    if (!reportFixtureStatuses.includes(attempt.status)) {
      continue;
    }
    await prisma.$transaction(async (tx) => {
      const completionReason =
        attempt.submissionReason ?? 'DEMO_REPORT_FIXTURE';
      const slotAttempt = await tx.studentExamSlotAttempt.upsert({
        where: {
          studentExamAttemptId_examSelectedSlotId: {
            studentExamAttemptId: attempt.id,
            examSelectedSlotId: selectedSlot.id,
          },
        },
        update: {
          status: attempt.status,
          startedAt: attempt.startedAt,
          expiresAt: attempt.expiresAt,
          submittedAt: attempt.submittedAt,
          timeSpentSeconds: attempt.durationSeconds,
          completionReason,
        },
        create: {
          studentExamAttemptId: attempt.id,
          examSelectedSlotId: selectedSlot.id,
          status: attempt.status,
          startedAt: attempt.startedAt,
          expiresAt: attempt.expiresAt,
          submittedAt: attempt.submittedAt,
          timeSpentSeconds: attempt.durationSeconds,
          completionReason,
        },
      });
      const sectionAttempt = await tx.studentExamSectionAttempt.upsert({
        where: {
          studentExamSlotAttemptId_examTemplateSectionId: {
            studentExamSlotAttemptId: slotAttempt.id,
            examTemplateSectionId: section.id,
          },
        },
        update: {
          status: attempt.status,
          startedAt: attempt.startedAt,
          expiresAt: attempt.expiresAt,
          submittedAt: attempt.submittedAt,
          timeSpentSeconds: attempt.durationSeconds,
          completionReason,
        },
        create: {
          studentExamSlotAttemptId: slotAttempt.id,
          examTemplateSectionId: section.id,
          status: attempt.status,
          startedAt: attempt.startedAt,
          expiresAt: attempt.expiresAt,
          submittedAt: attempt.submittedAt,
          timeSpentSeconds: attempt.durationSeconds,
          completionReason,
        },
      });

      let score = 0;
      const timePerQuestion = Math.floor(
        attempt.durationSeconds / questions.length,
      );
      for (const [questionIndex, question] of questions.entries()) {
        const unanswered =
          attempt.attemptNumber > 1 && questionIndex % 4 === 3;
        const correct =
          !unanswered &&
          (attempt.attemptNumber === 1 || questionIndex % 3 === 0);
        const questionType = question.questionVersion.questionType.code;
        const acceptedAnswer = question.questionVersion.acceptedAnswers[0];
        const correctOption = question.questionVersion.options.find(
          (option) => option.isCorrect,
        );
        const selectedOption = unanswered
          ? undefined
          : correct
            ? correctOption
            : question.questionVersion.options.find(
                (option) => !option.isCorrect,
              );
        const textAnswer =
          !unanswered && questionType === 'ONE_WORD'
            ? correct
              ? acceptedAnswer?.textValue
              : 'incorrect'
            : null;
        const numericAnswer =
          !unanswered && questionType === 'NUMERIC'
            ? correct
              ? acceptedAnswer?.numericValue
              : Number(acceptedAnswer?.numericValue ?? 0) + 1
            : null;
        const marksAwarded = correct
          ? Number(question.marks)
          : unanswered
            ? 0
            : -Number(question.negativeMarks);
        score += marksAwarded;

        await tx.studentExamAttemptQuestion.upsert({
          where: {
            studentExamAttemptId_examTemplateQuestionId: {
              studentExamAttemptId: attempt.id,
              examTemplateQuestionId: question.id,
            },
          },
          update: {
            studentExamSlotAttemptId: slotAttempt.id,
            studentExamSectionAttemptId: sectionAttempt.id,
            questionOrder: questionIndex + 1,
            optionOrder: question.questionVersion.options.map(
              (option) => option.id,
            ),
            visitedAt: attempt.startedAt,
            lastViewedAt: attempt.submittedAt,
            timeSpentSeconds: timePerQuestion,
          },
          create: {
            studentExamAttemptId: attempt.id,
            studentExamSlotAttemptId: slotAttempt.id,
            studentExamSectionAttemptId: sectionAttempt.id,
            examTemplateQuestionId: question.id,
            questionOrder: questionIndex + 1,
            optionOrder: question.questionVersion.options.map(
              (option) => option.id,
            ),
            visitedAt: attempt.startedAt,
            lastViewedAt: attempt.submittedAt,
            timeSpentSeconds: timePerQuestion,
          },
        });
        const answer = await tx.studentExamAnswer.upsert({
          where: {
            studentExamAttemptId_examTemplateQuestionId: {
              studentExamAttemptId: attempt.id,
              examTemplateQuestionId: question.id,
            },
          },
          update: {
            textAnswer,
            numericAnswer,
            isCorrect: unanswered ? null : correct,
            marksAwarded,
            answeredAt: unanswered ? null : attempt.submittedAt,
          },
          create: {
            studentExamAttemptId: attempt.id,
            examTemplateQuestionId: question.id,
            textAnswer,
            numericAnswer,
            isCorrect: unanswered ? null : correct,
            marksAwarded,
            answeredAt: unanswered ? null : attempt.submittedAt,
          },
        });
        await tx.studentExamAnswerOption.deleteMany({
          where: { studentExamAnswerId: answer.id },
        });
        if (selectedOption) {
          await tx.studentExamAnswerOption.create({
            data: {
              studentExamAnswerId: answer.id,
              questionOptionId: selectedOption.id,
            },
          });
        }
      }

      const maximumScore = questions.reduce(
        (total, question) => total + Number(question.marks),
        0,
      );
      await tx.studentExamAttempt.update({
        where: { id: attempt.id },
        data: { score, maximumScore, calculationVersion: 2 },
      });
    });
  }
}
