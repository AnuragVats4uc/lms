import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RegistrationPageStatus } from '@prisma/client';

import { PasswordService } from '../auth/services/password.service';
import { CurrentUser } from '../auth/types/current-user.types';
import { PrismaService } from '../../prisma';
import {
  CreateRegistrationPageDto,
  PublicRegistrationSubmitDto,
  RegistrationFieldDto,
  UpdateRegistrationPageDto,
} from './dto/registration-page.dto';
import {
  CreateRegistrationMasterOptionDto,
  RegistrationMasterQueryDto,
  UpdateRegistrationMasterOptionDto,
} from './dto/registration-master.dto';

const DEFAULT_PRIMARY_COLOR = '#059669';
const DEFAULT_ACCENT_COLOR = '#2563EB';
const STUDENT_ROLE_CODE = 'STUDENT';

type RegistrationPageWithRelations =
  Prisma.OrganizationRegistrationPageGetPayload<{
    include: {
      organization: true;
      session: true;
      fields: { include: { options: true } };
      selectedCourses: {
        include: { sessionCourse: { include: { course: true } } };
      };
      selectedEducationOptions: { include: { educationOption: true } };
      selectedDigitalLibraryLocations: {
        include: { digitalLibraryLocation: true };
      };
    };
  }>;
type RegistrationSessionCourse = Prisma.SessionCourseGetPayload<{
  include: { course: true };
}>;
type RegistrationEducationOption =
  Prisma.OrganizationEducationOptionGetPayload<true>;
type RegistrationDigitalLibraryLocation =
  Prisma.OrganizationDigitalLibraryLocationGetPayload<true>;

@Injectable()
export class RegistrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  async getPublicPage(slug: string) {
    const page = await this.findPageBySlug(slug);
    this.ensurePageIsPubliclyOpen(page);

    const [courses, educationOptions, digitalLibraryLocations] =
      await Promise.all([
        this.findConfiguredSessionCourses(page),
        this.findConfiguredEducationOptions(page),
        this.findConfiguredDigitalLibraryLocations(page),
      ]);

    return {
      organization: {
        name: page.organization.name,
        logo: page.logoOverride ?? page.organization.logo,
        email: page.supportEmail ?? page.organization.email,
        phone: page.supportPhone ?? page.organization.phone,
      },
      registration: {
        slug: page.slug,
        title: page.title,
        description: page.description,
        primaryColor: page.primaryColor ?? DEFAULT_PRIMARY_COLOR,
        accentColor: page.accentColor ?? DEFAULT_ACCENT_COLOR,
        heroImage: page.heroImage,
        submitButtonText: page.submitButtonText,
        successTitle: page.successTitle,
        successMessage: this.successMessage(page),
        registrationEnabled: page.registrationEnabled,
      },
      fields: this.toFieldResponses(this.publicCustomFields(page.fields)),
      educationOptions: educationOptions.map((option) =>
        this.toPublicMasterOptionResponse(option),
      ),
      digitalLibraryLocations: digitalLibraryLocations.map((location) =>
        this.toPublicMasterOptionResponse(location),
      ),
      courses: courses.map((sessionCourse) => ({
        uuid: sessionCourse.uuid,
        name: sessionCourse.displayName ?? sessionCourse.course.name,
        description:
          sessionCourse.description ?? sessionCourse.course.description,
      })),
      session: {
        name: page.session.name,
      },
    };
  }

  async submitPublicRegistration(
    slug: string,
    dto: PublicRegistrationSubmitDto,
  ) {
    const page = await this.findPageBySlug(slug);
    this.ensurePageIsPubliclyOpen(page);

    const selectedUuids = [...new Set(dto.selectedSessionCourseUuids)];
    if (!selectedUuids.length) {
      throw new BadRequestException('Select at least one course');
    }

    const [selectedCourses, educationOption, digitalLibraryLocation] =
      await Promise.all([
        this.findSelectedSessionCourses(page, selectedUuids),
        this.findConfiguredEducationOption(page, dto.educationOptionUuid),
        this.findConfiguredDigitalLibraryLocation(
          page,
          dto.digitalLibraryLocationUuid,
        ),
      ]);

    if (selectedCourses.length !== selectedUuids.length) {
      throw new BadRequestException('One or more selected courses are invalid');
    }
    if (!educationOption) {
      throw new BadRequestException('Education option is invalid');
    }
    if (!digitalLibraryLocation) {
      throw new BadRequestException('Digital Library Location is invalid');
    }

    const password = await this.passwordService.hash(dto.password);
    const email = dto.email;
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await this.findOrCreateRegistrationUser(tx, page, dto, {
        email,
        password,
      });
      const student = await this.findOrCreateStudent(tx, page, user.id, dto);
      await this.assignStudentRole(tx, user.id, page.organizationId);

      const enrollment = await tx.studentEnrollment.upsert({
        where: {
          studentId_sessionId: {
            studentId: student.id,
            sessionId: page.sessionId,
          },
        },
        create: {
          organizationId: page.organizationId,
          sessionId: page.sessionId,
          studentId: student.id,
        },
        update: {
          isActive: true,
          status: 'ACTIVE',
        },
      });

      await Promise.all(
        selectedCourses.map((sessionCourse) =>
          tx.studentCourseEnrollment.upsert({
            where: {
              enrollmentId_sessionCourseId: {
                enrollmentId: enrollment.id,
                sessionCourseId: sessionCourse.id,
              },
            },
            create: {
              enrollmentId: enrollment.id,
              sessionCourseId: sessionCourse.id,
            },
            update: {
              isActive: true,
              status: 'ACTIVE',
            },
          }),
        ),
      );

      await this.saveRegistrationMasterAnswers(tx, page.id, student.id, {
        education: educationOption.uuid,
        digital_library_location: digitalLibraryLocation.uuid,
      });

      return { enrollment, student, user };
    });

    return {
      successTitle: page.successTitle,
      successMessage: this.successMessage(page),
      student: {
        uuid: result.student.uuid,
        firstName: dto.firstName,
        lastName: dto.lastName ?? null,
      },
      organization: {
        name: page.organization.name,
      },
      session: {
        name: page.session.name,
      },
      selectedCourses: selectedCourses.map((sessionCourse) => ({
        uuid: sessionCourse.uuid,
        name: sessionCourse.displayName ?? sessionCourse.course.name,
      })),
      loginAvailable: true,
      loginEmail: email,
    };
  }

  async listForOrganization(organizationId: number, actor: CurrentUser) {
    this.assertCanAccessOrganization(organizationId, actor);
    await this.ensureOrganizationExists(organizationId);

    const pages = await this.prisma.organizationRegistrationPage.findMany({
      where: { organizationId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: this.adminInclude(),
    });

    return {
      items: await Promise.all(pages.map((page) => this.toAdminResponse(page))),
      meta: {
        page: 1,
        limit: pages.length,
        total: pages.length,
        totalPages: 1,
      },
    };
  }

  async getAdminPage(
    organizationId: number,
    pageId: number,
    actor: CurrentUser,
  ) {
    this.assertCanAccessOrganization(organizationId, actor);
    const page = await this.findAdminPage(organizationId, pageId);
    return this.toAdminResponse(page);
  }

  async listEducationOptions(
    organizationId: number,
    query: RegistrationMasterQueryDto,
    actor: CurrentUser,
  ) {
    this.assertCanAccessOrganization(organizationId, actor);
    await this.ensureOrganizationExists(organizationId);
    const normalized = this.normalizeMasterQuery(query);
    const where = this.masterWhere(organizationId, normalized);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.organizationEducationOption.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        skip: (normalized.page - 1) * normalized.limit,
        take: normalized.limit,
      }),
      this.prisma.organizationEducationOption.count({ where }),
    ]);

    return this.toMasterList(items, total, normalized);
  }

  async createEducationOption(
    organizationId: number,
    dto: CreateRegistrationMasterOptionDto,
    actor: CurrentUser,
  ) {
    this.assertCanAccessOrganization(organizationId, actor);
    await this.ensureOrganizationExists(organizationId);
    await this.ensureEducationNameIsUnique(organizationId, dto.name);

    const option = await this.prisma.organizationEducationOption.create({
      data: {
        organizationId,
        name: dto.name,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });

    return this.toMasterOptionResponse(option);
  }

  async updateEducationOption(
    organizationId: number,
    optionId: number,
    dto: UpdateRegistrationMasterOptionDto,
    actor: CurrentUser,
  ) {
    this.assertCanAccessOrganization(organizationId, actor);
    await this.findEducationOption(organizationId, optionId);
    if (dto.name) {
      await this.ensureEducationNameIsUnique(
        organizationId,
        dto.name,
        optionId,
      );
    }

    const option = await this.prisma.organizationEducationOption.update({
      where: { id: optionId },
      data: {
        name: dto.name,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
    });

    return this.toMasterOptionResponse(option);
  }

  async deactivateEducationOption(
    organizationId: number,
    optionId: number,
    actor: CurrentUser,
  ) {
    return this.updateEducationOption(
      organizationId,
      optionId,
      { isActive: false },
      actor,
    );
  }

  async listDigitalLibraryLocations(
    organizationId: number,
    query: RegistrationMasterQueryDto,
    actor: CurrentUser,
  ) {
    this.assertCanAccessOrganization(organizationId, actor);
    await this.ensureOrganizationExists(organizationId);
    const normalized = this.normalizeMasterQuery(query);
    const where = this.masterWhere(organizationId, normalized);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.organizationDigitalLibraryLocation.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        skip: (normalized.page - 1) * normalized.limit,
        take: normalized.limit,
      }),
      this.prisma.organizationDigitalLibraryLocation.count({ where }),
    ]);

    return this.toMasterList(items, total, normalized);
  }

  async createDigitalLibraryLocation(
    organizationId: number,
    dto: CreateRegistrationMasterOptionDto,
    actor: CurrentUser,
  ) {
    this.assertCanAccessOrganization(organizationId, actor);
    await this.ensureOrganizationExists(organizationId);
    await this.ensureLocationNameIsUnique(organizationId, dto.name);

    const location =
      await this.prisma.organizationDigitalLibraryLocation.create({
        data: {
          organizationId,
          name: dto.name,
          sortOrder: dto.sortOrder ?? 0,
          isActive: dto.isActive ?? true,
        },
      });

    return this.toMasterOptionResponse(location);
  }

  async updateDigitalLibraryLocation(
    organizationId: number,
    locationId: number,
    dto: UpdateRegistrationMasterOptionDto,
    actor: CurrentUser,
  ) {
    this.assertCanAccessOrganization(organizationId, actor);
    await this.findDigitalLibraryLocation(organizationId, locationId);
    if (dto.name) {
      await this.ensureLocationNameIsUnique(
        organizationId,
        dto.name,
        locationId,
      );
    }

    const location =
      await this.prisma.organizationDigitalLibraryLocation.update({
        where: { id: locationId },
        data: {
          name: dto.name,
          sortOrder: dto.sortOrder,
          isActive: dto.isActive,
        },
      });

    return this.toMasterOptionResponse(location);
  }

  async deactivateDigitalLibraryLocation(
    organizationId: number,
    locationId: number,
    actor: CurrentUser,
  ) {
    return this.updateDigitalLibraryLocation(
      organizationId,
      locationId,
      { isActive: false },
      actor,
    );
  }

  async createPage(
    organizationId: number,
    dto: CreateRegistrationPageDto,
    actor: CurrentUser,
  ) {
    this.assertCanAccessOrganization(organizationId, actor);
    await this.ensureSessionBelongsToOrganization(
      organizationId,
      dto.sessionId,
    );
    await this.ensureSlugIsUnique(dto.slug);
    const selections = await this.resolvePageSelections(
      organizationId,
      dto.sessionId,
      dto,
    );

    const page = await this.prisma.$transaction(async (tx) => {
      const created = await tx.organizationRegistrationPage.create({
        data: {
          organizationId,
          sessionId: dto.sessionId,
          slug: dto.slug,
          title: dto.title ?? 'Student Registration',
          description: dto.description,
          logoOverride: dto.logoOverride,
          heroImage: dto.heroImage,
          primaryColor: dto.primaryColor,
          accentColor: dto.accentColor,
          supportEmail: dto.supportEmail,
          supportPhone: dto.supportPhone,
          submitButtonText: dto.submitButtonText ?? 'Submit Registration',
          successTitle: dto.successTitle ?? 'Registration Successful',
          successMessage: dto.successMessage,
          registrationEnabled: dto.registrationEnabled ?? false,
          status: dto.status ?? RegistrationPageStatus.DRAFT,
        },
      });
      await this.replaceFields(
        tx,
        created.id,
        dto.fields ?? this.defaultFields(),
      );
      await this.replacePageSelections(tx, created.id, selections);
      return created;
    });

    return this.getAdminPage(organizationId, page.id, actor);
  }

  async updatePage(
    organizationId: number,
    pageId: number,
    dto: UpdateRegistrationPageDto,
    actor: CurrentUser,
  ) {
    this.assertCanAccessOrganization(organizationId, actor);
    const existing = await this.findAdminPage(organizationId, pageId);

    if (dto.sessionId) {
      await this.ensureSessionBelongsToOrganization(
        organizationId,
        dto.sessionId,
      );
    }
    if (dto.slug) {
      await this.ensureSlugIsUnique(dto.slug, pageId);
    }
    const targetSessionId = dto.sessionId ?? existing.sessionId;
    const selections = await this.resolvePageSelections(
      organizationId,
      targetSessionId,
      dto,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.organizationRegistrationPage.update({
        where: { id: pageId },
        data: this.toUpdateInput(dto),
      });

      if (dto.fields) {
        await this.replaceFields(tx, pageId, dto.fields);
      }
      await this.replacePageSelections(tx, pageId, selections);
    });

    return this.getAdminPage(organizationId, pageId, actor);
  }

  private async findPageBySlug(slug: string) {
    const page = await this.prisma.organizationRegistrationPage.findUnique({
      where: { slug: slug.trim().toLowerCase() },
      include: this.adminInclude(),
    });

    if (!page) {
      throw new NotFoundException('Registration page not found');
    }

    return page;
  }

  private adminInclude() {
    return {
      organization: true,
      session: true,
      fields: {
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }],
        include: {
          options: {
            where: { isActive: true },
            orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }],
          },
        },
      },
      selectedCourses: {
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }],
        include: {
          sessionCourse: {
            include: { course: true },
          },
        },
      },
      selectedEducationOptions: {
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }],
        include: { educationOption: true },
      },
      selectedDigitalLibraryLocations: {
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }],
        include: { digitalLibraryLocation: true },
      },
    };
  }

  private async findAdminPage(organizationId: number, pageId: number) {
    const page = await this.prisma.organizationRegistrationPage.findFirst({
      where: { id: pageId, organizationId },
      include: this.adminInclude(),
    });

    if (!page) {
      throw new NotFoundException('Registration page not found');
    }

    return page;
  }

  private async ensureOrganizationExists(organizationId: number) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
  }

  private async ensureSessionBelongsToOrganization(
    organizationId: number,
    sessionId: number,
  ) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, organizationId, isActive: true },
      select: { id: true },
    });
    if (!session) {
      throw new BadRequestException('Registration session is invalid');
    }
  }

  private async ensureSlugIsUnique(slug: string, excludeId?: number) {
    const existing = await this.prisma.organizationRegistrationPage.findFirst({
      where: {
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Registration slug already exists');
    }
  }

  private ensurePageIsPubliclyOpen(page: RegistrationPageWithRelations) {
    if (
      !page.isActive ||
      page.status !== RegistrationPageStatus.ACTIVE ||
      !page.registrationEnabled
    ) {
      throw new ForbiddenException('Student registration is currently closed');
    }
    if (!page.organization.isActive || page.organization.status !== 'ACTIVE') {
      throw new ForbiddenException('Student registration is currently closed');
    }
    if (!page.session.isActive || page.session.status === 'ARCHIVED') {
      throw new ForbiddenException('Registration session is unavailable');
    }
  }

  private findEligibleSessionCourses(
    page: RegistrationPageWithRelations,
    uuids?: string[],
  ): Promise<RegistrationSessionCourse[]> {
    return this.prisma.sessionCourse.findMany({
      where: {
        ...(uuids ? { uuid: { in: uuids } } : {}),
        sessionId: page.sessionId,
        isActive: true,
        isPublished: true,
        status: 'ACTIVE',
        session: {
          organizationId: page.organizationId,
          isActive: true,
        },
        course: {
          isActive: true,
          status: 'ACTIVE',
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      include: { course: true },
    });
  }

  private findSelectedSessionCourses(
    page: RegistrationPageWithRelations,
    uuids: string[],
  ): Promise<RegistrationSessionCourse[]> {
    const configuredUuids = new Set(
      page.selectedCourses.map((selection) => selection.sessionCourse.uuid),
    );
    if (!uuids.every((uuid) => configuredUuids.has(uuid))) {
      return Promise.resolve([] as RegistrationSessionCourse[]);
    }
    return this.findEligibleSessionCourses(page, uuids);
  }

  private async findOrCreateRegistrationUser(
    tx: Prisma.TransactionClient,
    page: RegistrationPageWithRelations,
    dto: PublicRegistrationSubmitDto,
    account: { email: string; password: string },
  ) {
    const userByEmail = await tx.user.findUnique({
      where: { email: account.email },
      include: { student: true },
    });
    const userByPhone = await tx.user.findUnique({
      where: { phone: dto.phone },
      include: { student: true },
    });

    if (userByEmail && userByPhone && userByEmail.id !== userByPhone.id) {
      throw new ConflictException('Email and phone belong to different users');
    }

    const existing = userByEmail ?? userByPhone;
    if (!existing) {
      return tx.user.create({
        data: {
          email: account.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          organizationId: page.organizationId,
          password: account.password,
          phone: dto.phone,
          isVerified: false,
        },
      });
    }

    if (
      existing.organizationId !== null &&
      existing.organizationId !== page.organizationId
    ) {
      throw new ConflictException(
        'Account already belongs to another organization',
      );
    }

    return tx.user.update({
      where: { id: existing.id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        organizationId: existing.organizationId ?? page.organizationId,
        password: account.password,
        phone: existing.phone ?? dto.phone,
      },
    });
  }

  private async findOrCreateStudent(
    tx: Prisma.TransactionClient,
    page: RegistrationPageWithRelations,
    userId: number,
    dto: PublicRegistrationSubmitDto,
  ) {
    const existing = await tx.student.findUnique({
      where: { userId },
      include: { profile: true },
    });

    if (existing) {
      if (
        existing.organizationId !== null &&
        existing.organizationId !== page.organizationId
      ) {
        throw new ConflictException(
          'Student already belongs to another organization',
        );
      }

      return tx.student.update({
        where: { id: existing.id },
        data: {
          organizationId: existing.organizationId ?? page.organizationId,
          isActive: true,
          status: 'ACTIVE',
          profile: {
            upsert: {
              create: this.profileInput(dto),
              update: this.profileInput(dto),
            },
          },
        },
      });
    }

    return tx.student.create({
      data: {
        organizationId: page.organizationId,
        studentCode: `STU-${userId}`,
        userId,
        profile: {
          create: this.profileInput(dto),
        },
      },
    });
  }

  private async assignStudentRole(
    tx: Prisma.TransactionClient,
    userId: number,
    organizationId: number,
  ) {
    const role =
      (await tx.role.findUnique({
        where: {
          scope_code: {
            scope: `ORG:${organizationId}`,
            code: STUDENT_ROLE_CODE,
          },
        },
      })) ??
      (await tx.role.findUnique({
        where: {
          scope_code: {
            scope: 'GLOBAL',
            code: STUDENT_ROLE_CODE,
          },
        },
      }));

    if (!role) {
      throw new NotFoundException('Student role not found');
    }

    const existing = await tx.userRole.findFirst({
      where: {
        userId,
        roleId: role.id,
        organizationId,
      },
    });

    if (existing) {
      await tx.userRole.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
      return;
    }

    await tx.userRole.create({
      data: {
        userId,
        roleId: role.id,
        organizationId,
      },
    });
  }

  private async saveRegistrationMasterAnswers(
    tx: Prisma.TransactionClient,
    registrationPageId: number,
    studentId: number,
    answers: Record<string, string>,
  ) {
    await Promise.all(
      Object.entries(answers).map(([fieldKey, value]) => {
        return tx.organizationRegistrationAnswer.upsert({
          where: {
            registrationPageId_studentId_fieldKey: {
              registrationPageId,
              studentId,
              fieldKey,
            },
          },
          create: {
            registrationPageId,
            studentId,
            fieldKey,
            value,
          },
          update: {
            value,
          },
        });
      }),
    );
  }

  private async resolvePageSelections(
    organizationId: number,
    sessionId: number,
    dto: Pick<
      CreateRegistrationPageDto | UpdateRegistrationPageDto,
      | 'selectedSessionCourseUuids'
      | 'selectedEducationOptionUuids'
      | 'selectedDigitalLibraryLocationUuids'
    >,
  ) {
    const [sessionCourseIds, educationOptionIds, digitalLibraryLocationIds] =
      await Promise.all([
        dto.selectedSessionCourseUuids === undefined
          ? Promise.resolve(undefined)
          : this.resolveSessionCourseIds(
              organizationId,
              sessionId,
              dto.selectedSessionCourseUuids,
            ),
        dto.selectedEducationOptionUuids === undefined
          ? Promise.resolve(undefined)
          : this.resolveEducationOptionIds(
              organizationId,
              dto.selectedEducationOptionUuids,
            ),
        dto.selectedDigitalLibraryLocationUuids === undefined
          ? Promise.resolve(undefined)
          : this.resolveDigitalLibraryLocationIds(
              organizationId,
              dto.selectedDigitalLibraryLocationUuids,
            ),
      ]);

    return {
      sessionCourseIds,
      educationOptionIds,
      digitalLibraryLocationIds,
    };
  }

  private async resolveSessionCourseIds(
    organizationId: number,
    sessionId: number,
    uuids: string[],
  ) {
    const uniqueUuids = this.uniqueUuids(uuids);
    if (!uniqueUuids.length) {
      return [];
    }

    const courses = await this.prisma.sessionCourse.findMany({
      where: {
        uuid: { in: uniqueUuids },
        sessionId,
        isActive: true,
        isPublished: true,
        status: 'ACTIVE',
        session: { organizationId, isActive: true },
        course: { isActive: true, status: 'ACTIVE' },
      },
      select: { id: true, uuid: true },
    });

    if (courses.length !== uniqueUuids.length) {
      throw new BadRequestException(
        'One or more registration courses are invalid',
      );
    }

    return uniqueUuids.map(
      (uuid) => courses.find((item) => item.uuid === uuid)!.id,
    );
  }

  private async resolveEducationOptionIds(
    organizationId: number,
    uuids: string[],
  ) {
    const uniqueUuids = this.uniqueUuids(uuids);
    if (!uniqueUuids.length) {
      return [];
    }

    const options = await this.prisma.organizationEducationOption.findMany({
      where: { uuid: { in: uniqueUuids }, organizationId, isActive: true },
      select: { id: true, uuid: true },
    });

    if (options.length !== uniqueUuids.length) {
      throw new BadRequestException(
        'One or more education options are invalid',
      );
    }

    return uniqueUuids.map(
      (uuid) => options.find((item) => item.uuid === uuid)!.id,
    );
  }

  private async resolveDigitalLibraryLocationIds(
    organizationId: number,
    uuids: string[],
  ) {
    const uniqueUuids = this.uniqueUuids(uuids);
    if (!uniqueUuids.length) {
      return [];
    }

    const locations =
      await this.prisma.organizationDigitalLibraryLocation.findMany({
        where: { uuid: { in: uniqueUuids }, organizationId, isActive: true },
        select: { id: true, uuid: true },
      });

    if (locations.length !== uniqueUuids.length) {
      throw new BadRequestException(
        'One or more Digital Library Locations are invalid',
      );
    }

    return uniqueUuids.map(
      (uuid) => locations.find((item) => item.uuid === uuid)!.id,
    );
  }

  private async replacePageSelections(
    tx: Prisma.TransactionClient,
    registrationPageId: number,
    selections: {
      sessionCourseIds?: number[];
      educationOptionIds?: number[];
      digitalLibraryLocationIds?: number[];
    },
  ) {
    if (selections.sessionCourseIds !== undefined) {
      await tx.organizationRegistrationPageCourse.deleteMany({
        where: { registrationPageId },
      });
      if (selections.sessionCourseIds.length) {
        await tx.organizationRegistrationPageCourse.createMany({
          data: selections.sessionCourseIds.map((sessionCourseId, index) => ({
            registrationPageId,
            sessionCourseId,
            sortOrder: index,
          })),
        });
      }
    }

    if (selections.educationOptionIds !== undefined) {
      await tx.organizationRegistrationPageEducationOption.deleteMany({
        where: { registrationPageId },
      });
      if (selections.educationOptionIds.length) {
        await tx.organizationRegistrationPageEducationOption.createMany({
          data: selections.educationOptionIds.map(
            (educationOptionId, index) => ({
              registrationPageId,
              educationOptionId,
              sortOrder: index,
            }),
          ),
        });
      }
    }

    if (selections.digitalLibraryLocationIds !== undefined) {
      await tx.organizationRegistrationPageDigitalLibraryLocation.deleteMany({
        where: { registrationPageId },
      });
      if (selections.digitalLibraryLocationIds.length) {
        await tx.organizationRegistrationPageDigitalLibraryLocation.createMany({
          data: selections.digitalLibraryLocationIds.map(
            (digitalLibraryLocationId, index) => ({
              registrationPageId,
              digitalLibraryLocationId,
              sortOrder: index,
            }),
          ),
        });
      }
    }
  }

  private uniqueUuids(uuids: string[]) {
    return [...new Set(uuids.map((uuid) => uuid.trim()).filter(Boolean))];
  }

  private async replaceFields(
    tx: Prisma.TransactionClient,
    registrationPageId: number,
    fields: RegistrationFieldDto[],
  ) {
    const incomingKeys = fields.map((field) => field.fieldKey);
    if (incomingKeys.length !== new Set(incomingKeys).size) {
      throw new BadRequestException('Registration field keys must be unique');
    }

    await tx.organizationRegistrationField.updateMany({
      where: {
        registrationPageId,
        fieldKey: { notIn: incomingKeys.length ? incomingKeys : [''] },
      },
      data: { isActive: false },
    });

    for (const field of fields) {
      if (field.fieldKey === 'courses') {
        throw new BadRequestException('Courses are a system field');
      }

      const saved = await tx.organizationRegistrationField.upsert({
        where: {
          registrationPageId_fieldKey: {
            registrationPageId,
            fieldKey: field.fieldKey,
          },
        },
        create: {
          registrationPageId,
          fieldKey: field.fieldKey,
          label: field.label,
          fieldType: field.fieldType,
          isRequired: field.isRequired ?? false,
          placeholder: field.placeholder,
          helpText: field.helpText,
          sortOrder: field.sortOrder ?? 0,
          isActive: field.isActive ?? true,
        },
        update: {
          label: field.label,
          fieldType: field.fieldType,
          isRequired: field.isRequired ?? false,
          placeholder: field.placeholder,
          helpText: field.helpText,
          sortOrder: field.sortOrder ?? 0,
          isActive: field.isActive ?? true,
        },
      });

      await tx.organizationRegistrationFieldOption.deleteMany({
        where: { fieldId: saved.id },
      });
      if (field.options?.length) {
        await tx.organizationRegistrationFieldOption.createMany({
          data: field.options.map((option, index) => ({
            fieldId: saved.id,
            optionKey: option.optionKey,
            label: option.label,
            sortOrder: option.sortOrder ?? index,
            isActive: option.isActive ?? true,
          })),
        });
      }
    }
  }

  private toUpdateInput(dto: UpdateRegistrationPageDto) {
    return {
      sessionId: dto.sessionId,
      slug: dto.slug,
      title: dto.title,
      description: dto.description,
      logoOverride: dto.logoOverride,
      heroImage: dto.heroImage,
      primaryColor: dto.primaryColor,
      accentColor: dto.accentColor,
      supportEmail: dto.supportEmail,
      supportPhone: dto.supportPhone,
      submitButtonText: dto.submitButtonText,
      successTitle: dto.successTitle,
      successMessage: dto.successMessage,
      registrationEnabled: dto.registrationEnabled,
      status: dto.status,
      isActive: dto.isActive,
    };
  }

  private async toAdminResponse(page: RegistrationPageWithRelations) {
    const courses = await this.findEligibleSessionCourses(page);

    return {
      id: page.id,
      uuid: page.uuid,
      organizationId: page.organizationId,
      sessionId: page.sessionId,
      slug: page.slug,
      title: page.title,
      description: page.description,
      logoOverride: page.logoOverride,
      heroImage: page.heroImage,
      primaryColor: page.primaryColor,
      accentColor: page.accentColor,
      supportEmail: page.supportEmail,
      supportPhone: page.supportPhone,
      submitButtonText: page.submitButtonText,
      successTitle: page.successTitle,
      successMessage: page.successMessage,
      registrationEnabled: page.registrationEnabled,
      status: page.status,
      isActive: page.isActive,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      organization: {
        id: page.organization.id,
        name: page.organization.name,
        code: page.organization.code,
        logo: page.organization.logo,
      },
      session: {
        id: page.session.id,
        name: page.session.name,
        code: page.session.code,
        status: page.session.status,
      },
      fields: this.toFieldResponses(page.fields),
      selectedSessionCourseUuids: page.selectedCourses.map(
        (selection) => selection.sessionCourse.uuid,
      ),
      selectedEducationOptionUuids: page.selectedEducationOptions.map(
        (selection) => selection.educationOption.uuid,
      ),
      selectedDigitalLibraryLocationUuids:
        page.selectedDigitalLibraryLocations.map(
          (selection) => selection.digitalLibraryLocation.uuid,
        ),
      courses: courses.map((sessionCourse) => ({
        id: sessionCourse.id,
        uuid: sessionCourse.uuid,
        name: sessionCourse.displayName ?? sessionCourse.course.name,
        courseCode: sessionCourse.course.code,
      })),
    };
  }

  private toFieldResponses(fields: RegistrationPageWithRelations['fields']) {
    return fields.map((field) => ({
      id: field.id,
      uuid: field.uuid,
      fieldKey: field.fieldKey,
      label: field.label,
      fieldType: field.fieldType,
      isRequired: field.isRequired,
      placeholder: field.placeholder,
      helpText: field.helpText,
      sortOrder: field.sortOrder,
      isActive: field.isActive,
      options: field.options.map((option) => ({
        id: option.id,
        uuid: option.uuid,
        optionKey: option.optionKey,
        label: option.label,
        sortOrder: option.sortOrder,
        isActive: option.isActive,
      })),
    }));
  }

  private publicCustomFields(fields: RegistrationPageWithRelations['fields']) {
    return fields.filter(
      (field) =>
        !['education', 'library_location', 'digital_library_location'].includes(
          field.fieldKey,
        ),
    );
  }

  private findConfiguredSessionCourses(
    page: RegistrationPageWithRelations,
  ): Promise<RegistrationSessionCourse[]> {
    const uuids = page.selectedCourses.map(
      (selection) => selection.sessionCourse.uuid,
    );
    if (!uuids.length) {
      return Promise.resolve([] as RegistrationSessionCourse[]);
    }
    return this.findEligibleSessionCourses(page, uuids);
  }

  private findConfiguredEducationOptions(
    page: RegistrationPageWithRelations,
  ): Promise<RegistrationEducationOption[]> {
    const ids = page.selectedEducationOptions.map(
      (selection) => selection.educationOptionId,
    );
    if (!ids.length) {
      return Promise.resolve([] as RegistrationEducationOption[]);
    }
    return this.prisma.organizationEducationOption.findMany({
      where: {
        id: { in: ids },
        organizationId: page.organizationId,
        isActive: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  private findConfiguredDigitalLibraryLocations(
    page: RegistrationPageWithRelations,
  ): Promise<RegistrationDigitalLibraryLocation[]> {
    const ids = page.selectedDigitalLibraryLocations.map(
      (selection) => selection.digitalLibraryLocationId,
    );
    if (!ids.length) {
      return Promise.resolve([] as RegistrationDigitalLibraryLocation[]);
    }
    return this.prisma.organizationDigitalLibraryLocation.findMany({
      where: {
        id: { in: ids },
        organizationId: page.organizationId,
        isActive: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  private findConfiguredEducationOption(
    page: RegistrationPageWithRelations,
    uuid: string,
  ) {
    const configuredUuids = new Set(
      page.selectedEducationOptions.map(
        (selection) => selection.educationOption.uuid,
      ),
    );
    if (!configuredUuids.has(uuid)) {
      return Promise.resolve(null);
    }
    return this.findActiveEducationOption(page.organizationId, uuid);
  }

  private findConfiguredDigitalLibraryLocation(
    page: RegistrationPageWithRelations,
    uuid: string,
  ) {
    const configuredUuids = new Set(
      page.selectedDigitalLibraryLocations.map(
        (selection) => selection.digitalLibraryLocation.uuid,
      ),
    );
    if (!configuredUuids.has(uuid)) {
      return Promise.resolve(null);
    }
    return this.findActiveDigitalLibraryLocation(page.organizationId, uuid);
  }

  private findActiveEducationOptions(organizationId: number) {
    return this.prisma.organizationEducationOption.findMany({
      where: { organizationId, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  private findActiveDigitalLibraryLocations(organizationId: number) {
    return this.prisma.organizationDigitalLibraryLocation.findMany({
      where: { organizationId, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  private findActiveEducationOption(organizationId: number, uuid: string) {
    return this.prisma.organizationEducationOption.findFirst({
      where: { uuid, organizationId, isActive: true },
    });
  }

  private findActiveDigitalLibraryLocation(
    organizationId: number,
    uuid: string,
  ) {
    return this.prisma.organizationDigitalLibraryLocation.findFirst({
      where: { uuid, organizationId, isActive: true },
    });
  }

  private async findEducationOption(organizationId: number, id: number) {
    const option = await this.prisma.organizationEducationOption.findFirst({
      where: { id, organizationId },
    });
    if (!option) {
      throw new NotFoundException('Education option not found');
    }
    return option;
  }

  private async findDigitalLibraryLocation(organizationId: number, id: number) {
    const location =
      await this.prisma.organizationDigitalLibraryLocation.findFirst({
        where: { id, organizationId },
      });
    if (!location) {
      throw new NotFoundException('Digital Library Location not found');
    }
    return location;
  }

  private async ensureEducationNameIsUnique(
    organizationId: number,
    name: string,
    excludeId?: number,
  ) {
    const existing = await this.prisma.organizationEducationOption.findFirst({
      where: {
        organizationId,
        name,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Education option already exists');
    }
  }

  private async ensureLocationNameIsUnique(
    organizationId: number,
    name: string,
    excludeId?: number,
  ) {
    const existing =
      await this.prisma.organizationDigitalLibraryLocation.findFirst({
        where: {
          organizationId,
          name,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: { id: true },
      });
    if (existing) {
      throw new ConflictException('Digital Library Location already exists');
    }
  }

  private normalizeMasterQuery(query: RegistrationMasterQueryDto) {
    return {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search?.trim() ?? '',
      isActive: query.isActive,
    };
  }

  private masterWhere(
    organizationId: number,
    query: ReturnType<RegistrationService['normalizeMasterQuery']>,
  ) {
    return {
      organizationId,
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
      ...(query.search ? { name: { contains: query.search } } : {}),
    };
  }

  private toMasterList<
    T extends {
      id: number;
      uuid: string;
      organizationId: number;
      name: string;
      sortOrder: number;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    },
  >(
    items: T[],
    total: number,
    query: ReturnType<RegistrationService['normalizeMasterQuery']>,
  ) {
    return {
      items: items.map((item) => this.toMasterOptionResponse(item)),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  private toMasterOptionResponse(option: {
    id: number;
    uuid: string;
    organizationId: number;
    name: string;
    sortOrder: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: option.id,
      uuid: option.uuid,
      organizationId: option.organizationId,
      name: option.name,
      sortOrder: option.sortOrder,
      isActive: option.isActive,
      createdAt: option.createdAt,
      updatedAt: option.updatedAt,
    };
  }

  private toPublicMasterOptionResponse(option: { uuid: string; name: string }) {
    return {
      uuid: option.uuid,
      name: option.name,
    };
  }

  private profileInput(dto: PublicRegistrationSubmitDto) {
    return {
      firstName: dto.firstName,
      lastName: dto.lastName,
      dateOfBirth: new Date(dto.dateOfBirth),
      gender: dto.gender,
      phone: dto.phone,
    };
  }

  private successMessage(page: RegistrationPageWithRelations) {
    return (
      page.successMessage ??
      `Your registration with ${page.organization.name} has been completed successfully.`
    );
  }

  private defaultFields(): RegistrationFieldDto[] {
    return [];
  }

  private assertCanAccessOrganization(
    organizationId: number,
    actor: CurrentUser,
  ) {
    if (actor.roles?.includes('SUPER_ADMIN')) {
      return;
    }
    if (!actor.organizationId || actor.organizationId !== organizationId) {
      throw new ForbiddenException('Cannot access another organization');
    }
  }
}
