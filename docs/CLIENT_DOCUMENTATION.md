# LMS Client Documentation

**Audience:** Client administrators, academic coordinators, instructors, and support users
**Purpose:** Explain what the LMS does and how its major parts work together

## 1. What the LMS provides

The LMS organizes courses and learning resources, manages students and instructors, supports configurable registration, delivers examinations, and reports learner activity and progress.

## 2. Main areas of the system

### Organization management

An organization represents the client’s learning environment. It provides the boundary for users, students, sessions, courses, registration settings, content, examinations, files, and reporting policies.

### Users, roles, and permissions

Users are staff or administrators who operate the platform. Roles group permissions, and permissions control specific capabilities. A user may have different role assignments depending on the organization.

### Sessions and courses

A course is the reusable subject or program definition. A session is a learning period or cohort. A session course is the actual course offering for a particular session. This allows one course to be reused across multiple cohorts while keeping each offering separate.

### Folders and resources

Folders organize content within a session course. Folders can be nested. Resources are the actual learning items, such as videos, documents, links, or exam resources. This structure lets staff maintain a clear learning library.

### Students and enrollment

A student is the learner record. The student profile stores additional learner information, while preferences store personal settings. Enrollment connects the learner to an organization and session; course enrollment then connects the learner to a specific session course.

### Progress and notifications

The platform records course progress, video progress, and learner notifications. These records support dashboards and help learners continue from their previous learning position.

### Registration forms

Administrators can configure registration pages with fields and selectable options. Pages can expose available courses, education options, and digital-library locations. Submitted answers are stored against the registering student.

### Examinations

Examinations are built from question content and reusable templates. A template can have versions, slots, sections, subjects, and questions. A published exam selects the required structure. Student attempts record navigation, answers, timing, marks, and reporting details.

### Activity and reporting

Activity tracking records sign-in attempts, user sessions, resource usage, document page visits, video positions, and learner events. This supports engagement reporting and operational auditing.

### File storage

Files are managed through a storage layer that can use the configured storage provider. The system can store course thumbnails, resource documents and thumbnails, student avatars, and other managed objects without exposing storage implementation details to users.

## 3. How the areas work together

```text
Organization
  ├── Session
  │     └── Session Course
  │            ├── Folders
  │            │     └── Resources
  │            ├── Student enrollments
  │            └── Course progress
  ├── Users and permissions
  ├── Students
  ├── Registration pages
  ├── Exams and reports
  └── Activity and storage
```

### Example learner journey

1. An administrator creates a session and makes courses available.
2. A registration page collects student information and course choices.
3. The student is enrolled in the organization, session, and selected courses.
4. Instructors or administrators organize folders and publish resources.
5. The student opens resources and the platform records progress and activity.
6. The student takes an assigned examination.
7. Staff use dashboards and reports to review participation and results.

## 4. Relationship explanations in business terms

| Business relationship | Meaning |
|---|---|
| Organization → Session | One client organization can run multiple learning periods or cohorts. |
| Session → Session Course | A session can offer multiple courses. |
| Course → Session Course | One reusable course can be offered in multiple sessions. |
| Session Course → Folder | Each course offering has its own content organization. |
| Folder → Resource | A folder contains learning items. |
| Student → Enrollment | A learner can have enrollment records for learning periods. |
| Enrollment → Course Enrollment | An enrollment can include multiple courses. |
| Student → Progress | The platform can track a learner’s progress separately for each course and resource. |
| User → Role → Permission | Staff access is controlled through assigned roles and capabilities. |
| Exam Template → Exam | A reusable exam design can be used to publish an exam. |
| Student → Exam Attempt | A learner’s attempt stores their activity, answers, timing, and outcome. |
| Student → Activity | Learner sessions and events support engagement and audit reporting. |

## 5. Typical user responsibilities

### Administrator

Maintains organization settings, users, roles, sessions, courses, registration forms, resources, examinations, and reports.

### Instructor / teacher

Works with assigned session courses, learners, resources, course progress, and teacher dashboards according to granted permissions.

### Student

Completes registration, accesses enrolled courses, consumes resources, tracks personal progress, receives notifications, and completes examinations.

## 6. Client data and security notes

- Access is controlled by login, roles, and permissions.
- Organization-scoped records are separated by client organization.
- Activity records support security review and learner engagement reporting.
- File credentials and infrastructure secrets are not part of this document and must be managed by the client’s technical administrators.
- Data retention settings for activity and authentication records are configurable at organization level.

## 7. Support vocabulary

| Term | Simple definition |
|---|---|
| Organization | The client’s LMS tenant or learning environment |
| Session | A cohort, academic period, or delivery period |
| Course | A reusable learning program definition |
| Session Course | A course offered to a specific session/cohort |
| Resource | A learning item such as a video, document, link, or exam |
| Enrollment | A learner’s connection to an organization/session |
| Exam Attempt | One learner’s execution of an examination |
| Activity Event | A recorded learner or system action used for reporting |

## 8. Client onboarding checklist

- Confirm organization name and administrators.
- Define user roles and access responsibilities.
- Configure sessions and courses.
- Prepare folder and resource structure.
- Configure registration fields and selectable options.
- Confirm student enrollment process.
- Configure examinations and result release rules.
- Review dashboards and reports.
- Confirm support, retention, backup, and escalation contacts.
