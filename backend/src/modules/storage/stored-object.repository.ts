import { Inject, Injectable } from '@nestjs/common';
import { StorageProvider, StoredObjectStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { PrismaService } from '../../prisma';

@Injectable()
export class StoredObjectRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  createPending(input: {
    provider: StorageProvider;
    organizationId: number | null;
    uploadedById: number | null;
    bucket: string;
    originalFileName: string;
    mimeType: string;
    sizeBytes: number;
    checksumSha256: string;
  }) {
    const uuid = randomUUID();
    return this.prisma.storedObject.create({
      data: {
        uuid,
        organizationId: input.organizationId,
        uploadedById: input.uploadedById,
        provider: input.provider,
        bucket: input.bucket,
        objectKey: `pending/${uuid}`,
        originalFileName: input.originalFileName,
        mimeType: input.mimeType,
        sizeBytes: BigInt(input.sizeBytes),
        checksumSha256: input.checksumSha256,
        status: StoredObjectStatus.PENDING,
      },
    });
  }

  assignObjectKey(id: number, objectKey: string) {
    return this.prisma.storedObject.update({
      where: { id },
      data: { objectKey },
    });
  }

  markReady(
    id: number,
    input: { etag: string | null; versionId: string | null },
  ) {
    return this.prisma.storedObject.update({
      where: { id },
      data: {
        etag: input.etag,
        versionId: input.versionId,
        status: StoredObjectStatus.READY,
        failureMessage: null,
      },
    });
  }

  markFailed(id: number, failureMessage: string) {
    return this.prisma.storedObject.update({
      where: { id },
      data: {
        status: StoredObjectStatus.FAILED,
        failureMessage: failureMessage.slice(0, 2000),
      },
    });
  }

  markDeletePending(id: number, failureMessage?: string) {
    return this.prisma.storedObject.update({
      where: { id },
      data: {
        status: StoredObjectStatus.DELETE_PENDING,
        failureMessage: failureMessage?.slice(0, 2000) ?? null,
      },
    });
  }

  markDeleted(id: number) {
    return this.prisma.storedObject.update({
      where: { id },
      data: {
        status: StoredObjectStatus.DELETED,
        deletedAt: new Date(),
        failureMessage: null,
      },
    });
  }

  findReady(id: number, uuid: string, organizationId?: number | null) {
    return this.prisma.storedObject.findFirst({
      where: {
        id,
        uuid,
        status: StoredObjectStatus.READY,
        ...(organizationId === undefined ? {} : { organizationId }),
      },
    });
  }

  findForDeletion(id: number, uuid: string, organizationId?: number | null) {
    return this.prisma.storedObject.findFirst({
      where: {
        id,
        uuid,
        status: {
          in: [StoredObjectStatus.READY, StoredObjectStatus.DELETE_PENDING],
        },
        ...(organizationId === undefined ? {} : { organizationId }),
      },
    });
  }
}
