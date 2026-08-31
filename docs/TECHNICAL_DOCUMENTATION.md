# LMS Technical Documentation

**Status:** Initial code-based documentation
**Reviewed:** 2026-08-30
**Audience:** Engineering, QA, DevOps, support engineering

## 1. Scope and source of truth

This document describes the system from the repository currently available. The primary sources are:

- Backend NestJS modules under `backend/src/modules`.
- Prisma schema modules under `backend/prisma/schema`.
- Prisma migrations under `backend/prisma/migrations`.
- Frontend Next.js application and shared packages under `frontend`.
- Deployment configuration under `deployment`, `DEPLOYMENT.md`, and `render.yaml`.

The Prisma schema is the authoritative source for database names, columns, constraints, foreign keys, and delete behavior. This document does not include secrets from environment files.

## 2. High-level architecture

The repository is a monorepo-style LMS with a web client and a NestJS API.

```text
Browser / mobile-capable UI
        |
        v
Next.js web app + shared API/auth/types/validation/UI packages
        |
        v
NestJS REST API
  global JWT guard -> permission guard -> role guard
        |
        +--> domain services and repositories
        +--> Prisma service
        +--> object storage abstraction (local or Utho)
        +--> Swagger, logging, throttling, validation
        |
        v
Relational database managed by Prisma migrations
```

The backend bootstraps configuration, logging, throttling, Prisma, storage, authentication, RBAC, organization management, sessions, courses, folders, resources, dashboards, exams, registration, teacher functions, students, users, and activity tracking in `backend/src/app.module.ts`.

## 3. Backend modules and relationships

| Module | Responsibility | Main relationships |
|---|---|---|
| Auth | Login, JWT access/refresh tokens, password handling, request identity | `User`, `Student`, `RefreshToken`, authentication activity |
| Organization | Tenant/organization management | Parent of users, sessions, students, exams, registration, policies, storage |
| Users | User CRUD and user-facing administration | `Organization`, `UserRole`, instructor assignments |
| Roles / Permissions | Role-based and permission-based authorization | `Role` ↔ `Permission` through `RolePermission`; users through `UserRole` |
| Session | Academic/session lifecycle | Belongs to `Organization`; contains `SessionCourse`, exams, enrollments, registration pages |
| Course | Course catalog and pricing/status | Connected to `SessionCourse`; optional thumbnail `StoredObject` |
| Session Course | Course offering in a specific session | Connects `Session`, `Course`, folders, enrollments, instructors, progress, registration, activity |
| Folder | Hierarchical course content organization | Belongs to `SessionCourse`; self-referencing parent/child hierarchy; contains resources |
| Resource | Learning content and exam-linked content | Belongs to `Folder` and `ResourceType`; optional `Exam` and storage objects |
| Students | Profiles, enrollment, learning progress, notifications | Connects students to users, organizations, sessions, courses, resources, activity |
| Dashboard / Teacher | Aggregated operational and teacher views | Reads organization, course, enrollment, resource, and activity relationships |
| Registration | Configurable organization registration forms | Registration pages connect sessions, fields, options, courses, education and library choices, and student answers |
| Exam | Question bank, templates, delivery, imports, attempts, grading/reporting | Connects organizations, sessions, resources, courses, questions, and students |
| Activity | Authentication, login sessions, resource activity, page activity, events, retention/reporting | Cross-cutting links to organization, user, student, course, resource, and exam attempt |
| Storage | Provider-independent object lifecycle | `StoredObject` is referenced by thumbnails, documents, avatars, and uploads |

### 3.1 Request and authorization flow

1. The frontend API client sends credentials or a bearer token.
2. The global JWT guard authenticates protected requests.
3. The permissions guard evaluates endpoint permissions.
4. The roles guard evaluates role requirements.
5. The controller validates DTO input and delegates to a service.
6. The service applies business rules and calls a repository/Prisma.
7. The response interceptor normalizes the API response.

Auth, permissions, and roles are global application guards, so a new endpoint must explicitly account for the authorization behavior.

## 4. Frontend modules

The web application is a Next.js app in `frontend/apps/web`. Shared packages reduce duplication across web and mobile-capable code:

| Package / area | Purpose |
|---|---|
| `@repo/api` | Axios client, interceptors, query client, and resource-specific API functions |
| `@repo/auth` | Auth state, token storage, session bootstrap, navigation, and auth API |
| `@repo/types` | Shared TypeScript domain and API types |
| `@repo/validation` | Zod/form validation schemas for users, students, sessions, roles, resources, organizations, folders, and courses |
| `@repo/hooks` | Shared UI/query state helpers |
| `@repo/ui` | Shared React/Tamagui UI components |
| `apps/web/src/features` | Feature pages and components for dashboard, teacher, students, courses, sessions, resources, exams, registration, users, and administration |
| `apps/mobile` | Mobile application shell/assets and shared-package consumer |

Frontend API resource clients exist for users, teachers, students, sessions, session courses, roles, resources, registration, permissions, organizations, folders, exams, dashboards, courses, and activity reports.

## 5. Database model catalog

The physical table name is shown in parentheses. All models have an integer auto-increment primary key unless their schema states otherwise. Many business entities also expose a UUID.

### 5.1 Tenant, identity, and RBAC

| Model / table | Purpose | Important links |
|---|---|---|
| `Organization` (`organizations`) | Tenant boundary and organization settings | Parent of users, sessions, students, exams, registration, storage, policies |
| `User` (`users`) | Staff/admin identity | Optional organization; has refresh tokens, roles, activity, uploads, course instructor links |
| `RefreshToken` (`refresh_tokens`) | Rotatable login token record | Required `User`; optional `UserActivitySession`; cascades with user |
| `Role` (`roles`) | Organization-scoped/global role definition | Has `RolePermission` and `UserRole` records |
| `Permission` (`permissions`) | Atomic capability | Has `RolePermission` records |
| `RolePermission` (`role_permissions`) | Role-permission join table | Required role and permission; cascade delete |
| `UserRole` (`user_roles`) | User-role assignment, optionally organization-scoped | Required user and role; optional organization; cascade delete |

### 5.2 Academic structure and learning content

| Model / table | Purpose | Important links |
|---|---|---|
| `Session` (`sessions`) | Academic/cohort period | Required organization; has session courses, enrollments, exams, registration pages |
| `Course` (`courses`) | Reusable course catalog entity | Has session courses; optional stored thumbnail |
| `SessionCourse` (`session_courses`) | Course offering within a session | Required session and course; parent of folders, enrollments, instructors, progress |
| `Folder` (`folders`) | Course content tree node | Required session course; optional parent folder; parent of resources |
| `ResourceType` (`resource_types`) | Lookup/classification for content | Parent of resources |
| `Resource` (`resources`) | Video, document, link, or exam learning item | Required folder and resource type; optional exam/document/thumbnail objects |
| `StoredObject` (`stored_objects`) | Provider-neutral file metadata | Optional organization/uploader; referenced by resource documents/thumbnails, course thumbnails, student avatars |

### 5.3 Student and learning progress

| Model / table | Purpose | Important links |
|---|---|---|
| `Student` (`students`) | Learner record | Required user; optional organization; parent of profile, preferences, enrollments, progress, notifications, attempts, activity |
| `StudentProfile` (`student_profiles`) | Extended learner details | One-to-one with student; optional avatar object |
| `StudentPreference` (`student_preferences`) | Learner settings | One-to-one with student |
| `StudentEnrollment` (`student_enrollments`) | Student enrollment in an organization/session | Required student, organization, session; parent of course enrollments |
| `StudentCourseEnrollment` (`student_course_enrollments`) | Enrollment in a session course | Required enrollment and session course |
| `CourseInstructor` (`course_instructors`) | Instructor assignment | Required session course and user |
| `StudentCourseProgress` (`student_course_progress`) | Per-student course-offering progress | Required student and session course; optional last accessed resource |
| `StudentVideoProgress` (`student_video_progress`) | Video position/completion state | Required student and resource |
| `StudentNotification` (`student_notifications`) | Learner notification | Required student and organization |

### 5.4 Registration

Registration models support configurable forms and selection lists:

`OrganizationRegistrationPage` → `OrganizationRegistrationField` → `OrganizationRegistrationFieldOption` defines the form. `OrganizationRegistrationAnswer` stores student answers. Page-course, page-education-option, and page-digital-library-location join tables connect selectable choices to a page. Organization-owned education options and digital-library locations provide the reusable option catalogs.

### 5.5 Examination

The exam domain has four layers:

1. **Question bank:** `Question`, `QuestionVersion`, `QuestionType`, `Subject`, `Topic`, `QuestionComprehension`, `QuestionOption`, `QuestionAcceptedAnswer`.
2. **Reusable exam design:** `ExamTemplate`, `ExamTemplateVersion`, `ExamTemplateSlot`, `ExamTemplateSection`, `ExamTemplateSectionSubject`, `ExamTemplateQuestion`.
3. **Published delivery:** `Exam`, `ExamSelectedSlot`, `ExamSessionCourse`.
4. **Import and student execution:** `ExamImportJob`, `ExamImportFile`, `ExamImportRow`, `ExamImportError`, `StudentExamAttempt`, `StudentExamSlotAttempt`, `StudentExamSectionAttempt`, `StudentExamAttemptQuestion`, `StudentExamAnswer`, `StudentExamAnswerOption`.

### 5.6 Activity and reporting

| Model / table | Purpose | Important links |
|---|---|---|
| `OrganizationActivityPolicy` (`organization_activity_policies`) | Retention and heartbeat policy | One-to-one with organization |
| `AuthenticationAttempt` (`authentication_attempts`) | Success/failure audit trail | Optional organization, user, student |
| `UserActivitySession` (`user_activity_sessions`) | Authenticated session duration | Optional organization, user, student; parent of refresh/resource/activity records |
| `StudentResourceActivitySession` (`student_resource_activity_sessions`) | Resource-level learning session | Required organization/student; optional auth session, session course, folder, resource |
| `StudentDocumentPageActivity` (`student_document_page_activities`) | Document page visits | Required resource activity session; cascade delete |
| `StudentActivityEvent` (`student_activity_events`) | Fine-grained learner events | Required organization/student; optional auth/resource session, course, resource, exam attempt |

## 6. Relationship table details

The following table lists the foreign-key relationships visible in the Prisma schema. Cardinality is described from parent to child. `Cascade` means child records are removed with the parent; `SetNull` preserves the child and clears the reference; `Restrict` prevents deletion while dependent records exist.

| Parent | Child | FK / join | Cardinality | Delete behavior | Explanation |
|---|---|---|---|---|---|
| Organization | User | `users.organization_id` | 1 → many | SetNull | Staff can outlive an organization link. |
| Organization | Session | `sessions.organization_id` | 1 → many | Cascade | A session belongs to exactly one tenant. |
| Organization | Student | `students.organization_id` | 1 → many optional | SetNull | Learner record may be retained without a tenant link. |
| Organization | StudentEnrollment | `student_enrollments.organization_id` | 1 → many | Cascade | Enrollment is tenant-owned. |
| Session | SessionCourse | `session_courses.session_id` | 1 → many | Cascade | Offerings are part of a session. |
| Course | SessionCourse | `session_courses.course_id` | 1 → many | Cascade/defined by schema | A catalog course can be offered in multiple sessions. |
| SessionCourse | Folder | `folders.session_course_id` | 1 → many | Cascade | Deleting an offering removes its content tree. |
| Folder | Folder | `folders.parent_folder_id` | 1 → many | SetNull | Self-relation creates a tree; deleting a parent promotes children to root. |
| Folder | Resource | `resources.folder_id` | 1 → many | Cascade | Resources are owned by a folder. |
| ResourceType | Resource | `resources.resource_type_id` | 1 → many | Restrict | Lookup types cannot be removed while used. |
| Student | User | `students.user_id` | 1 → 1/optional inverse | Cascade | Student identity is anchored to a user account. |
| Student | StudentProfile | `student_profiles.student_id` | 1 → 1 | Cascade | Profile is an extension of the student. |
| Student | StudentPreference | `student_preferences.student_id` | 1 → 1 | Cascade | Preferences belong only to the student. |
| StudentEnrollment | StudentCourseEnrollment | `student_course_enrollments.enrollment_id` | 1 → many | Cascade | Course enrollments are children of the main enrollment. |
| SessionCourse | StudentCourseEnrollment | `student_course_enrollments.session_course_id` | 1 → many | Cascade | Connects learners to offerings. |
| Student | StudentCourseProgress | `student_course_progress.student_id` | 1 → many | Cascade | Progress is learner-owned. |
| SessionCourse | StudentCourseProgress | `student_course_progress.session_course_id` | 1 → many | Cascade | Progress is scoped to an offering. |
| Student | StudentVideoProgress | `student_video_progress.student_id` | 1 → many | Cascade | Stores learner video state. |
| Resource | StudentVideoProgress | `student_video_progress.resource_id` | 1 → many | Cascade | Video progress belongs to a resource. |
| Role | Permission | `role_permissions` | many ↔ many | Cascade through join | `RolePermission` is the explicit join model. |
| User | Role | `user_roles` | many ↔ many | Cascade through join | Assignments can be organization-scoped. |
| OrganizationRegistrationPage | Field | `organization_registration_fields.registration_page_id` | 1 → many | Cascade | Fields are part of a form page. |
| Field | FieldOption | `organization_registration_field_options.field_id` | 1 → many | Cascade | Options belong to a field. |
| RegistrationPage | RegistrationAnswer | `organization_registration_answers.registration_page_id` | 1 → many | Cascade | Answers belong to the form version/page. |
| Student | RegistrationAnswer | `organization_registration_answers.student_id` | 1 → many | Cascade | Answers are attributed to a learner. |
| ExamTemplate | ExamTemplateVersion | `exam_template_versions.exam_template_id` | 1 → many | Cascade | Versioning preserves template history. |
| ExamTemplateVersion | ExamTemplateSlot | `exam_template_slots.exam_template_version_id` | 1 → many | Cascade | A version defines slots. |
| ExamTemplateSlot | ExamTemplateSection | `exam_template_sections.exam_template_slot_id` | 1 → many | Cascade | A slot contains sections. |
| ExamTemplateSection | SectionSubject | `exam_template_section_subjects.exam_template_section_id` | 1 → many | Cascade | Sections can be mapped to subjects. |
| SectionSubject | ExamTemplateQuestion | `exam_template_questions.exam_template_section_subject_id` | 1 → many | Cascade | Questions are placed in a section/subject. |
| Question | QuestionVersion | `question_versions.question_id` | 1 → many | Cascade | Question content is versioned. |
| QuestionVersion | QuestionOption | `question_options.question_version_id` | 1 → many | Cascade | Options belong to a version. |
| QuestionVersion | AcceptedAnswer | `question_accepted_answers.question_version_id` | 1 → many | Cascade | Accepted answers are version-specific. |
| Exam | ExamSelectedSlot | `exam_selected_slots.exam_id` | 1 → many | Cascade | Published exams select template slots. |
| Student | StudentExamAttempt | `student_exam_attempts.student_id` | 1 → many | Cascade/defined by schema | A learner can attempt exams. |
| StudentExamAttempt | Slot/Section/Question/Answer | respective `student_exam_*_id` | 1 → many | Cascade | Execution detail is owned by the attempt. |
| StudentExamAnswer | StudentExamAnswerOption | `student_exam_answer_options.student_exam_answer_id` | 1 → many | Cascade | Supports multi-option answers. |
| StoredObject | Resource/Course/StudentProfile | object reference columns | 1 → 0/1 per named relation | SetNull | Removing a file reference does not remove the owning domain record. |
| UserActivitySession | ResourceActivitySession/Event/RefreshToken | respective session IDs | 1 → many | SetNull or defined by schema | Audit records remain when an auth session is removed. |
| StudentResourceActivitySession | DocumentPageActivity/Event | respective resource session IDs | 1 → many | Cascade for pages; SetNull for events | Page history is owned; events are retained. |

### 6.1 Key business relationship chains

**Learning content:** `Organization → Session → SessionCourse → Folder → Resource → ResourceType`.

**Learner enrollment:** `Organization → Student → StudentEnrollment → StudentCourseEnrollment → SessionCourse`.

**Learning progress:** `Student + SessionCourse → StudentCourseProgress`; `Student + Resource → StudentVideoProgress`.

**Exam delivery:** `ExamTemplate → Version → Slot → Section → SectionSubject → TemplateQuestion`; `Exam → SelectedSlot`; `Student → Attempt → SlotAttempt → SectionAttempt → AttemptQuestion → Answer`.

**Activity reporting:** `Student → UserActivitySession → StudentResourceActivitySession → StudentDocumentPageActivity`, with `StudentActivityEvent` linking the learner event to the relevant course, resource, or exam attempt.

## 7. Database conventions and operational notes

- Prisma model names use PascalCase; physical tables use explicit snake_case `@@map` names.
- Foreign keys and unique constraints are defined in Prisma and materialized by migrations.
- Exam and activity domains use restrictive deletes in places where historical/reporting integrity matters.
- Seed and maintenance scripts exist for demo data, student flows, activity retention, storage backfills, and exam reporting.
- The client-safe schema export is `deployment/client-database/lms-schema-only.sql`.
- Migrations must be deployed with `prisma migrate deploy`; do not edit an applied migration in place.

## 8. API and implementation conventions

Backend modules generally follow `controller → service → repository → Prisma`. DTOs define input/query shapes; response DTOs define public output shapes; rule files hold domain invariants that are separately unit-tested. Swagger configuration is in `backend/src/config/swagger`.

The frontend uses resource-specific API functions with TanStack Query and a shared Axios client. Auth interceptors handle token refresh and queue concurrent refresh requests.

## 9. Deployment and developer commands

The backend package targets Node `>=22 <23` and pnpm. Common commands:

```bash
pnpm install
pnpm --dir backend db:migrate:deploy
pnpm --dir backend build
pnpm --dir backend test
pnpm --dir frontend/apps/web build
```

Review `DEPLOYMENT.md` and `render.yaml` for environment-specific deployment details. Required environment values must be supplied through the deployment environment; never commit real credentials.

## 10. Open items for a production-grade revision

- Generate a visual ERD from the deployed database and compare it with Prisma.
- Add endpoint-by-endpoint request/response examples from Swagger.
- Confirm exact delete behavior for any relationship summarized as “defined by schema”.
- Document production observability dashboards, backup/restore procedures, and incident ownership.
- Record the supported user roles and permission matrix as approved by the product owner.
