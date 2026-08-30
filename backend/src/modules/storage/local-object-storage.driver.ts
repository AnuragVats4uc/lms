import { Injectable } from '@nestjs/common';
import { createReadStream } from 'node:fs';
import { mkdir, stat, unlink, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';

import type {
  ObjectStorageDriver,
  ObjectStorageGetResult,
  ObjectStoragePutInput,
  ObjectStoragePutResult,
} from './storage.types';

@Injectable()
export class LocalObjectStorageDriver implements ObjectStorageDriver {
  readonly provider = 'local' as const;
  private readonly root = resolve(process.cwd(), 'uploads', 'object-storage');

  async put(input: ObjectStoragePutInput): Promise<ObjectStoragePutResult> {
    const path = this.path(input.bucket, input.key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, input.body, { flag: 'wx' });
    return { etag: input.checksumSha256, versionId: null };
  }

  async get(bucket: string, key: string): Promise<ObjectStorageGetResult> {
    const path = this.path(bucket, key);
    const metadata = await stat(path);
    return {
      stream: createReadStream(path),
      contentLength: metadata.size,
      contentType: null,
      etag: null,
    };
  }

  async exists(bucket: string, key: string) {
    try {
      await stat(this.path(bucket, key));
      return true;
    } catch {
      return false;
    }
  }

  async delete(bucket: string, key: string) {
    await unlink(this.path(bucket, key)).catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code !== 'ENOENT') throw error;
      },
    );
  }

  async health(bucket: string) {
    await mkdir(this.path(bucket, '.health'), { recursive: true });
  }

  private path(bucket: string, key: string) {
    if (!/^[a-z0-9][a-z0-9.-]{0,62}$/i.test(bucket)) {
      throw new Error('Storage bucket contains unsupported characters');
    }
    const bucketRoot = resolve(this.root, bucket);
    const path = resolve(bucketRoot, ...key.split('/'));
    if (path !== bucketRoot && !path.startsWith(`${bucketRoot}${sep}`)) {
      throw new Error('Object key escapes the storage root');
    }
    return path;
  }
}
