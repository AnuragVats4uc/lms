import 'dotenv/config';
import 'reflect-metadata';

import { ResourceStatus, StoredObjectStatus } from '@prisma/client';
import { NestFactory } from '@nestjs/core';
import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import { basename, extname, join, relative, resolve } from 'node:path';

import { AppModule } from '../src/app.module';
import { ManagedObjectService } from '../src/modules/storage/managed-object.service';
import { PrismaService } from '../src/prisma';

const ORGANIZATION_CODE = 'KDL';
const APPLY_CONFIRMATION = 'KDL';
const DOCUMENT_MIME_TYPE = 'application/pdf';

interface Destination {
  course: string;
  folders: string[];
}

interface ImportCandidate extends Destination {
  absolutePath: string;
  relativePath: string;
  originalFileName: string;
  title: string;
  sizeBytes: number;
}

interface PreparedCandidate extends ImportCandidate {
  checksumSha256: string;
  folderId: number;
}

const applyChanges = process.argv.includes('--apply');
const confirmation = argumentValue('--confirm');
const contentRootArgument = argumentValue('--content-root');

function argumentValue(name: string) {
  const prefix = `${name}=`;
  return process.argv
    .find((argument) => argument.startsWith(prefix))
    ?.slice(prefix.length);
}

function normalizedSegment(value: string) {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
}

function normalizedTitle(value: string) {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
}

function titleFromFileName(fileName: string) {
  return basename(fileName)
    .replace(/(?:\.pdf)+$/i, '')
    .trim()
    .slice(0, 200);
}

function findSegment(segments: string[], expected: string) {
  const normalizedExpected = normalizedSegment(expected);
  return segments.findIndex(
    (segment) => normalizedSegment(segment) === normalizedExpected,
  );
}

function destinationFor(relativePath: string): Destination | 'skip' | null {
  const segments = relativePath.split(/[\\/]+/);

  if (
    findSegment(segments, 'IBPS Clerk') >= 0 ||
    findSegment(segments, 'RRB-NTPC-Graduate') >= 0 ||
    findSegment(segments, 'GS Mind Maps') >= 0 ||
    findSegment(segments, 'IBPS CHSL') >= 0
  ) {
    return 'skip';
  }

  const gsNcertIndex = findSegment(segments, 'GS NCERT');
  if (gsNcertIndex >= 0) {
    const folders = segments
      .slice(gsNcertIndex + 1, -1)
      .map((segment) =>
        normalizedSegment(segment) === 'climatolo' ? 'Climatology' : segment,
      );
    if (!folders.length) return null;
    return { course: 'GS NCERT', folders };
  }

  if (findSegment(segments, 'GS Nemonics') >= 0) {
    return { course: 'GS Mnemonics', folders: ['Study Materials'] };
  }
  if (findSegment(segments, 'IBPS PO') >= 0) {
    return { course: 'IBPS PO', folders: ['Study Materials'] };
  }
  if (findSegment(segments, 'SSC CGL') >= 0) {
    return { course: 'SSC CGL', folders: ['Study Materials'] };
  }
  if (findSegment(segments, 'SSC-CHSL') >= 0) {
    return { course: 'SSC CHSL', folders: ['Study Materials'] };
  }

  const studyMaterialIndex = findSegment(segments, 'Study Material');
  if (studyMaterialIndex >= 0) {
    const folder = segments[studyMaterialIndex + 1];
    if (!folder || !['quant', 'lr', 'gk'].includes(normalizedSegment(folder))) {
      return null;
    }
    return { course: 'Study Material', folders: [folder] };
  }

  return null;
}

async function listFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(path)));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

async function collectCandidates(contentRoot: string) {
  const candidates: ImportCandidate[] = [];
  const skipped: string[] = [];
  const ignored: string[] = [];
  const unmatched: string[] = [];

  for (const absolutePath of await listFiles(contentRoot)) {
    const relativePath = relative(contentRoot, absolutePath);
    if (extname(absolutePath).toLowerCase() !== '.pdf') {
      ignored.push(relativePath);
      continue;
    }
    const destination = destinationFor(relativePath);
    if (destination === 'skip') {
      skipped.push(relativePath);
      continue;
    }
    if (!destination) {
      unmatched.push(relativePath);
      continue;
    }
    const fileStat = await stat(absolutePath);
    candidates.push({
      ...destination,
      absolutePath,
      relativePath,
      originalFileName: basename(absolutePath),
      title: titleFromFileName(absolutePath),
      sizeBytes: fileStat.size,
    });
  }

  return { candidates, skipped, ignored, unmatched };
}

function destinationKey(course: string, folders: string[]) {
  return [course, ...folders].map(normalizedSegment).join(' > ');
}

async function main() {
  if (!contentRootArgument) {
    throw new Error(
      'Pass the source directory as --content-root=<absolute path>.',
    );
  }
  if (applyChanges && confirmation !== APPLY_CONFIRMATION) {
    throw new Error(
      `Applying this import requires --apply --confirm=${APPLY_CONFIRMATION}.`,
    );
  }

  const contentRoot = resolve(contentRootArgument);
  const inventory = await collectCandidates(contentRoot);
  if (inventory.unmatched.length) {
    throw new Error(
      `Unmatched PDF paths:\n${inventory.unmatched.map((path) => `- ${path}`).join('\n')}`,
    );
  }
  if (inventory.candidates.length !== 154 || inventory.skipped.length !== 59) {
    throw new Error(
      `Content inventory changed: expected 154 mapped and 59 skipped PDFs, found ${inventory.candidates.length} mapped and ${inventory.skipped.length} skipped.`,
    );
  }

  const maximumFileBytes = Math.max(
    ...inventory.candidates.map((candidate) => candidate.sizeBytes),
  );
  const configuredLimit = Number(process.env.UTHO_S3_MAX_UPLOAD_BYTES ?? 0);
  process.env.UTHO_S3_MAX_UPLOAD_BYTES = String(
    Math.max(configuredLimit, maximumFileBytes),
  );

  const app = await NestFactory.createApplicationContext(AppModule, {
    abortOnError: false,
    logger: ['error'],
  });
  const prisma = app.get(PrismaService);
  const managedObjects = app.get(ManagedObjectService);

  const summary = {
    mode: applyChanges ? 'apply' : 'dry-run',
    sourceRoot: contentRoot,
    mapped: inventory.candidates.length,
    skippedByDesign: inventory.skipped.length,
    ignoredNonPdf: inventory.ignored.length,
    readyToCreate: 0,
    alreadyImported: 0,
    created: 0,
    conflicts: [] as string[],
    destinationCounts: {} as Record<string, number>,
  };

  try {
    if (applyChanges) {
      const health = await managedObjects.health();
      if (health.provider !== 'utho_s3') {
        throw new Error(
          'Resource import --apply requires STORAGE_PROVIDER=utho_s3 and valid Utho credentials.',
        );
      }
    }

    const organization = await prisma.organization.findFirst({
      where: { code: ORGANIZATION_CODE },
      select: { id: true, uuid: true },
    });
    if (!organization) throw new Error('Organization KDL was not found.');

    const sessionCourses = await prisma.sessionCourse.findMany({
      where: {
        isActive: true,
        session: { organizationId: organization.id },
      },
      select: {
        id: true,
        displayName: true,
        course: { select: { name: true } },
        folders: {
          where: { isActive: true },
          select: { id: true, name: true, parentFolderId: true },
        },
      },
    });

    const folderByDestination = new Map<string, number>();
    for (const sessionCourse of sessionCourses) {
      const byId = new Map(
        sessionCourse.folders.map((folder) => [folder.id, folder]),
      );
      for (const folder of sessionCourse.folders) {
        const chain = [folder.name];
        let parentId = folder.parentFolderId;
        const visited = new Set([folder.id]);
        while (parentId !== null) {
          if (visited.has(parentId))
            throw new Error('Folder hierarchy cycle found.');
          visited.add(parentId);
          const parent = byId.get(parentId);
          if (!parent)
            throw new Error(`Folder ${folder.id} has an invalid parent.`);
          chain.unshift(parent.name);
          parentId = parent.parentFolderId;
        }
        const courseName =
          sessionCourse.displayName ?? sessionCourse.course.name;
        const key = destinationKey(courseName, chain);
        if (folderByDestination.has(key)) {
          throw new Error(`Duplicate destination folder: ${key}.`);
        }
        folderByDestination.set(key, folder.id);
      }
    }

    const forbiddenFolderNames = sessionCourses
      .flatMap((sessionCourse) => sessionCourse.folders)
      .filter((folder) =>
        ['mock test', 'uploads'].includes(normalizedSegment(folder.name)),
      );
    if (forbiddenFolderNames.length) {
      throw new Error(
        'Unexpected Mock Test or Uploads folders exist in the seeded hierarchy.',
      );
    }

    const protectedEmptyKeys = [
      destinationKey('GS Mind Maps', ['Study Materials']),
      destinationKey('IBPS CHSL', ['Study Materials']),
    ];
    for (const key of protectedEmptyKeys) {
      const folderId = folderByDestination.get(key);
      if (!folderId)
        throw new Error(`Required empty destination is missing: ${key}.`);
      const count = await prisma.resource.count({ where: { folderId } });
      if (count !== 0) {
        throw new Error(`Protected destination must remain empty: ${key}.`);
      }
    }

    const documentType = await prisma.resourceType.findFirst({
      where: { code: 'DOCUMENT', isActive: true },
      select: { id: true },
    });
    if (!documentType)
      throw new Error('Active DOCUMENT resource type was not found.');

    const candidateTitleKeys = new Set<string>();
    const prepared: PreparedCandidate[] = [];
    for (const candidate of inventory.candidates) {
      const key = destinationKey(candidate.course, candidate.folders);
      const folderId = folderByDestination.get(key);
      if (!folderId) throw new Error(`Seeded destination is missing: ${key}.`);

      const titleKey = `${folderId}:${normalizedTitle(candidate.title)}`;
      if (candidateTitleKeys.has(titleKey)) {
        throw new Error(
          `Duplicate title in one destination: ${candidate.title}.`,
        );
      }
      candidateTitleKeys.add(titleKey);
      summary.destinationCounts[key] =
        (summary.destinationCounts[key] ?? 0) + 1;

      const body = await readFile(candidate.absolutePath);
      if (body.subarray(0, 5).toString('ascii') !== '%PDF-') {
        throw new Error(
          `File is not a valid PDF header: ${candidate.relativePath}.`,
        );
      }
      prepared.push({
        ...candidate,
        checksumSha256: createHash('sha256').update(body).digest('hex'),
        folderId,
      });
    }

    const destinationFolderIds = [
      ...new Set(prepared.map((item) => item.folderId)),
    ];
    const existingResources = await prisma.resource.findMany({
      where: { folderId: { in: destinationFolderIds } },
      select: {
        id: true,
        folderId: true,
        title: true,
        resourceTypeId: true,
        documentObject: {
          select: { checksumSha256: true, status: true },
        },
      },
    });
    const existingByTitle = new Map(
      existingResources.map((resource) => [
        `${resource.folderId}:${normalizedTitle(resource.title)}`,
        resource,
      ]),
    );

    const toCreate: PreparedCandidate[] = [];
    for (const candidate of prepared) {
      const existing = existingByTitle.get(
        `${candidate.folderId}:${normalizedTitle(candidate.title)}`,
      );
      if (!existing) {
        toCreate.push(candidate);
        continue;
      }
      if (
        existing.resourceTypeId === documentType.id &&
        existing.documentObject?.status === StoredObjectStatus.READY &&
        existing.documentObject.checksumSha256 === candidate.checksumSha256
      ) {
        summary.alreadyImported += 1;
      } else {
        summary.conflicts.push(candidate.relativePath);
      }
    }
    summary.readyToCreate = toCreate.length;
    if (summary.conflicts.length) {
      throw new Error(
        `Existing resource conflicts:\n${summary.conflicts.map((path) => `- ${path}`).join('\n')}`,
      );
    }

    if (applyChanges) {
      const publicBaseUrl = (
        process.env.PUBLIC_API_URL ??
        `http://localhost:${process.env.PORT ?? '5000'}`
      ).replace(/\/$/, '');
      const nextSortOrder = new Map<number, number>();
      for (const folderId of destinationFolderIds) {
        const aggregate = await prisma.resource.aggregate({
          where: { folderId },
          _max: { sortOrder: true },
        });
        nextSortOrder.set(folderId, (aggregate._max.sortOrder ?? 0) + 1);
      }

      for (const [index, candidate] of toCreate.entries()) {
        const sortOrder = nextSortOrder.get(candidate.folderId) ?? 1;
        const body = await readFile(candidate.absolutePath);
        const placeholder = await prisma.resource.create({
          data: {
            folderId: candidate.folderId,
            title: candidate.title,
            description:
              'Client-provided Keonjhar Digital Library study material.',
            resourceTypeId: documentType.id,
            mimeType: DOCUMENT_MIME_TYPE,
            fileSize: BigInt(candidate.sizeBytes),
            sortOrder,
            status: ResourceStatus.DRAFT,
            isPublished: false,
            isDownloadable: true,
            isActive: true,
          },
          select: { id: true, uuid: true },
        });
        nextSortOrder.set(candidate.folderId, sortOrder + 1);

        try {
          const storedObject = await managedObjects.upload({
            organization,
            owner: {
              category: 'resources',
              id: placeholder.id,
              uuid: placeholder.uuid,
            },
            originalFileName: candidate.originalFileName,
            mimeType: DOCUMENT_MIME_TYPE,
            body,
          });
          try {
            await prisma.resource.update({
              where: { id: placeholder.id },
              data: {
                documentObjectId: storedObject.id,
                documentUrl: `${publicBaseUrl}/api/v1/folders/${candidate.folderId}/resources/${placeholder.id}/${placeholder.uuid}/file`,
                status: ResourceStatus.PUBLISHED,
                isPublished: true,
              },
            });
          } catch (error) {
            await managedObjects
              .delete(storedObject.id, storedObject.uuid, organization.id)
              .catch(() => undefined);
            throw error;
          }
          summary.created += 1;
          console.log(
            `[${index + 1}/${toCreate.length}] Imported ${candidate.relativePath}`,
          );
        } catch (error) {
          await prisma.resource
            .delete({ where: { id: placeholder.id } })
            .catch(() => undefined);
          throw error;
        }
      }
    }

    const finalResourceCount = await prisma.resource.count({
      where: {
        folder: {
          sessionCourse: { session: { organizationId: organization.id } },
        },
      },
    });
    console.log(JSON.stringify({ ...summary, finalResourceCount }, null, 2));
    if (!applyChanges) {
      console.log(
        `Dry run only. Re-run with --apply --confirm=${APPLY_CONFIRMATION} after reviewing the report.`,
      );
    }
  } finally {
    await app.close();
  }
}

void main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? (error.stack ?? error.message) : error,
  );
  process.exitCode = 1;
});
