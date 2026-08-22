import type { PaginatedData, PaginationQuery } from "./api";
import type { ResourceStatus, ResourceType, ResourceTypeId } from "./resource";

export type StudentResourcesSort =
  "NEWEST" | "OLDEST" | "TITLE_ASC" | "TITLE_DESC";

export interface StudentResourceCourse {
  id: number;
  courseId: number;
  name: string;
  code: string;
  sessionId: number;
  sessionName: string;
}

export interface StudentResourceSubject {
  id: number;
  name: string;
}

export interface StudentResourceUploader {
  id: number;
  name: string;
  avatar: string | null;
}

export interface StudentResourceItem {
  id: number;
  uuid: string;
  title: string;
  description: string | null;
  resourceTypeId: ResourceTypeId;
  resourceType: ResourceType;
  documentUrl: string | null;
  videoUrl: string | null;
  thumbnail: string | null;
  mimeType: string | null;
  fileSize: string | null;
  durationInSeconds: number | null;
  status: ResourceStatus;
  isDownloadable: boolean;
  createdAt: string;
  course: StudentResourceCourse;
  subject: StudentResourceSubject;
  uploadedBy: StudentResourceUploader | null;
}

export interface StudentResourcesSummary {
  total: number;
  videos: number;
  documents: number;
  exams: number;
}

export interface StudentResourceCourseOption {
  id: number;
  name: string;
}

export interface StudentResourceSubjectOption {
  id: number;
  sessionCourseId: number;
  name: string;
}

export interface StudentResourceFilterOptions {
  courses: StudentResourceCourseOption[];
  subjects: StudentResourceSubjectOption[];
  types: ResourceType[];
  statuses: ResourceStatus[];
}

export interface StudentResourceList extends PaginatedData<StudentResourceItem> {
  summary: StudentResourcesSummary;
  filters: StudentResourceFilterOptions;
}

export interface StudentResourcesQuery extends PaginationQuery {
  resourceTypeId?: ResourceTypeId;
  sessionCourseId?: number;
  folderId?: number;
  uploadedOn?: string;
  status?: ResourceStatus;
  sort?: StudentResourcesSort;
}

export type StudentResourceProgressStatus =
  "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface StudentDocumentProgress {
  percentage: number;
  status: StudentResourceProgressStatus;
  lastOpenedAt: string | null;
}

export interface StudentResourceOrganization {
  id: number;
  name: string;
  code: string | null;
}

export interface StudentRelatedResource {
  id: number;
  title: string;
  resourceTypeId: ResourceTypeId;
  resourceType: ResourceType;
  videoUrl: string | null;
  thumbnail: string | null;
}

export interface StudentDocumentNavigationItem {
  id: number;
  title: string;
}

export interface StudentDocumentNavigation {
  current: number;
  total: number;
  previous: StudentDocumentNavigationItem | null;
  next: StudentDocumentNavigationItem | null;
}

export interface StudentResourceDetail {
  id: number;
  uuid: string;
  title: string;
  description: string | null;
  resourceTypeId: ResourceTypeId;
  resourceType: ResourceType;
  fileName: string;
  mimeType: string | null;
  fileSize: string | null;
  isDownloadable: boolean;
  createdAt: string;
  course: StudentResourceCourse;
  subject: StudentResourceSubject;
  organization: StudentResourceOrganization;
  progress: StudentDocumentProgress;
  estimatedReadingMinutes: number | null;
  relatedResources: StudentRelatedResource[];
  navigation: StudentDocumentNavigation;
}

export interface StudentVideoProgress {
  currentPositionSeconds: number;
  percentage: number;
  status: StudentResourceProgressStatus;
  lastWatchedAt: string | null;
}

export interface StudentVideoInstructor {
  id: number;
  name: string;
}

export interface StudentVideoUpNextResource {
  id: number;
  title: string;
  resourceTypeId: ResourceTypeId;
  resourceType: ResourceType;
  thumbnail: string | null;
  mimeType: string | null;
  durationInSeconds: number | null;
}

export interface StudentVideoResourceDetail {
  id: number;
  uuid: string;
  title: string;
  description: string | null;
  resourceTypeId: ResourceTypeId;
  resourceType: ResourceType;
  videoUrl: string;
  thumbnail: string | null;
  mimeType: string | null;
  durationInSeconds: number | null;
  course: StudentResourceCourse;
  subject: StudentResourceSubject;
  organization: StudentResourceOrganization;
  instructor: StudentVideoInstructor | null;
  progress: StudentVideoProgress;
  upNext: StudentVideoUpNextResource[];
}

export interface UpdateStudentVideoProgressRequest {
  currentPositionSeconds: number;
  ended?: boolean;
}

export type StudentExamAvailability =
  "AVAILABLE" | "UPCOMING" | "CLOSED" | "UNAVAILABLE";

export interface StudentFolderExamSummary {
  id: number;
  code: string;
  status: string;
  availability: StudentExamAvailability;
  availableFrom: string;
  availableUntil: string;
  durationMinutes: number;
  attemptLimit: number;
  attemptsUsed: number;
  questionCount: number;
  maximumMarks: number;
}

export interface StudentFolderResourceItem extends Omit<
  StudentResourceItem,
  "course" | "subject" | "uploadedBy"
> {
  progressStatus: StudentResourceProgressStatus | null;
  progressPercentage: number | null;
  exam: StudentFolderExamSummary | null;
}

export interface StudentFolderContext {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
}

export interface StudentFolderResourcesQuery extends PaginationQuery {
  resourceTypeId?: ResourceTypeId;
  uploadedOn?: string;
  sort?: StudentResourcesSort;
}

export interface StudentFolderResourceList extends PaginatedData<StudentFolderResourceItem> {
  course: StudentResourceCourse;
  folder: StudentFolderContext;
  summary: StudentResourcesSummary;
  filters: { types: ResourceType[] };
}

export interface StudentExamSectionSummary {
  id: number;
  code: string;
  name: string;
  durationMinutes: number;
  subjects: string[];
  questionCount: number;
  maximumMarks: number;
}

export interface StudentExamResourceDetail {
  id: number;
  uuid: string;
  title: string;
  description: string | null;
  resourceTypeId: ResourceTypeId;
  resourceType: ResourceType;
  course: StudentResourceCourse;
  folder: StudentFolderContext;
  organization: StudentResourceOrganization;
  exam: StudentFolderExamSummary & {
    title: string;
    instructions: string | null;
    sections: StudentExamSectionSummary[];
  };
}
