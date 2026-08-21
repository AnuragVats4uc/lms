import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ExamTemplateVersionStatus, ExamNavigationMode } from '@prisma/client';

import { CurrentUser } from '../src/modules/auth/types/current-user.types';
import { ExamRepository } from '../src/modules/exam/repositories/exam.repository';
import { ExamService } from '../src/modules/exam/services/exam.service';

const user: CurrentUser = {
  userId: 1,
  email: 'admin@example.com',
  organizationId: 7,
};

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
