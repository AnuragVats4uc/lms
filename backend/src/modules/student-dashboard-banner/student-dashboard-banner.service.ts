import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  StudentDashboardBannerEventType,
  StudentDashboardBannerMediaType,
  StudentDashboardBannerVideoProvider,
} from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUser } from '../auth/types/current-user.types';
import { ManagedObjectService } from '../storage/managed-object.service';
import {
  CreateDashboardBannerDto,
  DashboardBannerEventDto,
  UpdateDashboardBannerDto,
} from './dto/student-dashboard-banner.dto';

const IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

type ImageFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

@Injectable()
export class StudentDashboardBannerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly managedObjects: ManagedObjectService,
  ) {}

  async listAdmin(
    actor: CurrentUser,
    requestedOrganizationId: number,
    sessionId?: number,
  ) {
    const organizationId = await this.resolveOrganizationId(
      actor,
      requestedOrganizationId,
    );
    if (sessionId) await this.assertSessions(organizationId, [sessionId]);
    return this.prisma.studentDashboardBanner.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(sessionId ? { sessions: { some: { sessionId } } } : {}),
      },
      include: {
        sessions: {
          include: {
            session: { select: { id: true, name: true, code: true } },
          },
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
    });
  }

  async create(
    actor: CurrentUser,
    requestedOrganizationId: number,
    dto: CreateDashboardBannerDto,
  ) {
    const organizationId = await this.resolveOrganizationId(
      actor,
      requestedOrganizationId,
    );
    const sessionIds = this.uniqueIds(dto.sessionIds);
    await this.assertSessions(organizationId, sessionIds);
    this.assertTitle(dto.mediaType, dto.title);
    this.assertDates(dto.startsAt, dto.endsAt);
    const media = this.normalizeMedia(dto.mediaType, dto.mediaUrl);
    const maximum = await this.prisma.studentDashboardBanner.aggregate({
      where: { organizationId, deletedAt: null },
      _max: { displayOrder: true },
    });
    return this.prisma.studentDashboardBanner.create({
      data: {
        organizationId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        ctaLabel: dto.ctaLabel?.trim() || null,
        destinationUrl: dto.destinationUrl?.trim() || null,
        mediaType: dto.mediaType,
        mediaUrl: media.url,
        videoProvider: media.provider,
        mediaAlt: dto.mediaAlt?.trim() || null,
        posterUrl: dto.posterUrl?.trim() || null,
        autoplay:
          dto.mediaType === StudentDashboardBannerMediaType.VIDEO
            ? (dto.autoplay ?? false)
            : false,
        openInNewTab: dto.openInNewTab ?? false,
        isActive: dto.isActive ?? true,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        displayOrder: (maximum._max.displayOrder ?? -1) + 1,
        createdById: actor.userId,
        updatedById: actor.userId,
        sessions: {
          createMany: { data: sessionIds.map((sessionId) => ({ sessionId })) },
        },
      },
      include: {
        sessions: {
          include: {
            session: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });
  }

  async update(actor: CurrentUser, id: number, dto: UpdateDashboardBannerDto) {
    const banner = await this.findAdminBanner(actor, id);
    const sessionIds = this.uniqueIds(dto.sessionIds);
    await this.assertSessions(banner.organizationId, sessionIds);
    this.assertTitle(dto.mediaType, dto.title);
    this.assertDates(dto.startsAt, dto.endsAt);
    const media = this.normalizeMedia(dto.mediaType, dto.mediaUrl);
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.studentDashboardBannerSession.deleteMany({
        where: { bannerId: id },
      });
      return tx.studentDashboardBanner.update({
        where: { id },
        data: {
          title: dto.title.trim(),
          description: dto.description?.trim() || null,
          ctaLabel: dto.ctaLabel?.trim() || null,
          destinationUrl: dto.destinationUrl?.trim() || null,
          mediaType: dto.mediaType,
          mediaUrl: media.url,
          videoProvider: media.provider,
          mediaAlt: dto.mediaAlt?.trim() || null,
          posterUrl: dto.posterUrl?.trim() || null,
          autoplay:
            dto.mediaType === StudentDashboardBannerMediaType.VIDEO
              ? (dto.autoplay ?? false)
              : false,
          openInNewTab: dto.openInNewTab ?? false,
          isActive: dto.isActive ?? true,
          startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
          endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
          updatedById: actor.userId,
          sessions: {
            createMany: {
              data: sessionIds.map((sessionId) => ({ sessionId })),
            },
          },
        },
        include: {
          sessions: {
            include: {
              session: { select: { id: true, name: true, code: true } },
            },
          },
        },
      });
    });
    if (banner.mediaUrl !== updated.mediaUrl)
      await this.deleteManagedImage(banner.mediaUrl, banner.organizationId);
    if (banner.posterUrl !== updated.posterUrl)
      await this.deleteManagedImage(banner.posterUrl, banner.organizationId);
    return updated;
  }

  async remove(actor: CurrentUser, id: number) {
    const banner = await this.findAdminBanner(actor, id);
    const removed = await this.prisma.studentDashboardBanner.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        updatedById: actor.userId,
      },
    });
    await Promise.all([
      this.deleteManagedImage(banner.mediaUrl, banner.organizationId),
      this.deleteManagedImage(banner.posterUrl, banner.organizationId),
    ]);
    return removed;
  }

  async reorder(
    actor: CurrentUser,
    requestedOrganizationId: number,
    sessionId: number | undefined,
    bannerIds: number[],
  ) {
    if (!sessionId) throw new BadRequestException('sessionId is required');
    const organizationId = await this.resolveOrganizationId(
      actor,
      requestedOrganizationId,
    );
    await this.assertSessions(organizationId, [sessionId]);
    const banners = await this.prisma.studentDashboardBanner.findMany({
      where: {
        organizationId,
        deletedAt: null,
        sessions: { some: { sessionId } },
      },
      select: { id: true },
    });
    const expected = banners.map(({ id }) => id).sort((a, b) => a - b);
    const received = this.uniqueIds(bannerIds).sort((a, b) => a - b);
    if (
      expected.length !== received.length ||
      expected.some((id, index) => id !== received[index])
    ) {
      throw new BadRequestException(
        'Banner order must contain every banner in this session exactly once',
      );
    }
    await this.prisma.$transaction(
      bannerIds.map((id, displayOrder) =>
        this.prisma.studentDashboardBanner.update({
          where: { id },
          data: { displayOrder, updatedById: actor.userId },
        }),
      ),
    );
    return this.listAdmin(actor, organizationId, sessionId);
  }

  async listForStudent(organizationId: number, sessionId: number | null) {
    if (!sessionId) return [];
    const now = new Date();
    return this.prisma.studentDashboardBanner.findMany({
      where: {
        organizationId,
        deletedAt: null,
        isActive: true,
        sessions: { some: { sessionId } },
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
    });
  }

  async uploadImage(
    actor: CurrentUser,
    id: number,
    kind: 'media' | 'poster',
    file?: ImageFile,
  ) {
    if (kind !== 'media' && kind !== 'poster')
      throw new BadRequestException('Upload kind must be media or poster');
    const banner = await this.findAdminBanner(actor, id);
    if (!file?.buffer?.length)
      throw new BadRequestException('Select an image to upload');
    if (!IMAGE_TYPES.has(file.mimetype))
      throw new BadRequestException(
        'Image must be JPEG, PNG, WebP, GIF, or AVIF',
      );
    const organization = await this.prisma.organization.findUnique({
      where: { id: banner.organizationId },
      select: { id: true, uuid: true },
    });
    if (!organization) throw new NotFoundException('Organization not found');
    const object = await this.managedObjects.upload({
      organization,
      owner: {
        category: 'student-dashboard-banner-images',
        id: banner.id,
        uuid: banner.uuid,
      },
      uploadedById: actor.userId,
      originalFileName: file.originalname,
      mimeType: file.mimetype,
      body: file.buffer,
    });
    const url = this.imageUrl(object.id, object.uuid);
    const field = kind === 'poster' ? 'posterUrl' : 'mediaUrl';
    const previous = banner[field];
    try {
      const updated = await this.prisma.studentDashboardBanner.update({
        where: { id },
        data: {
          [field]: url,
          ...(kind === 'media'
            ? {
                mediaType: StudentDashboardBannerMediaType.IMAGE,
                videoProvider: null,
                autoplay: false,
              }
            : {}),
          updatedById: actor.userId,
        },
        include: {
          sessions: {
            include: {
              session: { select: { id: true, name: true, code: true } },
            },
          },
        },
      });
      await this.deleteManagedImage(previous, banner.organizationId);
      return updated;
    } catch (error) {
      await this.managedObjects
        .delete(object.id, object.uuid, banner.organizationId)
        .catch(() => undefined);
      throw error;
    }
  }

  async getImage(actor: CurrentUser, objectId: number, objectUuid: string) {
    if (!actor.roles?.includes('SUPER_ADMIN') && !actor.organizationId) {
      throw new ForbiddenException('Organization context is required');
    }
    const stored = await this.managedObjects.open({
      id: objectId,
      uuid: objectUuid,
      organizationId: actor.roles?.includes('SUPER_ADMIN')
        ? undefined
        : actor.organizationId,
    });
    const mimeType = stored.contentType ?? stored.object.mimeType;
    if (
      !stored.object.objectKey.includes('/student-dashboard-banner-images/') ||
      !IMAGE_TYPES.has(mimeType)
    ) {
      throw new NotFoundException('Dashboard banner image not found');
    }
    return {
      content: stored.stream,
      fileName: stored.object.originalFileName,
      mimeType,
    };
  }

  async recordEvent(
    actor: CurrentUser,
    bannerUuid: string,
    dto: DashboardBannerEventDto,
  ) {
    const student = await this.prisma.student.findUnique({
      where: { userId: actor.userId },
      select: { id: true, organizationId: true },
    });
    if (!student?.organizationId)
      throw new ForbiddenException('Student profile is required');
    const enrollment = await this.prisma.studentEnrollment.findFirst({
      where: {
        studentId: student.id,
        organizationId: student.organizationId,
        isActive: true,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
      select: { sessionId: true },
    });
    const banner = await this.prisma.studentDashboardBanner.findFirst({
      where: {
        uuid: bannerUuid,
        organizationId: student.organizationId,
        deletedAt: null,
        isActive: true,
        sessions: { some: { sessionId: enrollment?.sessionId ?? -1 } },
      },
    });
    if (!banner) throw new NotFoundException('Dashboard banner not found');
    const eventType = this.bannerEventType(dto.eventType);
    const authSession = actor.activitySessionUuid
      ? await this.prisma.userActivitySession.findFirst({
          where: {
            uuid: actor.activitySessionUuid,
            userId: actor.userId,
            studentId: student.id,
            endedAt: null,
          },
          select: { id: true },
        })
      : null;
    const event = await this.prisma.studentDashboardBannerEvent.upsert({
      where: { clientEventId: dto.clientEventId },
      update: {},
      create: {
        clientEventId: dto.clientEventId,
        organizationId: student.organizationId,
        studentId: student.id,
        userActivitySessionId: authSession?.id,
        bannerId: banner.id,
        eventType,
        videoPositionSeconds: dto.videoPositionSeconds,
        titleSnapshot: banner.title,
        destinationUrlSnapshot: banner.destinationUrl,
        metadata: {
          mediaType: banner.mediaType,
          videoProvider: banner.videoProvider,
          sessionId: enrollment?.sessionId,
        },
      },
    });
    return { eventUuid: event.uuid, occurredAt: event.occurredAt };
  }

  private bannerEventType(value: DashboardBannerEventDto['eventType']) {
    const mapping: Record<
      DashboardBannerEventDto['eventType'],
      StudentDashboardBannerEventType
    > = {
      DASHBOARD_BANNER_IMPRESSION: StudentDashboardBannerEventType.IMPRESSION,
      DASHBOARD_BANNER_CTA_CLICK: StudentDashboardBannerEventType.CTA_CLICK,
      DASHBOARD_BANNER_VIDEO_PLAY: StudentDashboardBannerEventType.VIDEO_PLAY,
      DASHBOARD_BANNER_VIDEO_PAUSE: StudentDashboardBannerEventType.VIDEO_PAUSE,
      DASHBOARD_BANNER_VIDEO_COMPLETE:
        StudentDashboardBannerEventType.VIDEO_COMPLETE,
    };
    return mapping[value];
  }
  private assertTitle(type: StudentDashboardBannerMediaType, title: string) {
    if (type === StudentDashboardBannerMediaType.IMAGE && !title.trim()) {
      throw new BadRequestException('Heading is required for image banners');
    }
  }

  private normalizeMedia(
    type: StudentDashboardBannerMediaType,
    rawUrl: string,
  ) {
    const url = rawUrl.trim();
    if (type === StudentDashboardBannerMediaType.IMAGE)
      return { url, provider: null };
    if (!url.startsWith('https://'))
      throw new BadRequestException('Video URL must use HTTPS');
    return { url, provider: this.videoProvider(url) };
  }

  private videoProvider(value: string) {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (
      host === 'youtu.be' ||
      host === 'youtube.com' ||
      host.endsWith('.youtube.com')
    )
      return StudentDashboardBannerVideoProvider.YOUTUBE;
    if (host === 'vimeo.com' || host.endsWith('.vimeo.com'))
      return StudentDashboardBannerVideoProvider.VIMEO;
    if (/\.m3u8(?:$|\?)/i.test(value))
      return StudentDashboardBannerVideoProvider.HLS;
    if (/\.(?:mp4|webm|ogg)(?:$|\?)/i.test(value))
      return StudentDashboardBannerVideoProvider.DIRECT;
    return StudentDashboardBannerVideoProvider.EXTERNAL;
  }

  private async findAdminBanner(actor: CurrentUser, id: number) {
    const banner = await this.prisma.studentDashboardBanner.findFirst({
      where: { id, deletedAt: null },
    });
    if (!banner) throw new NotFoundException('Dashboard banner not found');
    await this.resolveOrganizationId(actor, banner.organizationId);
    return banner;
  }

  private async resolveOrganizationId(actor: CurrentUser, requested?: number) {
    if (actor.roles?.includes('SUPER_ADMIN')) {
      if (!requested)
        throw new BadRequestException('organizationId is required');
      const exists = await this.prisma.organization.findUnique({
        where: { id: requested },
        select: { id: true },
      });
      if (!exists) throw new NotFoundException('Organization not found');
      return requested;
    }
    if (!actor.organizationId)
      throw new ForbiddenException('Organization context is required');
    if (requested && requested !== actor.organizationId)
      throw new ForbiddenException('Cannot manage another organization');
    return actor.organizationId;
  }

  private async assertSessions(organizationId: number, sessionIds: number[]) {
    if (!sessionIds.length)
      throw new BadRequestException('Select at least one session');
    const count = await this.prisma.session.count({
      where: { id: { in: sessionIds }, organizationId },
    });
    if (count !== sessionIds.length)
      throw new BadRequestException(
        'Every selected session must belong to this organization',
      );
  }

  private assertDates(startsAt?: string | null, endsAt?: string | null) {
    if (startsAt && endsAt && new Date(startsAt) >= new Date(endsAt))
      throw new BadRequestException('End date must be after start date');
  }

  private uniqueIds(ids: number[]) {
    return [...new Set(ids)];
  }

  private imageUrl(id: number, uuid: string) {
    const base = (
      process.env.PUBLIC_API_URL ??
      `http://localhost:${process.env.PORT ?? '5000'}`
    ).replace(/\/$/, '');
    return `${base}/api/v1/student-dashboard-banners/media/${id}/${uuid}`;
  }

  private managedIdentity(url: string | null) {
    if (!url) return null;
    const match = url.match(
      /\/api\/v1\/student-dashboard-banners\/media\/(\d+)\/([0-9a-f-]{36})$/i,
    );
    return match ? { id: Number(match[1]), uuid: match[2] } : null;
  }

  private async deleteManagedImage(url: string | null, organizationId: number) {
    const object = this.managedIdentity(url);
    if (object)
      await this.managedObjects
        .delete(object.id, object.uuid, organizationId)
        .catch(() => undefined);
  }
}
