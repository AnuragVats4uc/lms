import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageProvider } from '@prisma/client';
import { createHash } from 'node:crypto';

import { ObjectKeyBuilder } from './object-key.builder';
import { LocalObjectStorageDriver } from './local-object-storage.driver';
import { StoredObjectRepository } from './stored-object.repository';
import {
  OBJECT_STORAGE_DRIVER,
  type ObjectStorageDriver,
  type UploadManagedObjectInput,
} from './storage.types';

@Injectable()
export class ManagedObjectService {
  private readonly logger = new Logger(ManagedObjectService.name);
  private readonly bucket: string;
  private readonly maxUploadBytes: number;

  constructor(
    @Inject(ConfigService)
    private readonly config: ConfigService,
    @Inject(StoredObjectRepository)
    private readonly repository: StoredObjectRepository,
    @Inject(ObjectKeyBuilder)
    private readonly keyBuilder: ObjectKeyBuilder,
    @Inject(OBJECT_STORAGE_DRIVER)
    private readonly storage: ObjectStorageDriver,
    @Inject(LocalObjectStorageDriver)
    private readonly localStorage: LocalObjectStorageDriver,
  ) {
    this.bucket = this.config.get<string>('storage.bucket') ?? 'lms-local';
    this.maxUploadBytes =
      this.config.get<number>('storage.maxUploadBytes') ?? 25 * 1024 * 1024;
  }

  async upload(input: UploadManagedObjectInput) {
    if (!input.body.length) {
      throw new BadRequestException('Managed file must not be empty');
    }
    if (input.body.length > this.maxUploadBytes) {
      throw new PayloadTooLargeException(
        `Managed file must not exceed ${this.maxUploadBytes} bytes`,
      );
    }
    const checksumSha256 = createHash('sha256')
      .update(input.body)
      .digest('hex');
    const pending = await this.repository.createPending({
      provider:
        this.storage.provider === 'utho_s3'
          ? StorageProvider.UTHO_S3
          : StorageProvider.LOCAL,
      organizationId: input.organization?.id ?? null,
      uploadedById: input.uploadedById ?? null,
      bucket: this.bucket,
      originalFileName: input.originalFileName,
      mimeType: input.mimeType,
      sizeBytes: input.body.byteLength,
      checksumSha256,
    });
    const objectKey = this.keyBuilder.build({
      organization: input.organization,
      owner: input.owner,
      asset: { id: pending.id, uuid: pending.uuid },
      originalFileName: input.originalFileName,
    });
    await this.repository.assignObjectKey(pending.id, objectKey);

    let objectWasUploaded = false;
    try {
      const stored = await this.storage.put({
        bucket: this.bucket,
        key: objectKey,
        body: input.body,
        contentType: input.mimeType,
        contentDisposition: `inline; filename="${this.safeDispositionName(input.originalFileName)}"`,
        checksumSha256,
      });
      objectWasUploaded = true;
      return await this.repository.markReady(pending.id, stored);
    } catch (error) {
      if (objectWasUploaded) {
        await this.storage
          .delete(this.bucket, objectKey)
          .catch(() =>
            this.logger.error(
              `Managed object rollback failed for asset ${pending.id}`,
            ),
          );
      }
      const message =
        error instanceof Error ? error.message : 'Unknown storage error';
      await this.repository
        .markFailed(pending.id, message)
        .catch(() => undefined);
      this.logger.error(`Managed object upload failed for asset ${pending.id}`);
      throw new BadGatewayException('Managed file storage is unavailable');
    }
  }

  async open(input: {
    id: number;
    uuid: string;
    organizationId?: number | null;
  }) {
    const object = await this.repository.findReady(
      input.id,
      input.uuid,
      input.organizationId,
    );
    if (!object) throw new NotFoundException('Stored file not found');

    try {
      const content = await this.driverFor(object.provider).get(
        object.bucket,
        object.objectKey,
      );
      return { object, ...content };
    } catch {
      throw new BadGatewayException('Managed file storage is unavailable');
    }
  }

  async delete(id: number, uuid: string, organizationId?: number | null) {
    const object = await this.repository.findForDeletion(
      id,
      uuid,
      organizationId,
    );
    if (!object) return;
    if (object.status !== 'DELETE_PENDING') {
      await this.repository.markDeletePending(object.id);
    }
    try {
      await this.driverFor(object.provider).delete(
        object.bucket,
        object.objectKey,
      );
      await this.repository.markDeleted(object.id);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown storage error';
      await this.repository.markDeletePending(object.id, message);
      throw new BadGatewayException('Managed file deletion is pending retry');
    }
  }

  async health() {
    await this.storage.health(this.bucket);
    return { provider: this.storage.provider, status: 'ready' as const };
  }

  private safeDispositionName(value: string) {
    return value
      .normalize('NFKD')
      .replace(/[^\x20-\x7e]/g, '-')
      .replace(/["\\]/g, '')
      .slice(0, 180);
  }

  private driverFor(provider: StorageProvider) {
    if (provider === StorageProvider.LOCAL) return this.localStorage;
    if (
      provider === StorageProvider.UTHO_S3 &&
      this.storage.provider === 'utho_s3'
    ) {
      return this.storage;
    }
    throw new BadGatewayException(
      'The configured storage provider cannot read this managed file',
    );
  }
}
