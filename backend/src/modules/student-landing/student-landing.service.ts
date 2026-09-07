import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  StudentActivityEventType,
  StudentLandingCardType,
} from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { ManagedObjectService } from '../storage/managed-object.service';
import { ActivityService } from '../activity/services/activity.service';
import { CurrentUser } from '../auth/types/current-user.types';
import {
  CreateStudentLandingCardDto,
  UpdateStudentLandingCardDto,
} from './dto/student-landing-card.dto';

const LMS_SYSTEM_KEY = 'LMS';
const LMS_DESTINATION = '/student/dashboard';
const LANDING_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
type LandingCardImageFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

@Injectable()
export class StudentLandingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
    private readonly managedObjects: ManagedObjectService,
  ) {}

  async listForAdmin(actor: CurrentUser, requestedOrganizationId: number) {
    const organizationId = await this.resolveOrganizationId(
      actor,
      requestedOrganizationId,
    );
    await this.ensureSystemCard(organizationId);
    return this.prisma.studentLandingCard.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
    });
  }

  async create(
    actor: CurrentUser,
    requestedOrganizationId: number,
    dto: CreateStudentLandingCardDto,
  ) {
    const organizationId = await this.resolveOrganizationId(
      actor,
      requestedOrganizationId,
    );
    await this.ensureSystemCard(organizationId);
    const maximum = await this.prisma.studentLandingCard.aggregate({
      where: { organizationId, deletedAt: null },
      _max: { displayOrder: true },
    });
    return this.prisma.studentLandingCard.create({
      data: {
        organizationId,
        type: StudentLandingCardType.CUSTOM,
        title: dto.title.trim(),
        description: dto.description.trim(),
        ctaLabel: dto.ctaLabel.trim(),
        destinationUrl: dto.destinationUrl.trim(),
        imageUrl: dto.imageUrl?.trim() || null,
        imageAlt: dto.imageAlt?.trim() || null,
        openInNewTab: dto.openInNewTab ?? true,
        displayOrder: (maximum._max.displayOrder ?? 0) + 1,
      },
    });
  }

  async update(
    actor: CurrentUser,
    id: number,
    dto: UpdateStudentLandingCardDto,
  ) {
    const card = await this.findAdminCard(actor, id);
    const isSystem = card.type === StudentLandingCardType.SYSTEM_LMS;
    const nextImageUrl =
      dto.imageUrl !== undefined ? dto.imageUrl?.trim() || null : undefined;
    const updated = await this.prisma.studentLandingCard.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description.trim() }
          : {}),
        ...(dto.ctaLabel !== undefined
          ? { ctaLabel: dto.ctaLabel.trim() }
          : {}),
        ...(!isSystem && dto.destinationUrl !== undefined
          ? { destinationUrl: dto.destinationUrl.trim() }
          : {}),
        ...(dto.imageUrl !== undefined ? { imageUrl: nextImageUrl } : {}),
        ...(dto.imageAlt !== undefined
          ? { imageAlt: dto.imageAlt?.trim() || null }
          : {}),
        ...(!isSystem && dto.openInNewTab !== undefined
          ? { openInNewTab: dto.openInNewTab }
          : {}),
        ...(!isSystem && dto.isActive !== undefined
          ? { isActive: dto.isActive }
          : {}),
        ...(isSystem
          ? {
              destinationUrl: LMS_DESTINATION,
              openInNewTab: false,
              isActive: true,
              displayOrder: 0,
            }
          : {}),
      },
    });
    if (dto.imageUrl !== undefined && nextImageUrl !== card.imageUrl) {
      await this.deleteManagedImage(card.imageUrl, card.organizationId);
    }
    return updated;
  }

  async remove(actor: CurrentUser, id: number) {
    const card = await this.findAdminCard(actor, id);
    if (card.type === StudentLandingCardType.SYSTEM_LMS) {
      throw new BadRequestException('The LMS card cannot be deleted');
    }
    const removed = await this.prisma.studentLandingCard.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    await this.deleteManagedImage(card.imageUrl, card.organizationId);
    return removed;
  }

  async uploadImage(
    actor: CurrentUser,
    id: number,
    file: LandingCardImageFile | undefined,
  ) {
    const card = await this.findAdminCard(actor, id);
    const validFile = this.validateImage(file);
    const organization = await this.prisma.organization.findUnique({
      where: { id: card.organizationId },
      select: { id: true, uuid: true },
    });
    if (!organization) throw new NotFoundException('Organization not found');

    const storedObject = await this.managedObjects.upload({
      organization,
      owner: {
        category: 'student-landing-images',
        id: card.id,
        uuid: card.uuid,
      },
      uploadedById: actor.userId,
      originalFileName: validFile.originalname,
      mimeType: validFile.mimetype,
      body: validFile.buffer,
    });
    const imageUrl = this.cardImageUrl(storedObject.id, storedObject.uuid);
    try {
      const updated = await this.prisma.studentLandingCard.update({
        where: { id: card.id },
        data: { imageUrl },
      });
      await this.deleteManagedImage(card.imageUrl, card.organizationId);
      return updated;
    } catch (error) {
      await this.managedObjects
        .delete(storedObject.id, storedObject.uuid, card.organizationId)
        .catch(() => undefined);
      throw error;
    }
  }

  async deleteImage(actor: CurrentUser, id: number) {
    const card = await this.findAdminCard(actor, id);
    const updated = await this.prisma.studentLandingCard.update({
      where: { id: card.id },
      data: { imageUrl: null },
    });
    await this.deleteManagedImage(card.imageUrl, card.organizationId);
    return updated;
  }

  async getImage(objectId: number, objectUuid: string) {
    const stored = await this.managedObjects.open({
      id: objectId,
      uuid: objectUuid,
    });
    const mimeType = stored.contentType ?? stored.object.mimeType;
    if (
      !stored.object.objectKey.includes('/student-landing-images/') ||
      !LANDING_IMAGE_TYPES.has(mimeType)
    ) {
      throw new NotFoundException('Landing card image not found');
    }
    return {
      content: stored.stream,
      fileName: stored.object.originalFileName,
      mimeType,
    };
  }

  async reorder(
    actor: CurrentUser,
    requestedOrganizationId: number,
    cardIds: number[],
  ) {
    const organizationId = await this.resolveOrganizationId(
      actor,
      requestedOrganizationId,
    );
    const cards = await this.prisma.studentLandingCard.findMany({
      where: { organizationId, deletedAt: null },
      select: { id: true, type: true },
    });
    const customIds = cards
      .filter((card) => card.type === StudentLandingCardType.CUSTOM)
      .map((card) => card.id);
    if (
      cardIds.length !== customIds.length ||
      new Set(cardIds).size !== cardIds.length ||
      cardIds.some((id) => !customIds.includes(id))
    ) {
      throw new BadRequestException(
        'cardIds must contain every custom card once',
      );
    }
    await this.prisma.$transaction([
      ...cards
        .filter((card) => card.type === StudentLandingCardType.SYSTEM_LMS)
        .map((card) =>
          this.prisma.studentLandingCard.update({
            where: { id: card.id },
            data: { displayOrder: 0 },
          }),
        ),
      ...cardIds.map((id, index) =>
        this.prisma.studentLandingCard.update({
          where: { id },
          data: { displayOrder: index + 1 },
        }),
      ),
    ]);
    return this.listForAdmin(actor, organizationId);
  }

  async listForStudent(actor: CurrentUser) {
    const student = await this.findStudent(actor);
    await this.ensureSystemCard(student.organizationId);
    return this.prisma.studentLandingCard.findMany({
      where: {
        organizationId: student.organizationId,
        deletedAt: null,
        isActive: true,
      },
      orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
    });
  }

  async recordPageView(actor: CurrentUser, clientEventId: string) {
    const student = await this.findStudent(actor);
    const userActivitySessionId = await this.findActivitySessionId(
      actor,
      student.id,
    );
    const event = await this.activityService.recordStudentEvent({
      organizationId: student.organizationId,
      studentId: student.id,
      userActivitySessionId,
      eventType: StudentActivityEventType.LANDING_PAGE_VIEW,
      clientEventId,
    });
    return { eventUuid: event.uuid, occurredAt: event.occurredAt };
  }

  async recordCardClick(
    actor: CurrentUser,
    cardUuid: string,
    clientEventId: string,
  ) {
    const student = await this.findStudent(actor);
    const card = await this.prisma.studentLandingCard.findFirst({
      where: {
        uuid: cardUuid,
        organizationId: student.organizationId,
        deletedAt: null,
        isActive: true,
      },
    });
    if (!card) throw new NotFoundException('Landing card not found');
    const userActivitySessionId = await this.findActivitySessionId(
      actor,
      student.id,
    );
    const event = await this.activityService.recordStudentEvent({
      organizationId: student.organizationId,
      studentId: student.id,
      userActivitySessionId,
      landingCardId: card.id,
      eventType: StudentActivityEventType.LANDING_CARD_CLICK,
      clientEventId,
      landingCardTitleSnapshot: card.title,
      landingCardCtaSnapshot: card.ctaLabel,
      landingCardUrlSnapshot: card.destinationUrl,
      metadata: { openInNewTab: card.openInNewTab, cardType: card.type },
    });
    return { eventUuid: event.uuid, occurredAt: event.occurredAt };
  }

  private async ensureSystemCard(organizationId: number) {
    return this.prisma.studentLandingCard.upsert({
      where: {
        organizationId_systemKey: { organizationId, systemKey: LMS_SYSTEM_KEY },
      },
      update: {
        type: StudentLandingCardType.SYSTEM_LMS,
        destinationUrl: LMS_DESTINATION,
        openInNewTab: false,
        displayOrder: 0,
        isActive: true,
        deletedAt: null,
      },
      create: {
        organizationId,
        type: StudentLandingCardType.SYSTEM_LMS,
        systemKey: LMS_SYSTEM_KEY,
        title: 'LMS',
        description:
          'Access courses, exams, learning resources and your academic progress.',
        ctaLabel: 'Go to LMS',
        destinationUrl: LMS_DESTINATION,
        imageAlt: 'Illustration of academic dashboard resources and progress',
        openInNewTab: false,
        displayOrder: 0,
      },
    });
  }

  private async findAdminCard(actor: CurrentUser, id: number) {
    const card = await this.prisma.studentLandingCard.findFirst({
      where: { id, deletedAt: null },
    });
    if (!card) throw new NotFoundException('Landing card not found');
    await this.resolveOrganizationId(actor, card.organizationId);
    return card;
  }

  private async resolveOrganizationId(actor: CurrentUser, requested?: number) {
    if (actor.roles?.includes('SUPER_ADMIN')) {
      if (!requested)
        throw new BadRequestException('organizationId is required');
      const organization = await this.prisma.organization.findUnique({
        where: { id: requested },
        select: { id: true },
      });
      if (!organization) throw new NotFoundException('Organization not found');
      return requested;
    }
    if (!actor.organizationId) {
      throw new ForbiddenException('Organization context is required');
    }
    if (requested && requested !== actor.organizationId) {
      throw new ForbiddenException('Cannot manage another organization');
    }
    return actor.organizationId;
  }

  private async findStudent(actor: CurrentUser) {
    const student = await this.prisma.student.findUnique({
      where: { userId: actor.userId },
      select: { id: true, organizationId: true },
    });
    if (!student) throw new ForbiddenException('Student profile is required');
    if (!student.organizationId) {
      throw new ForbiddenException('Student organization context is required');
    }
    return { id: student.id, organizationId: student.organizationId };
  }

  private async findActivitySessionId(actor: CurrentUser, studentId: number) {
    if (!actor.activitySessionUuid) return null;
    const session = await this.prisma.userActivitySession.findFirst({
      where: {
        uuid: actor.activitySessionUuid,
        userId: actor.userId,
        studentId,
        endedAt: null,
      },
      select: { id: true },
    });
    return session?.id ?? null;
  }

  private validateImage(file: LandingCardImageFile | undefined) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Select an image to upload');
    }
    if (!LANDING_IMAGE_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Image must be JPEG, PNG, or WebP');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Image must not exceed 5 MB');
    }
    return file;
  }

  private cardImageUrl(objectId: number, objectUuid: string) {
    const publicBaseUrl = (
      process.env.PUBLIC_API_URL ??
      `http://localhost:${process.env.PORT ?? '5000'}`
    ).replace(/\/$/, '');
    return `${publicBaseUrl}/api/v1/student-landing-cards/images/${objectId}/${objectUuid}`;
  }

  private managedImageIdentity(imageUrl: string | null) {
    if (!imageUrl) return null;
    const match = imageUrl.match(
      /\/api\/v1\/student-landing-cards\/images\/(\d+)\/([0-9a-f-]{36})$/i,
    );
    if (!match) return null;
    return { id: Number(match[1]), uuid: match[2] };
  }

  private async deleteManagedImage(
    imageUrl: string | null,
    organizationId: number,
  ) {
    const identity = this.managedImageIdentity(imageUrl);
    if (!identity) return;
    await this.managedObjects
      .delete(identity.id, identity.uuid, organizationId)
      .catch(() => undefined);
  }
}
