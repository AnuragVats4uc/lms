import type { Readable } from 'node:stream';

export const OBJECT_STORAGE_DRIVER = Symbol('OBJECT_STORAGE_DRIVER');

export interface ObjectStoragePutInput {
  bucket: string;
  key: string;
  body: Buffer;
  contentType: string;
  contentDisposition?: string;
  checksumSha256: string;
}

export interface ObjectStoragePutResult {
  etag: string | null;
  versionId: string | null;
}

export interface ObjectStorageGetResult {
  stream: Readable;
  contentLength: number | null;
  contentType: string | null;
  etag: string | null;
}

export interface ObjectStorageDriver {
  readonly provider: 'local' | 'utho_s3';
  put(input: ObjectStoragePutInput): Promise<ObjectStoragePutResult>;
  get(bucket: string, key: string): Promise<ObjectStorageGetResult>;
  exists(bucket: string, key: string): Promise<boolean>;
  delete(bucket: string, key: string): Promise<void>;
  health(bucket: string): Promise<void>;
}

export interface ManagedObjectOwner {
  category:
    'resources' | 'exam-imports' | 'student-avatars' | 'course-thumbnails';
  id: number;
  uuid: string;
}

export interface ManagedObjectOrganization {
  id: number;
  uuid: string;
}

export interface UploadManagedObjectInput {
  organization: ManagedObjectOrganization | null;
  owner: ManagedObjectOwner;
  uploadedById?: number | null;
  originalFileName: string;
  mimeType: string;
  body: Buffer;
}
