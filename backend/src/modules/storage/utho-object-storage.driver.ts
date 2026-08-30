import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import type { Readable } from 'node:stream';

import type {
  ObjectStorageDriver,
  ObjectStorageGetResult,
  ObjectStoragePutInput,
  ObjectStoragePutResult,
} from './storage.types';

export interface UthoObjectStorageConfiguration {
  endpoint: string;
  region: string;
  accessKey: string;
  secretKey: string;
  forcePathStyle: boolean;
}

export class UthoObjectStorageDriver implements ObjectStorageDriver {
  readonly provider = 'utho_s3' as const;
  private readonly client: S3Client;

  constructor(configuration: UthoObjectStorageConfiguration) {
    this.client = new S3Client({
      endpoint: configuration.endpoint,
      region: configuration.region,
      forcePathStyle: configuration.forcePathStyle,
      credentials: {
        accessKeyId: configuration.accessKey,
        secretAccessKey: configuration.secretKey,
      },
    });
  }

  async put(input: ObjectStoragePutInput): Promise<ObjectStoragePutResult> {
    const response = await this.client.send(
      new PutObjectCommand({
        Bucket: input.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
        ContentDisposition: input.contentDisposition,
        Metadata: { sha256: input.checksumSha256 },
      }),
    );
    return {
      etag: response.ETag?.replace(/^"|"$/g, '') ?? null,
      versionId: response.VersionId ?? null,
    };
  }

  async get(bucket: string, key: string): Promise<ObjectStorageGetResult> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    if (
      !response.Body ||
      typeof (response.Body as Readable).pipe !== 'function'
    ) {
      throw new Error('Object storage returned a non-streaming response');
    }
    return {
      stream: response.Body as Readable,
      contentLength: response.ContentLength ?? null,
      contentType: response.ContentType ?? null,
      etag: response.ETag?.replace(/^"|"$/g, '') ?? null,
    };
  }

  async exists(bucket: string, key: string) {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: bucket, Key: key }),
      );
      return true;
    } catch (error) {
      const status = (error as { $metadata?: { httpStatusCode?: number } })
        .$metadata?.httpStatusCode;
      if (status === 404) return false;
      throw error;
    }
  }

  async delete(bucket: string, key: string) {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: bucket, Key: key }),
    );
  }

  async health(bucket: string) {
    await this.client.send(new HeadBucketCommand({ Bucket: bucket }));
  }
}
