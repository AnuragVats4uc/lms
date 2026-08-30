import 'dotenv/config';
import 'reflect-metadata';

import { access, readFile } from 'node:fs/promises';
import { basename, resolve, sep } from 'node:path';

import { NestFactory } from '@nestjs/core';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma';
import { ManagedObjectService } from '../src/modules/storage/managed-object.service';

const applyChanges = process.argv.includes('--apply');

function expectedLocalFile(directory: string, value: string) {
  const root = resolve(process.cwd(), 'uploads', directory);
  const path = resolve(root, basename(value));
  if (path !== root && !path.startsWith(`${root}${sep}`)) {
    throw new Error('Legacy file path escapes the expected upload directory');
  }
  return path;
}

function legacyResourceFile(documentUrl: string) {
  const match = documentUrl.match(
    /\/folders\/\d+\/resources\/file\/([^?#/]+)$/,
  );
  return match
    ? expectedLocalFile('resources', decodeURIComponent(match[1]))
    : null;
}

async function fileExists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    abortOnError: false,
    logger: ['error'],
  });
  const prisma = app.get(PrismaService);
  const managedObjects = app.get(ManagedObjectService);
  const summary = {
    mode: applyChanges ? 'apply' : 'dry-run',
    resources: { eligible: 0, migrated: 0, missing: 0, skipped: 0 },
    examImports: { eligible: 0, migrated: 0, missing: 0, skipped: 0 },
  };

  try {
    if (applyChanges) {
      const health = await managedObjects.health();
      if (health.provider !== 'utho_s3') {
        throw new Error(
          'Backfill --apply requires STORAGE_PROVIDER=utho_s3 and valid Utho configuration.',
        );
      }
    }

    const resources = await prisma.resource.findMany({
      where: {
        documentObjectId: null,
        documentUrl: { not: null },
      },
      select: {
        id: true,
        uuid: true,
        folderId: true,
        documentUrl: true,
        mimeType: true,
        folder: {
          select: {
            sessionCourse: {
              select: {
                session: {
                  select: {
                    organization: { select: { id: true, uuid: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    for (const resource of resources) {
      const path = resource.documentUrl
        ? legacyResourceFile(resource.documentUrl)
        : null;
      if (!path) {
        summary.resources.skipped += 1;
        continue;
      }
      if (!(await fileExists(path))) {
        summary.resources.missing += 1;
        continue;
      }
      summary.resources.eligible += 1;
      if (!applyChanges) continue;

      const organization = resource.folder.sessionCourse.session.organization;
      const body = await readFile(path);
      const stored = await managedObjects.upload({
        organization,
        owner: { category: 'resources', id: resource.id, uuid: resource.uuid },
        originalFileName: basename(path),
        mimeType: resource.mimeType ?? 'application/octet-stream',
        body,
      });
      try {
        const publicBaseUrl = (
          process.env.PUBLIC_API_URL ??
          `http://localhost:${process.env.PORT ?? '5000'}`
        ).replace(/\/$/, '');
        await prisma.resource.update({
          where: { id: resource.id },
          data: {
            documentObjectId: stored.id,
            documentUrl: `${publicBaseUrl}/api/v1/folders/${resource.folderId}/resources/${resource.id}/${resource.uuid}/file`,
          },
        });
        summary.resources.migrated += 1;
      } catch (error) {
        await managedObjects
          .delete(stored.id, stored.uuid, organization.id)
          .catch(() => undefined);
        throw error;
      }
    }

    const importFiles = await prisma.examImportFile.findMany({
      where: { storedObjectId: null, storagePath: { not: null } },
      select: {
        id: true,
        originalFileName: true,
        storagePath: true,
        mimeType: true,
        importJob: {
          select: {
            id: true,
            uuid: true,
            uploadedById: true,
            organization: { select: { id: true, uuid: true } },
          },
        },
      },
    });

    for (const importFile of importFiles) {
      if (!importFile.storagePath) {
        summary.examImports.skipped += 1;
        continue;
      }
      const path = expectedLocalFile('exam-imports', importFile.storagePath);
      if (!(await fileExists(path))) {
        summary.examImports.missing += 1;
        continue;
      }
      summary.examImports.eligible += 1;
      if (!applyChanges) continue;

      const body = await readFile(path);
      const stored = await managedObjects.upload({
        organization: importFile.importJob.organization,
        owner: {
          category: 'exam-imports',
          id: importFile.importJob.id,
          uuid: importFile.importJob.uuid,
        },
        uploadedById: importFile.importJob.uploadedById,
        originalFileName: importFile.originalFileName,
        mimeType: importFile.mimeType,
        body,
      });
      try {
        await prisma.examImportFile.update({
          where: { id: importFile.id },
          data: { storedObjectId: stored.id, storagePath: null },
        });
        summary.examImports.migrated += 1;
      } catch (error) {
        await managedObjects
          .delete(stored.id, stored.uuid, importFile.importJob.organization.id)
          .catch(() => undefined);
        throw error;
      }
    }

    console.log(JSON.stringify(summary, null, 2));
    if (!applyChanges) {
      console.log('Dry run only. Re-run with --apply after reviewing counts.');
    }
  } finally {
    await app.close();
  }
}

void main().catch((error) => {
  console.error(
    error instanceof Error ? (error.stack ?? error.message) : error,
  );
  process.exitCode = 1;
});
