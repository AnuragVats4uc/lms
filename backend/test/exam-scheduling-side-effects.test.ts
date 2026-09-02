import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ExamStatus,
  ExamTemplateVersionStatus,
  ResourceStatus,
} from '@prisma/client';

import { ExamRepository } from '../src/modules/exam/repositories/exam.repository';
import { ExamService } from '../src/modules/exam/services/exam.service';

void test('scheduling creates the exam resource and deduplicated opted-in notifications', async () => {
  let resourceData: Record<string, unknown> | undefined;
  let notificationData: Array<Record<string, unknown>> = [];
  const createdExam = {
    id: 91,
    title: 'Graduate Mock Test',
    instructions: 'Read carefully',
    availableUntil: new Date('2026-09-10T06:00:00.000Z'),
  };
  const client = {
    examTemplateVersion: {
      findFirst: () =>
        Promise.resolve({
          id: 51,
          status: ExamTemplateVersionStatus.PUBLISHED,
          slots: [{ id: 61 }],
        }),
    },
    session: { findFirst: () => Promise.resolve({ id: 4 }) },
    sessionCourse: {
      findMany: () => Promise.resolve([{ id: 11 }, { id: 12 }]),
    },
    folder: { findFirst: () => Promise.resolve({ id: 31 }) },
    exam: { findFirst: () => Promise.resolve(null) },
    $transaction: async (
      work: (tx: Record<string, unknown>) => Promise<unknown>,
    ) =>
      work({
        exam: { create: () => Promise.resolve(createdExam) },
        resource: {
          create: ({ data }: { data: Record<string, unknown> }) => {
            resourceData = data;
            return Promise.resolve({ id: 301 });
          },
        },
        studentCourseEnrollment: {
          findMany: () =>
            Promise.resolve([
              {
                enrollment: {
                  student: {
                    id: 201,
                    preferences: {
                      inAppNotifications: true,
                      examReminders: true,
                    },
                  },
                },
              },
              {
                enrollment: {
                  student: {
                    id: 201,
                    preferences: {
                      inAppNotifications: true,
                      examReminders: true,
                    },
                  },
                },
              },
              {
                enrollment: {
                  student: {
                    id: 202,
                    preferences: {
                      inAppNotifications: true,
                      examReminders: false,
                    },
                  },
                },
              },
            ]),
        },
        studentNotification: {
          createMany: ({ data }: { data: Array<Record<string, unknown>> }) => {
            notificationData = data;
            return Promise.resolve({ count: data.length });
          },
        },
      }),
  };
  const service = new ExamService({ client } as unknown as ExamRepository);

  const result = await service.createExam(
    {
      userId: 1,
      email: 'admin@example.com',
      organizationId: 7,
    },
    {
      organizationId: 7,
      sessionId: 4,
      examTemplateVersionId: 51,
      selectedSlotIds: [61],
      sessionCourseIds: [11, 12],
      resourceFolderId: 31,
      title: 'Graduate Mock Test',
      availableFrom: '2026-09-10T04:00:00.000Z',
      availableUntil: '2026-09-10T06:00:00.000Z',
      durationMinutes: 90,
      attemptLimit: 1,
      status: ExamStatus.SCHEDULED,
    },
  );

  assert.equal(result, createdExam);
  assert.equal(resourceData?.status, ResourceStatus.PUBLISHED);
  assert.equal(resourceData?.isPublished, true);
  assert.equal(resourceData?.examId, createdExam.id);
  assert.equal(notificationData.length, 1);
  assert.equal(notificationData[0].studentId, 201);
  assert.equal(notificationData[0].organizationId, 7);
});
