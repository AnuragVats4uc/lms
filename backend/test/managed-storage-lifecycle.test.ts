import assert from 'node:assert/strict';
import { test } from 'node:test';

import { BadGatewayException, BadRequestException } from '@nestjs/common';
import {
  ResourceStatus,
  StorageProvider,
  StoredObjectStatus,
} from '@prisma/client';

import {
  ResourceService,
  validateResourceDocumentFile,
} from '../src/modules/resource/services/resource.service';
import { ManagedObjectService } from '../src/modules/storage/managed-object.service';

const uuid = '11111111-2222-4333-8444-555555555555';

void test('removes an uploaded object when marking its metadata ready fails', async () => {
  const events: string[] = [];
  const repository = {
    createPending: () => Promise.resolve({ id: 7, uuid }),
    assignObjectKey: () => Promise.resolve(undefined),
    markReady: () => Promise.reject(new Error('database write failed')),
    markFailed: () => {
      events.push('metadata-failed');
      return Promise.resolve(undefined);
    },
  };
  const storage = {
    provider: 'utho_s3' as const,
    put: () => {
      events.push('uploaded');
      return Promise.resolve({ etag: 'etag', versionId: null });
    },
    delete: () => {
      events.push('object-removed');
      return Promise.resolve(undefined);
    },
  };
  const service = new ManagedObjectService(
    {
      get: (key: string) =>
        key === 'storage.bucket' ? 'private-bucket' : 25 * 1024 * 1024,
    } as never,
    repository as never,
    {
      build: () => `organizations/4/${uuid}/assets/7/${uuid}/notes.pdf`,
    } as never,
    storage as never,
    storage as never,
  );

  await assert.rejects(
    service.upload({
      organization: { id: 4, uuid },
      owner: { category: 'resources', id: 9, uuid },
      originalFileName: 'notes.pdf',
      mimeType: 'application/pdf',
      body: Buffer.from('%PDF-1.7'),
    }),
    BadGatewayException,
  );
  assert.deepEqual(events, ['uploaded', 'object-removed', 'metadata-failed']);
});

void test('retries an object already marked for deletion', async () => {
  const events: string[] = [];
  const repository = {
    findForDeletion: () =>
      Promise.resolve({
        id: 7,
        uuid,
        organizationId: 4,
        provider: StorageProvider.UTHO_S3,
        bucket: 'private-bucket',
        objectKey: `organizations/4/${uuid}/assets/7/${uuid}/notes.pdf`,
        status: StoredObjectStatus.DELETE_PENDING,
      }),
    markDeletePending: () => {
      events.push('delete-pending');
      return Promise.resolve(undefined);
    },
    markDeleted: () => {
      events.push('metadata-deleted');
      return Promise.resolve(undefined);
    },
  };
  const storage = {
    provider: 'utho_s3' as const,
    delete: () => {
      events.push('object-deleted');
      return Promise.resolve(undefined);
    },
  };
  const service = new ManagedObjectService(
    { get: () => 'private-bucket' } as never,
    repository as never,
    {} as never,
    storage as never,
    storage as never,
  );

  await service.delete(7, uuid, 4);
  assert.deepEqual(events, ['object-deleted', 'metadata-deleted']);
});

void test('rejects a document whose content does not match its extension', () => {
  assert.throws(
    () =>
      validateResourceDocumentFile({
        buffer: Buffer.from('not a pdf'),
        mimetype: 'application/pdf',
        originalname: 'notes.pdf',
        size: 9,
      }),
    BadRequestException,
  );
  assert.doesNotThrow(() =>
    validateResourceDocumentFile({
      buffer: Buffer.from('%PDF-1.7'),
      mimetype: 'application/pdf',
      originalname: 'notes.pdf',
      size: 8,
    }),
  );
});

void test('accepts OOXML signatures and rejects binary text uploads', () => {
  assert.doesNotThrow(() =>
    validateResourceDocumentFile({
      buffer: Buffer.from('504b03040000', 'hex'),
      mimetype:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      originalname: 'lesson.docx',
      size: 6,
    }),
  );
  assert.throws(
    () =>
      validateResourceDocumentFile({
        buffer: Buffer.from([0x61, 0, 0x62]),
        mimetype: 'text/plain',
        originalname: 'lesson.txt',
        size: 3,
      }),
    BadRequestException,
  );
});

void test('detaches and cleans an uploaded document when its resource becomes a video', async () => {
  const updates: Array<Record<string, unknown>> = [];
  const deletions: Array<[number, string, number]> = [];
  const folder = {
    sessionCourse: {
      id: 8,
      session: {
        organizationId: 4,
        organization: { id: 4, uuid },
      },
    },
  };
  const existing = {
    id: 9,
    uuid,
    folderId: 5,
    title: 'Uploaded notes',
    description: null,
    resourceTypeId: 1,
    resourceType: { id: 1, code: 'DOCUMENT', name: 'Document' },
    documentUrl: `http://localhost/api/v1/folders/5/resources/9/${uuid}/file`,
    documentObjectId: 7,
    documentObject: {
      id: 7,
      uuid,
      originalFileName: 'notes.pdf',
      mimeType: 'application/pdf',
      sizeBytes: BigInt(100),
      status: StoredObjectStatus.READY,
    },
    thumbnailObject: null,
    videoUrl: null,
    examId: null,
    thumbnail: null,
    thumbnailObjectId: null,
    mimeType: 'application/pdf',
    fileSize: BigInt(100),
    durationInSeconds: null,
    sortOrder: 0,
    status: ResourceStatus.PUBLISHED,
    isPublished: true,
    isDownloadable: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const repository = {
    findFolderById: () => Promise.resolve(folder),
    findById: () => Promise.resolve(existing),
    findResourceTypeById: () => Promise.resolve({ id: 2 }),
    update: (_id: number, data: Record<string, unknown>) => {
      updates.push(data);
      return Promise.resolve({
        ...existing,
        ...data,
        resourceType: { id: 2, code: 'VIDEO', name: 'Video' },
        documentObject: null,
      });
    },
  };
  const managedObjects = {
    delete: (id: number, objectUuid: string, organizationId: number) => {
      deletions.push([id, objectUuid, organizationId]);
      return Promise.resolve(undefined);
    },
  };
  const service = new ResourceService(
    repository as never,
    managedObjects as never,
  );

  await service.update(5, 9, {
    resourceTypeId: 2,
    videoUrl: 'https://vimeo.com/76979871',
  });

  assert.equal(updates[0]?.documentObjectId, null);
  assert.equal(updates[0]?.documentUrl, null);
  assert.deepEqual(deletions, [[7, uuid, 4]]);
});
