import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { QuestionStatus } from '@prisma/client';

import {
  QuestionListQueryDto,
  QuestionListSort,
} from '../src/modules/exam/dto/exam.dto';
import { ExamRepository } from '../src/modules/exam/repositories/exam.repository';
import { ExamService } from '../src/modules/exam/services/exam.service';

void test('question listing passes tenant-safe filters, sorting, and limit to Prisma', async () => {
  let findManyArguments: unknown;
  const service = new ExamService({
    client: {
      question: {
        findMany: (argumentsValue: unknown) => {
          findManyArguments = argumentsValue;
          return Promise.resolve([]);
        },
      },
    },
  } as unknown as ExamRepository);

  await service.listQuestions(
    {
      userId: 1,
      email: 'admin@example.com',
      organizationId: 7,
    },
    {
      organizationId: 7,
      search: 'algebra',
      subjectId: 11,
      questionTypeId: 2,
      status: QuestionStatus.PUBLISHED,
      sort: QuestionListSort.RECENTLY_UPDATED,
      limit: 50,
    },
  );

  assert.deepEqual(findManyArguments, {
    where: {
      organizationId: 7,
      isActive: true,
      subjectId: 11,
      status: QuestionStatus.PUBLISHED,
      versions: { some: { questionTypeId: 2 } },
      OR: [
        { code: { contains: 'algebra' } },
        {
          versions: {
            some: { content: { contains: 'algebra' } },
          },
        },
      ],
    },
    include: {
      subject: true,
      versions: {
        orderBy: { versionNumber: 'desc' },
        include: {
          options: { orderBy: { sortOrder: 'asc' } },
          acceptedAnswers: true,
          questionType: true,
          comprehension: true,
        },
      },
    },
    orderBy: [{ updatedAt: 'desc' }, { code: 'asc' }],
    take: 50,
  });
});

void test('question limit accepts 1 through 100 and rejects outside values', async () => {
  const minimum = plainToInstance(QuestionListQueryDto, { limit: '1' });
  const maximum = plainToInstance(QuestionListQueryDto, { limit: '100' });
  const belowMinimum = plainToInstance(QuestionListQueryDto, { limit: '0' });
  const aboveMaximum = plainToInstance(QuestionListQueryDto, { limit: '101' });

  assert.equal((await validate(minimum)).length, 0);
  assert.equal((await validate(maximum)).length, 0);
  assert.notEqual((await validate(belowMinimum)).length, 0);
  assert.notEqual((await validate(aboveMaximum)).length, 0);
});
