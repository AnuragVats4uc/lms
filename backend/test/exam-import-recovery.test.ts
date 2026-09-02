import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ExamImportStatus } from '@prisma/client';

import { ExamRepository } from '../src/modules/exam/repositories/exam.repository';
import { ExamService } from '../src/modules/exam/services/exam.service';

const user = {
  userId: 1,
  email: 'admin@example.com',
  organizationId: 7,
};

void test('recent import jobs are filtered by organization, version, and status', async () => {
  let received: Record<string, unknown> | undefined;
  const client = {
    examImportJob: {
      findMany: (args: Record<string, unknown>) => {
        received = args;
        return Promise.resolve([]);
      },
    },
  };
  const service = new ExamService({ client } as unknown as ExamRepository);

  await service.listImports(user, {
    examTemplateVersionId: 51,
    status: ExamImportStatus.READY_FOR_REVIEW,
    limit: 8,
  });

  assert.deepEqual(received?.where, {
    organizationId: 7,
    examTemplateVersionId: 51,
    status: ExamImportStatus.READY_FOR_REVIEW,
  });
  assert.equal(received?.take, 8);
});

void test('a second import commit cannot enter the transaction', async () => {
  let transactionCalled = false;
  const client = {
    examImportJob: {
      findUnique: () =>
        Promise.resolve({
          id: 21,
          organizationId: 7,
          status: ExamImportStatus.READY_FOR_REVIEW,
          files: [],
          rows: [],
          errors: [],
        }),
      updateMany: () => Promise.resolve({ count: 0 }),
    },
    $transaction: () => {
      transactionCalled = true;
      return Promise.resolve();
    },
  };
  const service = new ExamService({ client } as unknown as ExamRepository);

  await assert.rejects(
    service.commitImport(user, 21),
    /already being imported, or the import changed/,
  );
  assert.equal(transactionCalled, false);
});
