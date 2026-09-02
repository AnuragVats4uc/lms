import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ExamNavigationMode,
  ExamTemplateStatus,
  ExamTemplateVersionStatus,
  QuestionStatus,
} from '@prisma/client';

import { CurrentUser } from '../src/modules/auth/types/current-user.types';
import { ExamRepository } from '../src/modules/exam/repositories/exam.repository';
import { ExamService } from '../src/modules/exam/services/exam.service';

const user: CurrentUser = {
  userId: 1,
  email: 'admin@example.com',
  organizationId: 7,
};

void test('derives slot and section codes only from their names', () => {
  const service = new ExamService({} as ExamRepository) as unknown as {
    assignStructureCodes: (dto: {
      slots: Array<{
        code?: string;
        name: string;
        sections: Array<{ code?: string; name: string }>;
      }>;
    }) => void;
  };
  const dto = {
    slots: [
      {
        code: 'OLD-SLOT',
        name: 'General Studies',
        sections: [
          {
            code: 'OLD-SECTION',
            name: 'Quantitative Aptitude',
          },
        ],
      },
    ],
  };

  service.assignStructureCodes(dto);

  assert.equal(dto.slots[0].code, 'GENERAL-STUDIES');
  assert.equal(dto.slots[0].sections[0].code, 'QUANTITATIVE-APTITUDE');
});

function publishedTemplate() {
  return {
    id: 41,
    organizationId: 7,
    versions: [
      {
        id: 51,
        versionNumber: 1,
        status:
          ExamTemplateVersionStatus.PUBLISHED as ExamTemplateVersionStatus,
        instructions: 'Read all instructions carefully.',
        defaultDurationMinutes: 90,
        slots: [
          {
            id: 61,
            code: 'CUET_SLOT_1',
            name: 'CUET Slot 1',
            description: null,
            instructions: null,
            durationMinutes: 90,
            navigationMode: ExamNavigationMode.FREE,
            autoSubmitOnTimeout: true,
            sortOrder: 1,
            isActive: true,
            sections: [
              {
                id: 71,
                code: 'LANGUAGE',
                name: 'English Language',
                instructions: null,
                durationMinutes: 30,
                questionsToAttempt: 5,
                randomizeQuestions: false,
                randomizeOptions: false,
                navigationMode: ExamNavigationMode.FREE,
                allowReview: true,
                autoSubmitOnTimeout: true,
                sortOrder: 1,
                isActive: true,
                subjects: [
                  {
                    subjectId: 11,
                    isMandatory: true,
                    sortOrder: 1,
                    questions: [
                      {
                        questionVersionId: 101,
                        questionVersion: { question: { id: 201 } },
                        marks: 5,
                        negativeMarks: 1,
                        isMandatory: true,
                        sortOrder: 1,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

void test('creates the next draft version with the published structure', async () => {
  const template = publishedTemplate();
  let createData: unknown;
  const client = {
    examTemplate: { findUnique: () => Promise.resolve(template) },
    examTemplateVersion: {
      create: ({ data }: { data: unknown }) => {
        createData = data;
        return Promise.resolve({ id: 52 });
      },
    },
  };
  const service = new ExamService({ client } as unknown as ExamRepository);

  await service.createTemplateVersion(user, template.id);

  const data = createData as {
    versionNumber: number;
    slots: {
      create: Array<{
        code: string;
        sections: {
          create: Array<{
            subjects: {
              create: Array<{
                questions: {
                  create: Array<{ questionVersionId: number }>;
                };
              }>;
            };
          }>;
        };
      }>;
    };
  };
  assert.equal(data.versionNumber, 2);
  assert.equal(data.slots.create[0].code, 'CUET_SLOT_1');
  assert.equal(
    data.slots.create[0].sections.create[0].subjects.create[0].questions
      .create[0].questionVersionId,
    101,
  );
});

void test('can create a structure-only draft without cloning question links', async () => {
  const template = publishedTemplate();
  let createData: unknown;
  const client = {
    examTemplate: { findUnique: () => Promise.resolve(template) },
    examTemplateVersion: {
      create: ({ data }: { data: unknown }) => {
        createData = data;
        return Promise.resolve({ id: 52 });
      },
    },
  };
  const service = new ExamService({ client } as unknown as ExamRepository);

  await service.createTemplateVersion(user, template.id, {
    copyQuestions: false,
  });

  const data = createData as {
    slots: {
      create: Array<{
        sortOrder: number;
        sections: {
          create: Array<{
            sortOrder: number;
            subjects: {
              create: Array<{ questions?: unknown }>;
            };
          }>;
        };
      }>;
    };
  };
  assert.equal(
    data.slots.create[0].sections.create[0].subjects.create[0].questions,
    undefined,
  );
  assert.equal(data.slots.create[0].sortOrder, 1);
  assert.equal(data.slots.create[0].sections.create[0].sortOrder, 1);
});

void test('reorders every slot on a draft version and normalizes positions', async () => {
  const template = publishedTemplate();
  const sourceSlot = template.versions[0].slots[0];
  template.versions[0].status = ExamTemplateVersionStatus.DRAFT;
  template.versions[0].slots.push({
    ...sourceSlot,
    id: 62,
    code: 'CUET_SLOT_2',
    name: 'CUET Slot 2',
    sortOrder: 2,
    sections: [],
  });
  const updates: Array<{ id: number; sortOrder: number }> = [];
  const client = {
    examTemplate: { findUnique: () => Promise.resolve(template) },
    examTemplateSlot: {
      update: ({
        where,
        data,
      }: {
        where: { id: number };
        data: { sortOrder: number };
      }) => {
        updates.push({ id: where.id, sortOrder: data.sortOrder });
        return Promise.resolve({});
      },
    },
    $transaction: (operations: Array<Promise<unknown>>) =>
      Promise.all(operations),
  };
  const service = new ExamService({ client } as unknown as ExamRepository);

  await service.reorderTemplateSlots(user, template.id, 51, {
    orderedIds: [62, 61],
  });

  assert.deepEqual(updates, [
    { id: 62, sortOrder: 0 },
    { id: 61, sortOrder: 1 },
  ]);
});

void test('reorders every section within its draft slot', async () => {
  const template = publishedTemplate();
  const sourceSection = template.versions[0].slots[0].sections[0];
  template.versions[0].status = ExamTemplateVersionStatus.DRAFT;
  template.versions[0].slots[0].sections.push({
    ...sourceSection,
    id: 72,
    code: 'REASONING',
    name: 'Reasoning',
    sortOrder: 2,
  });
  const updates: Array<{ id: number; sortOrder: number }> = [];
  const client = {
    examTemplate: { findUnique: () => Promise.resolve(template) },
    examTemplateSection: {
      update: ({
        where,
        data,
      }: {
        where: { id: number };
        data: { sortOrder: number };
      }) => {
        updates.push({ id: where.id, sortOrder: data.sortOrder });
        return Promise.resolve({});
      },
    },
    $transaction: (operations: Array<Promise<unknown>>) =>
      Promise.all(operations),
  };
  const service = new ExamService({ client } as unknown as ExamRepository);

  await service.reorderTemplateSections(user, template.id, 51, 61, {
    orderedIds: [72, 71],
  });

  assert.deepEqual(updates, [
    { id: 72, sortOrder: 0 },
    { id: 71, sortOrder: 1 },
  ]);
});

void test('publishing atomically publishes linked question versions and questions', async () => {
  const template = publishedTemplate();
  template.versions[0].status = ExamTemplateVersionStatus.DRAFT;
  template.versions[0].slots[0].sections[0].questionsToAttempt = 1;
  const versionUpdates: Array<Record<string, unknown>> = [];
  const questionUpdates: Array<Record<string, unknown>> = [];
  const client = {
    examTemplate: {
      findUnique: () => Promise.resolve(template),
      update: (args: Record<string, unknown>) => {
        versionUpdates.push(args);
        return Promise.resolve({});
      },
    },
    examTemplateVersion: {
      update: (args: Record<string, unknown>) => {
        versionUpdates.push(args);
        return Promise.resolve({});
      },
    },
    questionVersion: {
      updateMany: (args: Record<string, unknown>) => {
        questionUpdates.push(args);
        return Promise.resolve({ count: 1 });
      },
    },
    question: {
      updateMany: (args: Record<string, unknown>) => {
        questionUpdates.push(args);
        return Promise.resolve({ count: 1 });
      },
    },
    $transaction: (operations: Array<Promise<unknown>>) =>
      Promise.all(operations),
  };
  const service = new ExamService({ client } as unknown as ExamRepository);

  await service.publishTemplate(user, template.id);

  assert.equal(
    (versionUpdates[0].data as { status: string }).status,
    ExamTemplateVersionStatus.PUBLISHED,
  );
  assert.equal(
    (versionUpdates[1].data as { status: string }).status,
    ExamTemplateStatus.PUBLISHED,
  );
  assert.deepEqual(questionUpdates[0], {
    where: { id: { in: [101] } },
    data: { isPublished: true },
  });
  assert.deepEqual(questionUpdates[1], {
    where: { id: { in: [201] } },
    data: { status: QuestionStatus.PUBLISHED },
  });
});

void test('rejects incomplete ordering and published-version changes', async () => {
  const template = publishedTemplate();
  const service = new ExamService({
    client: { examTemplate: { findUnique: () => Promise.resolve(template) } },
  } as unknown as ExamRepository);

  await assert.rejects(
    service.reorderTemplateSlots(user, template.id, 51, {
      orderedIds: [61],
    }),
    /immutable/,
  );

  template.versions[0].status = ExamTemplateVersionStatus.DRAFT;
  await assert.rejects(
    service.reorderTemplateSlots(user, template.id, 51, {
      orderedIds: [999],
    }),
    /include every current item exactly once/,
  );
});

void test('prevents a second draft for the same template', async () => {
  const template = publishedTemplate();
  template.versions.unshift({
    ...template.versions[0],
    id: 52,
    versionNumber: 2,
    status: ExamTemplateVersionStatus.DRAFT,
  });
  let createCalled = false;
  const client = {
    examTemplate: { findUnique: () => Promise.resolve(template) },
    examTemplateVersion: {
      create: () => {
        createCalled = true;
        return Promise.resolve({ id: 53 });
      },
    },
  };
  const service = new ExamService({ client } as unknown as ExamRepository);

  await assert.rejects(
    service.createTemplateVersion(user, template.id),
    /already has a draft version/,
  );
  assert.equal(createCalled, false);
});
