import { Injectable } from '@nestjs/common';
import { basename, extname } from 'node:path';

import type {
  ManagedObjectOrganization,
  ManagedObjectOwner,
} from './storage.types';

@Injectable()
export class ObjectKeyBuilder {
  build(input: {
    organization: ManagedObjectOrganization | null;
    owner: ManagedObjectOwner;
    asset: { id: number; uuid: string };
    originalFileName: string;
  }) {
    const organizationPrefix = input.organization
      ? `organizations/${input.organization.id}/${this.segment(input.organization.uuid)}`
      : 'global';
    const fileName = this.fileName(input.originalFileName);

    return [
      organizationPrefix,
      input.owner.category,
      String(input.owner.id),
      this.segment(input.owner.uuid),
      'assets',
      String(input.asset.id),
      this.segment(input.asset.uuid),
      fileName,
    ].join('/');
  }

  private segment(value: string) {
    const normalized = value.trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(normalized)) {
      throw new Error('Object key identifier contains unsupported characters');
    }
    return normalized;
  }

  private fileName(value: string) {
    const source = basename(value.trim());
    const extension = extname(source)
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, '');
    const stem = basename(source, extname(source))
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase()
      .slice(0, 96);
    return `${stem || 'file'}${extension}`;
  }
}
